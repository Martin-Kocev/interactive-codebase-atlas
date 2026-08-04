#!/usr/bin/env node
/**
 * serve-atlas.mjs — zero-dependency static server for the atlas directory,
 * plus the one endpoint that makes reading progress outlive a browser.
 *
 *   node serve-atlas.mjs [atlas-path] [port]
 *
 * Binds to 127.0.0.1 only. Serves nothing outside the atlas directory.
 *
 * Progress API (see assets/progress.js for the client half):
 *   GET  /api/progress   → progress/progress.json, or {} when there is none yet
 *   PUT  /api/progress   → merge the posted document into that file
 *   PUT  /api/progress?mode=replace → overwrite it (what "Reset progress" sends)
 *
 * The merge is per item, newest `updatedAt` wins. Two tabs open on the same
 * atlas therefore combine rather than clobber — without it, whichever tab saved
 * last would silently erase everything the other one had recorded.
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const root = path.resolve(args[0] && !/^\d+$/.test(args[0]) ? args[0] : '.');
const port = Number(args.find((a) => /^\d+$/.test(a)) ?? 4173);
const instanceToken = process.env.ATLAS_INSTANCE_TOKEN ?? '';

if (!existsSync(path.join(root, 'index.html'))) {
  console.error(`serve-atlas: no index.html in ${root}`);
  process.exit(2);
}

/* `ATLAS_PROGRESS_FILE` redirects the store elsewhere. The screenshot script
   sets it to a throwaway path: a capture run browses every view, and every view
   opened is progress recorded — without this, taking screenshots would quietly
   mark half the atlas as started on the reader's behalf. */
const PROGRESS_FILE = process.env.ATLAS_PROGRESS_FILE
  ? path.resolve(process.env.ATLAS_PROGRESS_FILE)
  : path.join(root, 'progress', 'progress.json');
const PROGRESS_DIR = path.dirname(PROGRESS_FILE);
const MAX_BODY = 4 * 1024 * 1024; // a progress document is kilobytes; this is a wall, not a budget

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.md': 'text/plain; charset=utf-8',
};

/* --------------------------------------------------------------- progress -- */

function readProgress() {
  if (!existsSync(PROGRESS_FILE)) return null;
  try {
    const parsed = JSON.parse(readFileSync(PROGRESS_FILE, 'utf8'));
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null; // a hand-mangled file must not take the atlas down
  }
}

/** Write via a temp file and rename, so a crash mid-write cannot truncate it. */
function writeProgress(doc) {
  mkdirSync(PROGRESS_DIR, { recursive: true });
  const tmp = PROGRESS_FILE + '.tmp';
  writeFileSync(tmp, JSON.stringify(doc, null, 2) + '\n', 'utf8');
  renameSync(tmp, PROGRESS_FILE);
}

const stamp = (item) => Date.parse(item?.updatedAt ?? '') || 0;

/**
 * Per-item newest-wins. Top-level scalars (depth preference, theme, last
 * location) take the incoming value — they are a single reader's current
 * intent, not accumulated history, so last write is the right answer there.
 */
function mergeProgress(stored, incoming) {
  if (!stored) return incoming;
  const out = { ...stored, ...incoming };
  const items = { ...(stored.items ?? {}) };
  for (const [id, item] of Object.entries(incoming.items ?? {})) {
    if (!items[id] || stamp(item) >= stamp(items[id])) items[id] = item;
  }
  out.items = items;
  return out;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(new Error('too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const json = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
};

async function handleProgress(req, res, query) {
  if (req.method === 'GET') {
    return json(res, 200, readProgress() ?? {});
  }
  if (req.method === 'PUT' || req.method === 'POST') {
    let incoming;
    try {
      incoming = JSON.parse(await readBody(req));
    } catch (e) {
      return json(res, 400, { error: e.message === 'too large' ? 'body too large' : 'invalid JSON' });
    }
    if (!incoming || typeof incoming !== 'object' || typeof incoming.items !== 'object') {
      return json(res, 400, { error: 'not a progress document' });
    }
    const doc = query.get('mode') === 'replace' ? incoming : mergeProgress(readProgress(), incoming);
    try {
      writeProgress(doc);
    } catch (e) {
      return json(res, 500, { error: 'could not write progress/progress.json: ' + e.message });
    }
    return json(res, 200, doc);
  }
  res.writeHead(405, { allow: 'GET, PUT' }).end();
  return undefined;
}

/* ----------------------------------------------------------------- static -- */

const server = createServer((req, res) => {
  if (instanceToken) res.setHeader('x-atlas-instance', instanceToken);
  const [rawPath, rawQuery] = (req.url ?? '/').split('?');
  const url = decodeURIComponent(rawPath);
  const query = new URLSearchParams(rawQuery ?? '');

  if (url === '/api/progress') {
    void handleProgress(req, res, query);
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { allow: 'GET, HEAD' }).end();
    return;
  }

  let target = path.resolve(root, '.' + url);

  // Never serve outside the atlas directory.
  if (target !== root && !target.startsWith(root + path.sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  if (existsSync(target) && statSync(target).isDirectory()) {
    target = path.join(target, 'index.html');
  }
  if (!existsSync(target)) {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
    return;
  }
  res.writeHead(200, {
    'content-type': TYPES[path.extname(target).toLowerCase()] ?? 'application/octet-stream',
    'cache-control': 'no-store',
  });
  createReadStream(target).pipe(res);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`serve-atlas: port ${port} is in use — pass a different port`);
    process.exit(1);
  }
  throw e;
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Codebase Atlas  →  http://127.0.0.1:${port}`);
  console.log(`serving         ${root}`);
  console.log(`progress        ${PROGRESS_FILE}${existsSync(PROGRESS_FILE) ? '' : ' (not created yet)'}`);
  console.log('Ctrl+C to stop.');
});

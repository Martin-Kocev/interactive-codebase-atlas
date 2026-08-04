/**
 * The progress API — runs on plain Node, no dependencies.
 *
 *   node --test tests/progress.api.test.mjs
 *
 * These guard the promise the storage chip makes: that reading progress lives
 * in a file on disk, survives a wiped browser, and is not silently erased by a
 * second tab. The server is started on a throwaway port against a temporary
 * copy of the atlas root, so a test run never touches real progress.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath, not .pathname: a directory name containing a space arrives
// percent-encoded in the URL and would produce a path that does not exist.
const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const packagedServe = path.resolve(root, '..', 'scripts', 'serve-atlas.mjs');
const serve = existsSync(path.join(root, 'scripts', 'serve-atlas.mjs'))
  ? path.join(root, 'scripts', 'serve-atlas.mjs')
  : packagedServe;

let dir;
let child;
let base;

const doc = (items, extra = {}) => ({ storeVersion: 1, items, ...extra });
const item = (state, updatedAt) => ({
  state, bookmarked: false, unclear: false, firstOpenedAt: updatedAt,
  lastOpenedAt: updatedAt, completedAt: null, seenHash: null, openCount: 1, updatedAt,
});

const put = (body, query = '') =>
  fetch(`${base}/api/progress${query}`, {
    method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
const get = () => fetch(`${base}/api/progress`).then((r) => r.json());

before(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'atlas-progress-'));
  writeFileSync(path.join(dir, 'index.html'), '<!doctype html><title>t</title>');
  const port = 4300 + Math.floor(Math.random() * 400);
  base = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, [serve, dir, String(port)], { stdio: 'ignore' });
  // Poll rather than sleep: the server is up when it answers, not after a guess.
  for (let i = 0; i < 60; i += 1) {
    try { await fetch(`${base}/api/progress`); return; } catch { await new Promise((r) => setTimeout(r, 50)); }
  }
  throw new Error('serve-atlas did not start');
});

after(() => {
  child?.kill();
  if (dir && existsSync(dir)) rmSync(dir, { recursive: true, force: true });
});

test('an atlas with no progress yet answers with an empty document', async () => {
  assert.deepEqual(await get(), {});
});

test('a saved document is written to progress/progress.json and read back', async () => {
  const res = await put(doc({ 'component-spa': item('completed', '2026-08-03T10:00:00.000Z') }));
  assert.equal(res.status, 200);

  const onDisk = JSON.parse(readFileSync(path.join(dir, 'progress', 'progress.json'), 'utf8'));
  assert.equal(onDisk.items['component-spa'].state, 'completed');

  // This is the whole point: a different browser, with no localStorage at all,
  // asks the server and gets the same reading history back.
  const fresh = await get();
  assert.equal(fresh.items['component-spa'].state, 'completed');
});

test('a second tab merges rather than clobbering', async () => {
  await put(doc({ 'entity-text': item('completed', '2026-08-03T11:00:00.000Z') }));
  const after = await get();
  assert.equal(after.items['component-spa'].state, 'completed', 'the first tab\'s work survived');
  assert.equal(after.items['entity-text'].state, 'completed', 'the second tab\'s work landed');
});

test('the newer version of the same item wins, in either arrival order', async () => {
  await put(doc({ 'component-spa': item('viewed', '2026-08-03T09:00:00.000Z') })); // older
  assert.equal((await get()).items['component-spa'].state, 'completed', 'a stale write must not win');

  await put(doc({ 'component-spa': item('viewed', '2026-08-03T12:00:00.000Z') })); // newer
  assert.equal((await get()).items['component-spa'].state, 'viewed', 'a fresher write must win');
});

test('reset replaces instead of merging — otherwise nothing could be cleared', async () => {
  await put(doc({}), '?mode=replace');
  assert.deepEqual((await get()).items, {});
});

test('a malformed body is refused and leaves the stored document alone', async () => {
  await put(doc({ 'entity-text': item('completed', '2026-08-03T13:00:00.000Z') }));
  const bad = await fetch(`${base}/api/progress`, {
    method: 'PUT', headers: { 'content-type': 'application/json' }, body: '{not json',
  });
  assert.equal(bad.status, 400);

  const notADocument = await put({ nope: true });
  assert.equal(notADocument.status, 400);

  assert.equal((await get()).items['entity-text'].state, 'completed');
});

test('the static server still refuses to serve outside the atlas directory', async () => {
  const res = await fetch(`${base}/../../etc/passwd`);
  assert.ok([403, 404].includes(res.status), `expected 403/404, got ${res.status}`);
});

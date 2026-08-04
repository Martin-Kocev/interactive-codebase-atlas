#!/usr/bin/env node
/**
 * Capture the atlas views required for visual review without touching the
 * reader's progress. Every capture gets a fresh browser context and an empty
 * throwaway progress document, so focus mode, scroll restoration, bookmarks,
 * and completion state cannot leak from one screenshot into the next.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createServer as createProbeServer } from 'node:net';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const root = path.resolve(args.find((a) => !a.startsWith('--')) ?? '.');
const requestedPort = args.includes('--port') ? Number(args[args.indexOf('--port') + 1]) : null;
async function availablePort(preferred) {
  return new Promise((resolve, reject) => {
    const probe = createProbeServer();
    probe.once('error', reject);
    probe.listen(preferred ?? 0, '127.0.0.1', () => {
      const address = probe.address();
      const selected = typeof address === 'object' && address ? address.port : preferred;
      probe.close((error) => error ? reject(error) : resolve(selected));
    });
  });
}
let port;
try { port = await availablePort(requestedPort); }
catch { throw new Error(`screenshot-atlas: port ${requestedPort} is already in use; no progress was touched`); }
const keepServer = args.includes('--keep-server');
const outDir = path.join(root, 'screenshots');
const atlasPath = path.join(root, 'data', 'atlas.json');

if (!existsSync(path.join(root, 'index.html')) || !existsSync(atlasPath)) {
  console.error(`screenshot-atlas: expected index.html and data/atlas.json under ${root}`);
  process.exit(2);
}

let chromium;
try {
  const require = createRequire(import.meta.url);
  ({ chromium } = require('playwright'));
} catch {
  try { ({ chromium } = await import('playwright')); }
  catch {
    console.error(
      'screenshot-atlas: Playwright is not available.\n' +
      '  Install with: npm i -D playwright && npx playwright install chromium\n' +
      `  Or use a browser tool against http://127.0.0.1:${port}\n` +
      '  Report exactly which visual checks were skipped.'
    );
    process.exit(3);
  }
}

mkdirSync(outDir, { recursive: true });
const atlas = JSON.parse(readFileSync(atlasPath, 'utf8'));
const firstWorkflow = atlas.workflows?.find((x) => x.steps?.length);
const secondWorkflow = atlas.workflows?.find((x) => x !== firstWorkflow && x.steps?.length) ?? firstWorkflow;
const firstSubsystem = atlas.subsystems?.[0];
const firstComponent = atlas.components?.[0];
const firstArea = atlas.explorer?.groups?.[0];
const firstFile = atlas.explorer?.files?.[0];
const query = encodeURIComponent(
  atlas.glossary?.[0]?.term ?? firstComponent?.name?.split(/\s+/)[0] ?? 'main'
);

const views = [
  ['01-start-screen', '#/'],
  ['02-world-map', '#/architecture'],
  ['03-workflows', '#/workflows'],
  ['04-explorer', '#/explorer'],
  ['05-data-model', '#/data'],
  ['06-communication', '#/communication'],
  ['07-auth', '#/auth'],
  ['08-subsystems', '#/subsystems'],
  ['09-delivery', '#/delivery'],
  ['10-change-playbooks', '#/change'],
  ['11-glossary', '#/glossary'],
  ['12-open-questions', '#/questions'],
  ['13-full-tour', '#/tour'],
  ['14-search', `#/search?q=${query}`],
  ['15-bookmarks', '#/bookmarks'],
  ['16-quests', '#/quests'],
  ['17-recent-changes', '#/changed'],
  ['18-settings', '#/settings'],
  ['19-progress', '#/progress'],
];
if (firstComponent) views.push(['20-island-detail', `#/architecture/${firstComponent.id}`]);
if (firstArea) views.push(['21-area-detail', `#/explorer/${firstArea.id}`]);
if (firstFile) views.push(['22-file-detail', `#/explorer/${firstFile.id}`]);
if (firstWorkflow) views.push(['23-workflow-step', `#/workflows/${firstWorkflow.id}/0`]);
if (firstSubsystem) views.push(['24-subsystem-detail', `#/subsystems/${firstSubsystem.id}`]);
if (secondWorkflow) {
  const last = Math.max(0, secondWorkflow.steps.length - 1);
  views.push(['25-workflow-last-step', `#/workflows/${secondWorkflow.id}/${last}`]);
}

const throwawayProgress = path.join(tmpdir(), `atlas-screenshot-progress-${process.pid}.json`);
const instanceToken = `atlas-screenshot-${process.pid}-${Date.now()}`;
const server = spawn(process.execPath, [
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'serve-atlas.mjs'),
  root, String(port),
], { stdio: 'ignore', env: { ...process.env, ATLAS_PROGRESS_FILE: throwawayProgress, ATLAS_INSTANCE_TOKEN: instanceToken } });
const base = `http://127.0.0.1:${port}`;

async function waitForServer() {
  for (let i = 0; i < 80; i += 1) {
    if (server.exitCode !== null) throw new Error(`atlas server exited before binding port ${port}`);
    try {
      const res = await fetch(`${base}/index.html`);
      if (res.ok && res.headers.get('x-atlas-instance') === instanceToken) return;
    }
    catch { /* not listening yet */ }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`atlas server did not start on port ${port}`);
}

async function resetProgress() {
  const res = await fetch(`${base}/api/progress?mode=replace`, {
    method: 'PUT', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ storeVersion: 1, items: {} }),
  });
  if (!res.ok) throw new Error(`could not reset throwaway progress (${res.status})`);
}

const browser = await chromium.launch();
const results = [];

async function shoot(name, route, contextOptions, setup) {
  await resetProgress();
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${base}/index.html${route}`, { waitUntil: 'load' });
  if (setup) await setup(page);
  await page.waitForTimeout(850);
  await page.evaluate(() => window.scrollTo(0, 0));
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  results.push({ file, errors });
  await context.close();
}

try {
  await waitForServer();
  const desktop = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 };
  for (const [name, route] of views) await shoot(name, route, desktop);
  await shoot('26-focus-mode', '#/architecture', desktop, (page) => page.keyboard.press('f'));
  await shoot('27-tablet', '#/workflows', { viewport: { width: 834, height: 1112 }, deviceScaleFactor: 2 });
  await shoot('28-mobile-list', '#/architecture', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
  await shoot('29-mobile-search', `#/search?q=${query}`, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
  if (firstWorkflow) {
    await shoot('30-mobile-workflow', `#/workflows/${firstWorkflow.id}/0`, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
  }
  await shoot('31-reduced-motion', '#/architecture', { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await shoot('32-dark', '#/architecture', { viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
} finally {
  await browser.close();
  if (!keepServer) server.kill();
  try { rmSync(throwawayProgress, { force: true }); } catch { /* best effort */ }
}

const withErrors = results.filter((r) => r.errors.length);
console.log(`captured ${results.length} isolated screenshots -> ${outDir}`);
for (const result of withErrors) {
  console.log(`  console errors in ${path.basename(result.file)}:`);
  for (const message of result.errors.slice(0, 5)) console.log(`    ${message}`);
}
console.log('\nOpen every PNG. Check focal point, spacing, contrast, walls of text,');
console.log('placeholder copy, map/list parity, and whether motion has fully settled.');
process.exit(withErrors.length ? 1 : 0);

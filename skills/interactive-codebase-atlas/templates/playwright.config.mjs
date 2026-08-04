/**
 * Runner config for tests/atlas.interaction.playwright.mjs.
 *
 *   node C:/node_modules/@playwright/test/cli.js test
 *
 * The atlas has no package.json and installs nothing — Playwright is resolved
 * from the machine-wide install. The server is started for you; set ATLAS_URL
 * to point the suite at one you are already running instead.
 */
import path from 'node:path';
import { tmpdir } from 'node:os';

export default {
  testDir: './tests',
  // The suite is named *.playwright.mjs so `node --test` does not try to run it;
  // the default testMatch only looks for *.spec.* / *.test.*, hence this.
  testMatch: /.*\.playwright\.mjs$/,

  /* One worker, always. Progress is a single file in this atlas directory, and
     parallel workers would overwrite each other's reads of it — the suite would
     fail in ways that have nothing to do with the atlas. */
  workers: 1,
  fullyParallel: false,

  reporter: [['list']],
  use: {
    baseURL: process.env.ATLAS_URL ?? 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },

  /* The suite asserts about a *fresh* reader, so it clears the progress store
     before it starts. Pointed at the real one that would delete the reader's
     own reading history — so the server it starts is given a throwaway file
     instead, the same guard scripts/screenshot-atlas.mjs uses.

     `reuseExistingServer` is off for exactly this reason: attaching to a server
     someone already started would be attaching to their real progress file.
     If you set ATLAS_URL to run against your own server, the suite WILL reset
     whatever store that server holds. */
  webServer: process.env.ATLAS_URL ? undefined : {
    command: 'node scripts/serve-atlas.mjs . 4173',
    url: 'http://127.0.0.1:4173/index.html',
    reuseExistingServer: false,
    timeout: 20_000,
    env: {
      ...process.env,
      ATLAS_PROGRESS_FILE: path.join(tmpdir(), `atlas-interaction-progress-${process.pid}.json`),
    },
  },
};

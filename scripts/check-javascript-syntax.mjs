#!/usr/bin/env node

import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const files = [];

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolutePath);
    else if (/\.(?:js|mjs)$/.test(entry.name)) files.push(absolutePath);
  }
}

walk(path.join(root, 'scripts'));
walk(path.join(root, 'skills'));

const failures = [];
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) failures.push({ file: path.relative(root, file), output: result.stderr.trim() });
}

if (failures.length) {
  console.error(`JavaScript syntax validation failed for ${failures.length} file(s):`);
  for (const failure of failures) console.error(`\n${failure.file}\n${failure.output}`);
  process.exit(1);
}

console.log(`JavaScript syntax validation passed: ${files.length} files checked.`);

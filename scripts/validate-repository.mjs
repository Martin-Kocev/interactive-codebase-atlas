#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const expectedSkills = ['gitflow-feature-workflow', 'interactive-codebase-atlas'];
const errors = [];

function fail(message) {
  errors.push(message);
}

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) {
    fail(`missing ${relativePath}`);
    return '';
  }
  return readFileSync(absolutePath, 'utf8');
}

function frontmatter(markdown, skillName) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    fail(`${skillName}: missing YAML frontmatter`);
    return new Map();
  }

  const fields = new Map();
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([a-z][a-z0-9_-]*):\s*(.+)$/);
    if (!field) {
      fail(`${skillName}: invalid frontmatter line: ${line}`);
      continue;
    }
    fields.set(field[1], field[2].trim());
  }
  return fields;
}

for (const skillName of expectedSkills) {
  const skillRoot = path.join('skills', skillName);
  const markdown = read(path.join(skillRoot, 'SKILL.md'));
  const fields = frontmatter(markdown, skillName);

  if (fields.size !== 2 || !fields.has('name') || !fields.has('description')) {
    fail(`${skillName}: frontmatter must contain only name and description`);
  }
  if (fields.get('name') !== skillName) {
    fail(`${skillName}: frontmatter name does not match its directory`);
  }
  if (!fields.get('description')) {
    fail(`${skillName}: description is empty`);
  }

  const metadata = read(path.join(skillRoot, 'agents', 'openai.yaml'));
  for (const key of ['display_name:', 'short_description:', 'default_prompt:']) {
    if (!metadata.includes(key)) fail(`${skillName}: agents/openai.yaml lacks ${key}`);
  }
  if (!metadata.includes(`$${skillName}`)) {
    fail(`${skillName}: default_prompt must explicitly mention $${skillName}`);
  }

  const resourcePattern = /`((?:references|scripts|templates)\/[A-Za-z0-9_./-]+)`/g;
  for (const match of markdown.matchAll(resourcePattern)) {
    const resource = match[1].replace(/\/$/, '');
    if (!existsSync(path.join(root, skillRoot, resource))) {
      fail(`${skillName}: referenced resource does not exist: ${resource}`);
    }
  }
}

for (const required of ['README.md', 'LICENSE', 'CHANGELOG.md', 'AGENTS.md', 'package.json']) {
  read(required);
}

if (errors.length) {
  console.error(`Repository validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Repository validation passed: ${expectedSkills.length} skills are publishable.`);

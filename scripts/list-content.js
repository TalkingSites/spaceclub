#!/usr/bin/env node
/**
 * list-content.js
 * Prints a structured JSON inventory of all posts, events, and pages in src/.
 * Used by spaceclub.sh list — also runnable directly.
 *
 * Usage:
 *   node scripts/list-content.js
 *   node scripts/list-content.js --pretty
 */

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const pretty = process.argv.includes('--pretty');

function parseFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^(\w[\w_]*):\s*(.+)/);
    if (kv) fm[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
  }
  return fm;
}

function scanDir(dirPath, type) {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath)
    .filter(f => f.endsWith('.md') && f !== 'template.md')
    .map(f => {
      const fm = parseFrontmatter(path.join(dirPath, f));
      return { type, file: f, ...fm };
    });
}

const posts = scanDir(path.join(SRC, 'posts'), 'post')
  .sort((a, b) => (b.postDate || '').localeCompare(a.postDate || ''));

const events = scanDir(path.join(SRC, 'events'), 'event')
  .sort((a, b) => (a.eventDate || '').localeCompare(b.eventDate || ''));

const pageFiles = fs.readdirSync(SRC)
  .filter(f => f.endsWith('.md') && !['404.md'].includes(f));
const pages = pageFiles.map(f => {
  const fm = parseFrontmatter(path.join(SRC, f));
  return { type: 'page', file: f, ...fm };
});

const inventory = { pages, posts, events };

console.log(pretty
  ? JSON.stringify(inventory, null, 2)
  : JSON.stringify(inventory));

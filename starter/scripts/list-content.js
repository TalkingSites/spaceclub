#!/usr/bin/env node
/**
 * list-content.js
 * Prints a structured JSON inventory of all pages, posts, events and content type entries in src/.
 * Useful for AI agents to understand current content without scanning source files.
 *
 * Usage:
 *   node scripts/list-content.js
 *   node scripts/list-content.js --pretty
 *   npm run list
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

// every page is a file in src/pages
const pages = scanDir(path.join(SRC, 'pages'), 'page');

// content types made in SpaceDash (src/_data/contentTypes.json), each in its own folder
let types = [];
try {
  types = JSON.parse(fs.readFileSync(path.join(SRC, '_data', 'contentTypes.json'), 'utf8')).items || [];
} catch {}
const entries = Object.fromEntries(types.filter(t => t && t.name).map(t => [t.name, scanDir(path.join(SRC, t.name), t.name)]));

const inventory = { pages, posts, events, ...entries };

console.log(pretty
  ? JSON.stringify(inventory, null, 2)
  : JSON.stringify(inventory));

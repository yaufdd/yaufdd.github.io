#!/usr/bin/env node
// Fails if the built site or the public source mentions anything from the private forbidden-terms list.
// Terms: $FORBIDDEN_TERMS (CI secret, one per line) or ./forbidden.local.txt (gitignored).
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { findForbidden, parseTerms } from './forbidden.mjs';

const ROOTS = ['dist', 'src', 'public', 'README.md', '.github'];
const TEXT_EXT = new Set(['.html', '.xml', '.txt', '.svg', '.js', '.mjs', '.ts', '.css', '.json', '.md', '.astro', '.yml', '.yaml']);

const fromEnv = process.env.FORBIDDEN_TERMS ?? '';
const source = fromEnv.trim() ? fromEnv : existsSync('forbidden.local.txt') ? readFileSync('forbidden.local.txt', 'utf8') : '';
const terms = parseTerms(source);

if (terms.length === 0) {
  if (process.env.CI) {
    console.error('check-forbidden: no terms configured — set the FORBIDDEN_TERMS repository secret.');
    process.exit(1);
  }
  console.warn('check-forbidden: no terms configured (create forbidden.local.txt) — skipping.');
  process.exit(0);
}
if (!existsSync('dist')) {
  console.error('check-forbidden: dist/ not found — run `npm run build` first.');
  process.exit(1);
}

/** @param {string} path @returns {string[]} */
function files(path) {
  if (!existsSync(path)) return [];
  if (!statSync(path).isDirectory()) return [path];
  return readdirSync(path, { withFileTypes: true }).flatMap((e) => files(join(path, e.name)));
}

// In CI the log is public, so report a term by its index instead of printing it.
const label = (term) => (process.env.CI ? `term #${terms.indexOf(term) + 1}` : `"${term}"`);
const hits = ROOTS.flatMap(files)
  .filter((file) => TEXT_EXT.has(extname(file)))
  .flatMap((file) => findForbidden(readFileSync(file, 'utf8'), terms).map((term) => `${file}: ${label(term)}`));

if (hits.length > 0) {
  console.error(`check-forbidden: ${hits.length} hit(s)\n${hits.join('\n')}`);
  process.exit(1);
}
console.log(`check-forbidden: OK (${terms.length} terms, no hits)`);

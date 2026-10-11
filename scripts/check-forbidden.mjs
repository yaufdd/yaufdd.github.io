#!/usr/bin/env node
// Fails if anything public mentions a term from the private forbidden-terms list.
// Terms: $FORBIDDEN_TERMS (CI secret, one per line) or ./forbidden.local.txt (gitignored).
//
//   node scripts/check-forbidden.mjs                     every tracked or new (not ignored) file + dist/
//   node scripts/check-forbidden.mjs --history <revs>    every file version, commit message and author/committer
//                                                        reachable from <revs> (e.g. --all, origin/main..HEAD)
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { findForbidden, findForbiddenInBuffer, parseTerms } from './forbidden.mjs';

// Planning notes never get published (they are stripped from history before the first push), so the everyday
// tree check skips them locally. CI and --history do not skip them: if they are there, publishing them is the leak.
const LOCAL_ONLY = 'docs/superpowers/';

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

/** @param {string[]} args @returns {Buffer} */
function git(args, input) {
  const r = spawnSync('git', args, { input, maxBuffer: 1024 * 1024 * 1024 });
  if (r.status !== 0) {
    console.error(`check-forbidden: git ${args.join(' ')} failed\n${r.stderr}`);
    process.exit(2);
  }
  return r.stdout;
}

// In CI the log is public, so report a term by its index instead of printing it.
const label = (term) => (process.env.CI ? `term #${terms.indexOf(term) + 1}` : `"${term}"`);
/** @type {string[]} */
const hits = [];
const report = (where, found) => found.forEach((term) => hits.push(`${where}: ${label(term)}`));

const historyAt = process.argv.indexOf('--history');
if (historyAt !== -1) {
  const revs = process.argv.slice(historyAt + 1);
  if (revs.length === 0) {
    console.error('check-forbidden: --history needs revisions, e.g. --history --all');
    process.exit(2);
  }
  // Every blob reachable from the revisions, with the first path it was seen at.
  const blobs = git(['rev-list', '--objects', '--filter=object:type=blob', ...revs])
    .toString('utf8')
    .split('\n')
    .map((line) => /^([0-9a-f]{40,64}) (.+)$/.exec(line))
    .filter((m) => m !== null)
    .map((m) => ({ sha: m[1], path: m[2] }));
  if (blobs.length > 0) {
    const out = git(['cat-file', '--batch'], blobs.map((b) => b.sha).join('\n') + '\n');
    let offset = 0;
    for (const blob of blobs) {
      const headerEnd = out.indexOf(0x0a, offset);
      const size = Number(out.subarray(offset, headerEnd).toString('utf8').split(' ')[2]);
      const content = out.subarray(headerEnd + 1, headerEnd + 1 + size);
      offset = headerEnd + 1 + size + 1;
      report(`${blob.path} (${blob.sha.slice(0, 7)})`, findForbiddenInBuffer(content, terms));
    }
  }
  const log = git(['log', '--format=%H%n%an <%ae>%n%cn <%ce>%n%B%x00', ...revs]).toString('utf8');
  for (const entry of log.split('\0')) {
    const text = entry.trim();
    if (text) report(`commit ${text.slice(0, 7)} (message/author)`, findForbidden(text, terms));
  }
  const scope = `${blobs.length} file versions, history of ${revs.join(' ')}`;
  finish(scope);
} else {
  if (!existsSync('dist')) {
    console.error('check-forbidden: dist/ not found — run `npm run build` first.');
    process.exit(1);
  }
  const skip = process.env.CI ? null : LOCAL_ONLY;
  const repoFiles = git(['ls-files', '-z', '--cached', '--others', '--exclude-standard'])
    .toString('utf8')
    .split('\0')
    .filter((path) => path && existsSync(path) && !(skip && path.startsWith(skip)));
  /** @param {string} path @returns {string[]} */
  const walk = (path) => (statSync(path).isDirectory() ? readdirSync(path).flatMap((name) => walk(join(path, name))) : [path]);
  const files = [...repoFiles, ...walk('dist')];
  for (const file of files) report(file, findForbiddenInBuffer(readFileSync(file), terms));
  finish(`${files.length} files${skip ? `, ${LOCAL_ONLY} skipped locally` : ''}`);
}

/** @param {string} scope */
function finish(scope) {
  if (hits.length > 0) {
    console.error(`check-forbidden: ${hits.length} hit(s) in ${scope}\n${hits.join('\n')}`);
    process.exit(1);
  }
  console.log(`check-forbidden: OK (${terms.length} terms, ${scope}, no hits)`);
}

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const SCRIPT = resolve('scripts/check-forbidden.mjs');
const TERM = 'acmetravel';
let repo = '';

function git(...args: string[]) {
  const r = spawnSync('git', args, { cwd: repo, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout;
}
function write(path: string, text: string) {
  mkdirSync(dirname(join(repo, path)), { recursive: true });
  writeFileSync(join(repo, path), text);
}
function commit(message: string) {
  git('add', '-A');
  git('commit', '-q', '-m', message);
}
function check(args: string[] = [], env: Record<string, string> = {}) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd: repo,
    encoding: 'utf8',
    env: { ...process.env, CI: '', FORBIDDEN_TERMS: TERM, ...env },
  });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
}

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'forbidden-'));
  git('init', '-q', '-b', 'main');
  git('config', 'user.name', 'Test');
  git('config', 'user.email', 'test@example.com');
  git('config', 'core.autocrlf', 'false');
  write('dist/index.html', '<p>clean</p>');
  write('src/page.md', 'clean');
  commit('initial');
});
afterEach(() => rmSync(repo, { recursive: true, force: true }));

describe('tree mode (default)', () => {
  it('passes a clean tree', () => {
    expect(check().code).toBe(0);
  });
  it.each(['scripts/shoot-work.mjs', 'tests/e2e/fixture.spec.ts', 'playwright.config.ts', 'public/CNAME', 'notes.toml'])(
    'scans %s, not just a hand-picked list of folders and extensions',
    (path) => {
      write(path, `url: https://${TERM}.example/`);
      const r = check();
      expect(r.code).toBe(1);
      expect(r.out).toContain(path);
    },
  );
  it('scans the built site', () => {
    write('dist/about/index.html', `<p>${TERM}</p>`);
    expect(check().code).toBe(1);
  });
  it('scans new files that are not committed yet', () => {
    write('src/draft.md', TERM);
    expect(check().code).toBe(1);
  });
  it('never prints the term in CI logs', () => {
    write('src/page.md', TERM);
    const r = check([], { CI: 'true' });
    expect(r.code).toBe(1);
    expect(r.out).toContain('term #1');
    expect(r.out).not.toContain(TERM);
  });
});

describe('history mode (--history <revs>)', () => {
  it('finds a term that was committed and later removed', () => {
    write('src/page.md', `old ${TERM}`);
    commit('add');
    write('src/page.md', 'clean again');
    commit('remove');
    expect(check().code).toBe(0);
    const r = check(['--history', 'HEAD']);
    expect(r.code).toBe(1);
    expect(r.out).toContain('src/page.md');
  });
  it('finds a term in a commit message', () => {
    write('src/other.md', 'clean');
    commit(`fix ${TERM} wording`);
    expect(check(['--history', 'HEAD']).code).toBe(1);
  });
  it('limits the scan to the given range', () => {
    write('src/page.md', TERM);
    commit('add');
    const base = git('rev-parse', 'HEAD').trim();
    write('src/page.md', 'clean');
    commit('remove');
    write('src/new.md', 'clean');
    commit('later');
    expect(check(['--history', `${base}..HEAD`]).code).toBe(0);
  });
  it('does not need dist/', () => {
    rmSync(join(repo, 'dist'), { recursive: true, force: true });
    expect(check(['--history', 'HEAD']).code).toBe(0);
  });
  it('treats docs/superpowers as publishable (it must be removed before pushing)', () => {
    write('docs/superpowers/plans/plan.md', TERM);
    commit('plan');
    expect(check().code).toBe(0);
    expect(check(['--history', 'HEAD']).code).toBe(1);
  });
});

describe('pre-push hook (.githooks/pre-push)', () => {
  function installHook() {
    for (const file of ['.githooks/pre-push', 'scripts/check-forbidden.mjs', 'scripts/forbidden.mjs']) {
      write(file, readFileSync(resolve(file), 'utf8'));
    }
    commit('tooling');
    git('config', 'core.hooksPath', '.githooks');
    const remote = mkdtempSync(join(tmpdir(), 'forbidden-remote-'));
    spawnSync('git', ['init', '-q', '--bare', remote]);
    git('remote', 'add', 'origin', remote);
    return remote;
  }
  function push() {
    const r = spawnSync('git', ['push', '-q', 'origin', 'main'], {
      cwd: repo,
      encoding: 'utf8',
      env: { ...process.env, CI: '', FORBIDDEN_TERMS: TERM },
    });
    return { code: r.status, out: `${r.stdout}${r.stderr}` };
  }

  it('lets a clean history through', () => {
    const remote = installHook();
    expect(push().code).toBe(0);
    rmSync(remote, { recursive: true, force: true });
  });
  it('blocks a push when any pushed commit ever contained a term', () => {
    const remote = installHook();
    write('src/page.md', TERM);
    commit('add');
    write('src/page.md', 'clean');
    commit('remove');
    const r = push();
    expect(r.code).not.toBe(0);
    expect(r.out).toContain('check-forbidden');
    rmSync(remote, { recursive: true, force: true });
  });
  it('only scans commits the remote does not have yet', () => {
    const remote = installHook();
    write('src/page.md', TERM);
    commit('add');
    git('config', 'core.hooksPath', '.nohooks');
    expect(push().code).toBe(0); // pushed past the hook on purpose to seed the remote
    git('config', 'core.hooksPath', '.githooks');
    write('src/page.md', 'clean');
    commit('remove');
    expect(push().code).toBe(0);
    rmSync(remote, { recursive: true, force: true });
  });
});

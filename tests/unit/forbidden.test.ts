import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { findForbidden, findForbiddenInBuffer, parseTerms, skeleton } from '../../scripts/forbidden.mjs';

describe('parseTerms', () => {
  it('drops blank lines and # comments, trims the rest', () => {
    expect(parseTerms('# names\n  Alpha \r\n\nbeta\n#x\n')).toEqual(['Alpha', 'beta']);
  });
});

describe('skeleton', () => {
  it('folds case, width, punctuation and whitespace', () => {
    expect(skeleton('Ａcme-Travel_Inc.\n')).toBe('acmetravelinc');
  });
});

describe('findForbidden', () => {
  const terms = ['AcmeTravel', 'acme travel', 'acme.example', 'アクメ'];
  it('finds terms case-insensitively', () => {
    expect(findForbidden('Built for ACMETRAVEL staff', terms)).toEqual(['AcmeTravel', 'acme travel']);
  });
  it('catches full-width and Japanese variants', () => {
    expect(findForbidden('ＡｃｍｅＴｒａｖｅｌ と アクメ', terms)).toEqual(['AcmeTravel', 'acme travel', 'アクメ']);
  });
  it.each(['acme-travel', 'acme_travel', 'acme\ntravel', 'acme <b>travel</b>', 'acme<span> travel</span>'])(
    'catches a multi-word term written as %j',
    (content) => {
      expect(findForbidden(content, ['acme travel'])).toEqual(['acme travel']);
    },
  );
  it('returns nothing for clean text', () => {
    expect(findForbidden('旅行会社の社内ツール', terms)).toEqual([]);
  });
});

describe('findForbiddenInBuffer', () => {
  it.each(['utf8', 'latin1', 'utf16le'] as const)('reads %s-encoded bytes (e.g. image metadata)', (encoding) => {
    const bytes = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00]), Buffer.from('Author: AcmeTravel', encoding)]);
    expect(findForbiddenInBuffer(bytes, ['acmetravel'])).toEqual(['acmetravel']);
  });
  it('survives large files (decoding UTF-16 at an odd offset crashed Node 24 on Windows)', () => {
    // Run in a child process: the crash kills the whole process rather than throwing.
    // The crash depends on memory layout, so try a spread of sizes like real lock files and images.
    const script = `import { findForbiddenInBuffer } from './scripts/forbidden.mjs';
      let hits = 0;
      for (let n = 250001; n < 1300000; n += 52361) {
        const bytes = Buffer.from('{"name": "x"}\\n'.repeat(Math.ceil(n / 15)).slice(0, n));
        hits += findForbiddenInBuffer(bytes, ['acme']).length;
        // git cat-file --batch output is sliced at arbitrary offsets, so the input itself may start at an odd address.
        hits += findForbiddenInBuffer(bytes.subarray(1), ['acme']).length;
      }
      console.log(hits);`;
    const r = spawnSync(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8' });
    expect({ status: r.status, out: r.stdout.trim() }).toEqual({ status: 0, out: '0' });
  });
});

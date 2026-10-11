import { describe, expect, it } from 'vitest';
import { findForbidden, parseTerms } from '../../scripts/forbidden.mjs';

describe('parseTerms', () => {
  it('drops blank lines and # comments, trims the rest', () => {
    expect(parseTerms('# names\n  Alpha \r\n\nbeta\n#x\n')).toEqual(['Alpha', 'beta']);
  });
});

describe('findForbidden', () => {
  const terms = ['AcmeTravel', 'acme.example', 'アクメ'];
  it('finds terms case-insensitively', () => {
    expect(findForbidden('Built for ACMETRAVEL staff', terms)).toEqual(['AcmeTravel']);
  });
  it('catches full-width and Japanese variants', () => {
    expect(findForbidden('ＡｃｍｅＴｒａｖｅｌ と アクメ', terms)).toEqual(['AcmeTravel', 'アクメ']);
  });
  it('returns nothing for clean text', () => {
    expect(findForbidden('旅行会社の社内ツール', terms)).toEqual([]);
  });
});

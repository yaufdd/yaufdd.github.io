import { describe, expect, it } from 'vitest';
import { assertLocalePairs, parseEntryId, selectProjects } from '../../src/lib/projects';

const entry = (id: string, order = 1, draft = false) => ({ id, data: { order, draft } });

describe('parseEntryId', () => {
  it('splits slug and locale', () => {
    expect(parseEntryId('visa-docs/ja')).toEqual({ slug: 'visa-docs', locale: 'ja' });
    expect(parseEntryId('pacxpuctanno/en')).toEqual({ slug: 'pacxpuctanno', locale: 'en' });
  });
  it.each(['visa-docs', 'visa-docs/fr', 'Visa/ja', 'a/b/ja', '-x/ja'])('rejects %j', (id) => {
    expect(() => parseEntryId(id)).toThrow(/src\/content\/projects/);
  });
});

describe('assertLocalePairs', () => {
  it('accepts complete pairs', () => {
    expect(() => assertLocalePairs(['a/ja', 'a/en', 'b/en', 'b/ja'])).not.toThrow();
  });
  it('names every missing translation file', () => {
    expect(() => assertLocalePairs(['a/ja', 'b/en'])).toThrow('Missing: src/content/projects/a/en.md, src/content/projects/b/ja.md');
  });
});

describe('selectProjects', () => {
  const entries = [entry('b/ja', 2), entry('b/en', 2), entry('a/ja', 1), entry('a/en', 1), entry('c/ja', 1), entry('c/en', 1)];

  it('returns one locale ordered by `order`, then slug', () => {
    expect(selectProjects(entries, 'ja').map((e) => e.id)).toEqual(['a/ja', 'c/ja', 'b/ja']);
    expect(selectProjects(entries, 'en').map((e) => e.id)).toEqual(['a/en', 'c/en', 'b/en']);
  });
  it('hides a project in every locale when any translation is a draft', () => {
    const withDraft = [...entries.filter((e) => e.id !== 'a/en'), entry('a/en', 1, true)];
    expect(selectProjects(withDraft, 'ja').map((e) => e.id)).toEqual(['c/ja', 'b/ja']);
    expect(selectProjects(withDraft, 'en').map((e) => e.id)).toEqual(['c/en', 'b/en']);
  });
  it('fails the build when a translation is missing, even next to a draft', () => {
    expect(() => selectProjects([entry('a/ja', 1, true)], 'ja')).toThrow(/a\/en\.md/);
  });
});

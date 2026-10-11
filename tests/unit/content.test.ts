import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = 'src/content/projects';
const SECTIONS = {
  ja: ['課題', '解決策', 'アーキテクチャ', '技術的な工夫', '振り返り'],
  en: ['Problem', 'Solution', 'Architecture', 'Technical highlights', 'Retrospective'],
} as const;

const slugs = readdirSync(ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);
const read = (slug: string, locale: 'ja' | 'en') => readFileSync(join(ROOT, slug, `${locale}.md`), 'utf8');
const body = (md: string) => md.replace(/^---[\s\S]*?\n---/, '');
const imageRefs = (md: string) => [...body(md).matchAll(/!\[[^\]]*\]\((\.\/images\/[^)\s]+)\)/g)].map((m) => m[1]).sort();

it('there are projects to check', () => {
  expect(slugs.length).toBeGreaterThan(0);
});

describe.each(slugs)('project %s', (slug) => {
  it.each(['ja', 'en'] as const)('%s.md has exactly the five case sections in order', (locale) => {
    const headings = [...body(read(slug, locale)).matchAll(/^## (.+)$/gm)].map((m) => (m[1] ?? '').trim());
    expect(headings).toEqual([...SECTIONS[locale]]);
  });
  it('ja.md and en.md show the same screenshots', () => {
    expect(imageRefs(read(slug, 'en'))).toEqual(imageRefs(read(slug, 'ja')));
  });
  it.each(['ja', 'en'] as const)('every screenshot in %s.md has alt text', (locale) => {
    expect(body(read(slug, locale))).not.toMatch(/!\[\s*\]\(/);
  });
});

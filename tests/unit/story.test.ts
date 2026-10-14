import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const ROOT = 'src/content/projects';

interface Card {
  icon: string;
  title: string;
  note?: string;
  link?: string;
  from?: number;
}
interface Flow {
  steps: Card[];
  result?: Card;
  aside?: Card & { to: number };
  note?: string;
}
interface Story {
  task: { text: string; documents?: { title: string; items: string[]; note?: string; example?: { image: string; href: string } } };
  before?: Flow;
  after: Flow;
  screens?: { caption: string; items: { image: string; alt: string }[] };
  architecture: { layers: Card[]; leaves: Card[]; note?: string };
  highlights: { title: string; text: string }[];
  outcome: string[];
}

const frontmatter = (slug: string, locale: 'ja' | 'en') =>
  parse(readFileSync(join(ROOT, slug, `${locale}.md`), 'utf8').split(/\r?\n---/)[0]!.replace(/^---/, '')) as { story?: Story };

const slugs = readdirSync(ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

/** Everything about a story except its wording: the two languages must tell the same story with the same pictures. */
const shape = (story: Story) => {
  const flow = (f?: Flow) =>
    f && {
      steps: f.steps.map((s) => [s.icon, s.link ?? 'next']),
      result: f.result && [f.result.icon, f.result.from],
      aside: f.aside && [f.aside.icon, f.aside.to],
      note: Boolean(f.note),
    };
  return {
    /** The **bold** bits (the times) carry the same numbers in both languages. */
    bold: [...story.task.text.matchAll(/\*\*(.+?)\*\*/g)].map((m) => m[1]!.match(/[0-9.]+/g)),
    documents: story.task.documents && [story.task.documents.items.length, Boolean(story.task.documents.note), story.task.documents.example?.image, story.task.documents.example?.href],
    before: flow(story.before),
    after: flow(story.after),
    screens: story.screens?.items.map((s) => s.image),
    architecture: [story.architecture.layers.map((c) => c.icon), story.architecture.leaves.map((c) => c.icon), Boolean(story.architecture.note)],
    highlights: story.highlights.length,
    outcome: story.outcome.length,
  };
};

it('the visa case is told as a visual story', () => {
  expect(frontmatter('visa-docs', 'ja').story).toBeDefined();
});

describe.each(slugs)('project %s', (slug) => {
  it('has a story in both languages or in neither', () => {
    expect(Boolean(frontmatter(slug, 'en').story)).toBe(Boolean(frontmatter(slug, 'ja').story));
  });

  it('tells the same story in ja and en: same steps, icons, arrows and numbers', () => {
    const ja = frontmatter(slug, 'ja').story;
    const en = frontmatter(slug, 'en').story;
    if (!ja || !en) return;
    expect(shape(en)).toEqual(shape(ja));
  });
});

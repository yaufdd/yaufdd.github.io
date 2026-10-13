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
  note?: string;
}
interface Deck {
  task: { text: string; metric?: Record<string, string> };
  before?: Flow;
  after: Flow;
  architecture: { layers: Card[]; leaves: Card[]; note?: string };
  highlights: { title: string; text: string }[];
  outcome: string[];
}

const frontmatter = (slug: string, locale: 'ja' | 'en') =>
  parse(readFileSync(join(ROOT, slug, `${locale}.md`), 'utf8').split(/\r?\n---/)[0]!.replace(/^---/, '')) as { deck?: Deck };

const slugs = readdirSync(ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

/** Everything about a deck except its wording: the two languages must tell the same story with the same pictures. */
const shape = (deck: Deck) => {
  const flow = (f?: Flow) =>
    f && {
      steps: f.steps.map((s) => [s.icon, s.link ?? 'next']),
      result: f.result && [f.result.icon, f.result.from],
      note: Boolean(f.note),
    };
  return {
    metric: deck.task.metric && Object.keys(deck.task.metric).sort(),
    metricNumbers: deck.task.metric && [deck.task.metric.before, deck.task.metric.after],
    before: flow(deck.before),
    after: flow(deck.after),
    architecture: [deck.architecture.layers.map((c) => c.icon), deck.architecture.leaves.map((c) => c.icon), Boolean(deck.architecture.note)],
    highlights: deck.highlights.length,
    outcome: deck.outcome.length,
  };
};

it('the visa case is told as slides', () => {
  expect(frontmatter('visa-docs', 'ja').deck).toBeDefined();
});

describe.each(slugs)('project %s', (slug) => {
  it('has slides in both languages or in neither', () => {
    expect(Boolean(frontmatter(slug, 'en').deck)).toBe(Boolean(frontmatter(slug, 'ja').deck));
  });

  it('tells the same story in ja and en: same steps, icons, arrows and numbers', () => {
    const ja = frontmatter(slug, 'ja').deck;
    const en = frontmatter(slug, 'en').deck;
    if (!ja || !en) return;
    expect(shape(en)).toEqual(shape(ja));
  });
});

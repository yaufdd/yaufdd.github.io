import { LOCALES, type Locale } from '../i18n/ui';

export interface ProjectEntryLike {
  id: string;
  data: { order: number; draft: boolean };
}

const ENTRY_ID = /^([a-z0-9]+(?:-[a-z0-9]+)*)\/(ja|en)$/;

export function parseEntryId(id: string): { slug: string; locale: Locale } {
  const match = ENTRY_ID.exec(id);
  if (!match?.[1] || !match[2]) {
    throw new Error(`Unexpected project entry id "${id}". Projects live in src/content/projects/<slug>/<ja|en>.md with a lowercase, dash-separated slug.`);
  }
  return { slug: match[1], locale: match[2] as Locale };
}

export function assertLocalePairs(ids: readonly string[]): void {
  const found = new Map<string, Set<Locale>>();
  for (const id of ids) {
    const { slug, locale } = parseEntryId(id);
    const locales = found.get(slug) ?? new Set<Locale>();
    locales.add(locale);
    found.set(slug, locales);
  }
  const missing = [...found].flatMap(([slug, locales]) =>
    LOCALES.filter((l) => !locales.has(l)).map((l) => `src/content/projects/${slug}/${l}.md`),
  );
  if (missing.length > 0) throw new Error(`Every project needs both ja.md and en.md. Missing: ${missing.join(', ')}`);
}

/** Published projects of one locale in display order. A draft translation hides the project in every locale. */
export function selectProjects<E extends ProjectEntryLike>(entries: readonly E[], locale: Locale): E[] {
  assertLocalePairs(entries.map((e) => e.id));
  const drafts = new Set(entries.filter((e) => e.data.draft).map((e) => parseEntryId(e.id).slug));
  return entries
    .filter((e) => {
      const { slug, locale: entryLocale } = parseEntryId(e.id);
      return entryLocale === locale && !drafts.has(slug);
    })
    .sort((a, b) => a.data.order - b.data.order || parseEntryId(a.id).slug.localeCompare(parseEntryId(b.id).slug));
}

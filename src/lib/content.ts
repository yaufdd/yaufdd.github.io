import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import type { Locale } from '../i18n/ui';
import { parseEntryId, selectProjects } from './projects';

export type Project = CollectionEntry<'projects'>;

export async function getProjects(locale: Locale): Promise<Project[]> {
  return selectProjects(await getCollection('projects'), locale);
}

export function slugOf(entry: Project): string {
  return parseEntryId(entry.id).slug;
}

export async function getPage(name: 'about' | 'workflow', locale: Locale): Promise<CollectionEntry<'pages'>> {
  const entry = await getEntry('pages', `${name}/${locale}`);
  if (!entry) throw new Error(`Missing src/content/pages/${name}/${locale}.md`);
  return entry;
}

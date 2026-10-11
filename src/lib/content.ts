import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '../i18n/ui';
import { parseEntryId, selectProjects } from './projects';

export type Project = CollectionEntry<'projects'>;

export async function getProjects(locale: Locale): Promise<Project[]> {
  return selectProjects(await getCollection('projects'), locale);
}

export function slugOf(entry: Project): string {
  return parseEntryId(entry.id).slug;
}

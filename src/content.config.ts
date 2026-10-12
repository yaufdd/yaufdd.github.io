import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use the YYYY-MM format, e.g. "2026-04"');

const projects = defineCollection({
  loader: glob({ pattern: '*/{ja,en}.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1),
      subtitle: z.string().min(1).optional(),
      summary: z.string().min(1),
      period: z.object({ start: yearMonth, end: yearMonth.nullable() }),
      team: z.number().int().positive(),
      roles: z.array(z.string().min(1)).min(1),
      stack: z.array(z.string().min(1)).min(1),
      status: z.enum(['active', 'archived']),
      devProcess: z.string().min(1).optional(),
      links: z.object({ live: z.url().optional(), repo: z.url().optional() }).default({}),
      cover: image(),
      coverAlt: z.string().min(1),
      /** Lines of the animated terminal on the home page card; without them the card shows the cover image. */
      screen: z.array(z.string().min(1)).min(1).max(6).optional(),
      order: z.number().int(),
      draft: z.boolean().default(false),
    }),
});

const pages = defineCollection({
  loader: glob({ pattern: '*/{ja,en}.md', base: './src/content/pages' }),
  schema: z.object({ title: z.string().min(1) }),
});

export const collections = { projects, pages };

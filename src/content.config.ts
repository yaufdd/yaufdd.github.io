import { defineCollection, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { ICON_NAMES } from './components/story/icons';

const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use the YYYY-MM format, e.g. "2026-04"');

/*
 * A case study told visually (src/components/story/): short sections with cards, arrows and numbers. Texts are
 * capped so each section says one thing in a few words; the full text stays in the Markdown body under "Read more".
 */
const card = z.object({
  icon: z.enum(ICON_NAMES),
  title: z.string().min(1).max(28),
  note: z.string().min(1).max(48).optional(),
});
const flow = z
  .object({
    /** `link` is the arrow to the next step: one way (next) or back and forth (both). */
    steps: z.array(card.extend({ link: z.enum(['next', 'both']).default('next') })).min(2).max(5),
    /** What comes out, hanging under the step it comes `from` (0-based). */
    result: card.extend({ from: z.number().int().min(0) }).optional(),
    /** A helper the step `to` (0-based) works with back and forth, hanging under it (e.g. the AI under the admin panel). */
    aside: card.extend({ to: z.number().int().min(0) }).optional(),
    note: z.string().min(1).max(220).optional(),
  })
  .refine((f) => !f.result || f.result.from < f.steps.length, { message: 'result.from must point at one of the steps' })
  .refine((f) => !f.aside || f.aside.to < f.steps.length, { message: 'aside.to must point at one of the steps' });
const story = (image: SchemaContext['image']) =>
  z.object({
    task: z.object({
      /** `**…**` marks the words shown in bold (the times saved). */
      text: z.string().min(1).max(220),
      /** The paperwork behind the problem: the documents made for each traveller, and one official form as an example. */
      documents: z
        .object({
          title: z.string().min(1).max(40),
          items: z.array(z.string().min(1).max(48)).min(2).max(12),
          note: z.string().min(1).max(160).optional(),
          example: z.object({ image: image(), alt: z.string().min(1), caption: z.string().min(1).max(80), href: z.url() }).optional(),
        })
        .optional(),
    }),
    before: flow.optional(),
    after: flow,
    /** Screenshots with no heading, one caption for all: under the summary (top) or after "before and now" (middle). */
    screens: z
      .object({
        at: z.enum(['top', 'middle']).default('middle'),
        caption: z.string().min(1).max(60),
        items: z.array(z.object({ image: image(), alt: z.string().min(1) })).min(1).max(4),
      })
      .optional(),
    architecture: z.object({ layers: z.array(card).min(1).max(4), leaves: z.array(card).min(1).max(4), note: z.string().min(1).max(140).optional() }),
    highlights: z.array(z.object({ title: z.string().min(1).max(32), text: z.string().min(1).max(150) })).min(2).max(6),
    outcome: z.array(z.string().min(1).max(100)).min(1).max(3),
  });

const projects = defineCollection({
  loader: glob({ pattern: '*/{ja,en}.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1),
      subtitle: z.string().min(1).optional(),
      summary: z.string().min(1),
      /** One short line under the project's link on the home page. */
      tagline: z.string().min(1),
      period: z.object({ start: yearMonth, end: yearMonth.nullable() }),
      team: z.number().int().positive(),
      roles: z.array(z.string().min(1)).min(1),
      stack: z.array(z.string().min(1)).min(1),
      status: z.enum(['active', 'archived']),
      devProcess: z.string().min(1).optional(),
      links: z.object({ live: z.url().optional(), repo: z.url().optional() }).default({}),
      cover: image(),
      coverAlt: z.string().min(1),
      order: z.number().int(),
      draft: z.boolean().default(false),
      /** Where it was built: for the travel company (shown together on the home page) or on my own. */
      group: z.enum(['travel', 'personal']),
      /** Picture on the projects page; story projects default to their first screen. */
      thumbnail: image().optional(),
      thumbnailAlt: z.string().min(1).optional(),
      story: story(image).optional(),
    }),
});

const pages = defineCollection({
  loader: glob({ pattern: '*/{ja,en}.md', base: './src/content/pages' }),
  schema: z.object({ title: z.string().min(1) }),
});

export const collections = { projects, pages };

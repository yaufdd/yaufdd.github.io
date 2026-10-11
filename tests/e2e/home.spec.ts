import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const ROOT = 'src/content/projects';

/** Card links the home page should show, derived from the content files so new projects need no test changes. */
function expectedCardLinks(locale: 'ja' | 'en'): string[] {
  const prefix = locale === 'ja' ? '/' : '/en/';
  const projects = readdirSync(ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const frontmatter = (slug: string, l: string) => readFileSync(join(ROOT, slug, `${l}.md`), 'utf8').split(/\n---/)[0] ?? '';
      const ja = frontmatter(d.name, 'ja');
      const en = frontmatter(d.name, 'en');
      const own = locale === 'ja' ? ja : en;
      return {
        slug: d.name,
        order: Number(/^order:\s*(-?\d+)/m.exec(own)?.[1]),
        draft: [ja, en].some((fm) => /^draft:\s*true/m.test(fm)),
      };
    })
    .filter((p) => !p.draft)
    .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
  return projects.map((p) => `${prefix}projects/${p.slug}/`);
}

for (const locale of ['ja', 'en'] as const) {
  test(`${locale} home lists every project in display order and links to it`, async ({ page }) => {
    const expected = expectedCardLinks(locale);
    expect(expected.length).toBeGreaterThan(0);
    await page.goto(locale === 'ja' ? '/' : '/en/');
    const cards = page.locator('#projects .card');
    await expect(cards).toHaveCount(expected.length);
    expect(await cards.evaluateAll((els) => els.map((e) => e.getAttribute('href')))).toEqual(expected);
    await cards.first().click();
    await expect(page).toHaveURL(expected[0]!);
  });
}

test('cards show the localized project titles', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#projects .card', { hasText: 'ビザ申請書類' })).toHaveCount(1);
  await page.goto('/en/');
  await expect(page.locator('#projects .card', { hasText: 'Visa Document Automation' })).toHaveCount(1);
});

test('stack shows AI dev tools as their own group', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'AI・開発ツール' })).toBeVisible();
  await expect(page.getByText('Claude Code', { exact: true })).toBeVisible();
});

test('./projects in the nav jumps to the list', async ({ page }) => {
  await page.goto('/about/');
  await page.getByRole('link', { name: './projects' }).click();
  await expect(page).toHaveURL('/#projects');
  await expect(page.locator('#projects')).toBeInViewport();
});

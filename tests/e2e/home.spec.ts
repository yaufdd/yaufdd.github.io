import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from './fixtures';

/**
 * Opens a page for layout checks with entrance animations off: blocks slide up 12px as they fade in, and a layout
 * measured mid-slide is off by up to that much (it made the one-screen checks flaky and hid a real overlap).
 * The animations themselves are covered by home-motion.spec.ts.
 */
async function open(page: Page, url: string) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url);
}

const ROOT = 'src/content/projects';

/** Project links the home page should show, derived from the content files so new projects need no test changes. */
function expectedProjectLinks(locale: 'ja' | 'en'): string[] {
  const prefix = locale === 'ja' ? '/' : '/en/';
  return readdirSync(ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const frontmatter = (l: string) => readFileSync(join(ROOT, d.name, `${l}.md`), 'utf8').split(/\n---/)[0] ?? '';
      const own = frontmatter(locale);
      return {
        slug: d.name,
        order: Number(/^order:\s*(-?\d+)/m.exec(own)?.[1]),
        draft: ['ja', 'en'].some((l) => /^draft:\s*true/m.test(frontmatter(l))),
      };
    })
    .filter((p) => !p.draft)
    .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug))
    .map((p) => `${prefix}projects/${p.slug}/`);
}

const HEADINGS = {
  ja: { hello: 'こんにちは！', projects: 'プロジェクト', skills: 'スキル', experience: '職歴', education: '学歴' },
  en: { hello: 'Hello!', projects: 'Projects', skills: 'Skills', experience: 'Experience', education: 'Education' },
} as const;

for (const size of [
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
]) {
  test(`everything fits on one ${size.width}×${size.height} screen`, async ({ page }) => {
    await page.setViewportSize(size);
    await open(page, '/');
    const overflow = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    expect(overflow).toBeLessThanOrEqual(1);
    const blocks = ['.photo', '.hello', '.projects', '.skills', '.experience', '.education', '.contacts', '[data-avatar]'];
    for (const selector of blocks) {
      await expect(page.locator(selector)).toBeInViewport({ ratio: 1 });
    }
    // No block may overlap another (text running into the contacts row, the figure covering text…).
    const boxes = await Promise.all(blocks.map(async (s) => ({ s, box: (await page.locator(s).boundingBox())! })));
    const overlaps = boxes.flatMap((a, i) =>
      boxes.slice(i + 1).filter((b) => a.box.x < b.box.x + b.box.width && b.box.x < a.box.x + a.box.width && a.box.y < b.box.y + b.box.height && b.box.y < a.box.y + a.box.height).map((b) => `${a.s} × ${b.s}`),
    );
    expect(overlaps).toEqual([]);
    // And the project list keeps clear of the contacts row.
    const gap = (await page.locator('.contacts').boundingBox())!.y - (await page.locator('.projects').evaluate((el) => el.getBoundingClientRect().bottom));
    expect(gap, 'space between the projects and the contacts').toBeGreaterThanOrEqual(12);
  });

  test(`the square 2D card starts level with the greeting, education under it, projects under the greeting at ${size.width}×${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await open(page, '/');
    const [photo, greeting, education, projects] = await Promise.all(
      ['.photo', '.hello h1', '.education', '.projects'].map(async (s) => (await page.locator(s).boundingBox())!),
    );
    expect(photo!.width / photo!.height).toBeCloseTo(1, 1);
    expect(Math.abs(photo!.y - greeting!.y)).toBeLessThanOrEqual(8);
    expect(education!.y).toBeGreaterThanOrEqual(photo!.y + photo!.height);
    expect(Math.abs(education!.x - photo!.x)).toBeLessThanOrEqual(2);
    expect(projects!.y).toBeGreaterThanOrEqual(greeting!.y + greeting!.height);
    expect(Math.abs(projects!.x - greeting!.x)).toBeLessThanOrEqual(2);
    expect(Math.abs(projects!.y - education!.y)).toBeLessThanOrEqual(2);
  });

  test(`the contacts sit together, starting at the left edge under the 2D card's column, at ${size.width}×${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await open(page, '/');
    const [photo, education] = await Promise.all(['.photo', '.education'].map(async (s) => (await page.locator(s).boundingBox())!));
    const items = await Promise.all((await page.locator('.contacts li').all()).map(async (li) => (await li.boundingBox())!));
    expect(Math.abs(items[0]!.x - photo!.x)).toBeLessThanOrEqual(2);
    for (let i = 1; i < items.length; i++) expect(items[i]!.x - (items[i - 1]!.x + items[i - 1]!.width)).toBeLessThanOrEqual(48);
    expect(items[0]!.y).toBeGreaterThanOrEqual(education!.y + education!.height);
  });

  test(`each project's description fits on one line at ${size.width}×${size.height} in both languages`, async ({ page }) => {
    await page.setViewportSize(size);
    for (const url of ['/', '/en/']) {
      await open(page, url);
      const lines = await page.locator('.projects a span').evaluateAll((els) =>
        els.map((e) => e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight)),
      );
      expect(lines.length).toBeGreaterThan(0);
      for (const n of lines) expect(n, url).toBeLessThan(1.5);
    }
  });

  test(`the greeting stays on one line at ${size.width}×${size.height} in both languages`, async ({ page }) => {
    await page.setViewportSize(size);
    for (const url of ['/', '/en/']) {
      await open(page, url);
      const { height, fontSize } = await page.locator('.hello h1').evaluate((h) => ({ height: h.getBoundingClientRect().height, fontSize: parseFloat(getComputedStyle(h).fontSize) }));
      expect(height, url).toBeLessThan(fontSize * 1.6);
    }
  });
}

for (const locale of ['ja', 'en'] as const) {
  const home = locale === 'ja' ? '/' : '/en/';

  test(`${locale}: every heading is in the page's language`, async ({ page }) => {
    await open(page, home);
    const h = HEADINGS[locale];
    await expect(page.locator('.hello h1')).toHaveText(h.hello);
    await expect(page.locator('.projects h2')).toHaveText(h.projects);
    await expect(page.locator('.skills h2')).toHaveText(h.skills);
    await expect(page.locator('.experience h2')).toHaveText(h.experience);
    await expect(page.locator('.education h2')).toHaveText(h.education);
  });

  test(`${locale}: the greeting introduces me, without the small head picture`, async ({ page }) => {
    await open(page, home);
    await expect(page.locator('.hello .bio')).toContainText(locale === 'ja' ? '番場エリク' : 'Eric Bamba');
    await expect(page.locator('.hello img')).toHaveCount(0);
  });

  test(`${locale}: the projects section links to every project and the workflow, each with a description`, async ({ page }) => {
    await open(page, home);
    const expected = expectedProjectLinks(locale);
    expect(expected.length).toBeGreaterThan(0);
    const links = page.locator('.projects a');
    expect(await links.evaluateAll((els) => els.map((e) => e.getAttribute('href')))).toEqual([
      ...expected,
      locale === 'ja' ? '/about/#workflow' : '/en/about/#workflow',
    ]);
    for (const text of await page.locator('.projects a span').allTextContents()) expect(text.trim()).not.toBe('');
    await expect(page.locator('.projects a span')).toHaveCount(expected.length + 1);
    await links.first().click();
    await expect(page).toHaveURL(expected[0]!);
  });

  test(`${locale}: skills, experience, education and contacts`, async ({ page }) => {
    await open(page, home);
    expect(await page.locator('.skills li').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))).toEqual([
      'Go',
      'React',
      'TypeScript',
      'PostgreSQL',
      'Docker',
      'AWS',
    ]);
    await expect(page.locator('.experience li')).toHaveCount(3);
    await expect(page.locator('.experience li').last()).toContainText(locale === 'ja' ? '旅行会社' : 'Travel company');
    await expect(page.locator('.education')).toContainText('MIREA');
    await expect(page.locator('.contacts a[href="mailto:ercbamba@gmail.com"]')).toBeVisible();
    await expect(page.locator('.contacts a[href="https://github.com/yaufdd"]')).toBeVisible();
    await expect(page.locator('.contacts a[href*="wantedly"]')).toHaveCount(0);
  });
}

for (const size of [
  { width: 1280, height: 800 },
  { width: 375, height: 800 },
]) {
  test(`the left panel shows the whole 2D avatar, uncropped, at ${size.width}px`, async ({ page }) => {
    await page.setViewportSize(size);
    await open(page, '/');
    const img = page.locator('.photo img');
    await expect(img).toHaveAttribute('alt', '番場エリクのイラスト');
    const info = await img.evaluate((el: HTMLImageElement) => ({
      loaded: el.complete && el.naturalWidth > 0,
      ratio: el.naturalWidth / el.naturalHeight,
      fit: getComputedStyle(el).objectFit,
    }));
    // The source is the original square illustration (not a face crop), shown with object-fit: contain.
    expect(info.loaded).toBe(true);
    expect(info.ratio).toBeCloseTo(1, 2);
    expect(info.fit).toBe('contain');
  });
}

test('on a phone the blocks stack: picture, hello, projects, skills, experience, education, contacts', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await open(page, '/');
  const tops = await Promise.all(
    ['.photo', '.hello', '.projects', '.skills', '.experience', '.education', '.contacts'].map(async (s) => (await page.locator(s).boundingBox())!.y),
  );
  expect([...tops].sort((a, b) => a - b)).toEqual(tops);
});

test('the site is white and has no theme switcher', async ({ page }) => {
  await open(page, '/');
  const [r, g, b] = (await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).match(/\d+/g)!.map(Number);
  expect(Math.min(r!, g!, b!)).toBeGreaterThan(215);
  await expect(page.locator('[data-theme-option]')).toHaveCount(0);
  await page.goto('/projects/visa-docs/');
  await expect(page.locator('[data-theme-option]')).toHaveCount(0);
});

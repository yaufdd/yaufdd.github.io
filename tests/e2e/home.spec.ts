import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from './fixtures';

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

for (const size of [
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
]) {
  test(`everything fits on one ${size.width}×${size.height} screen`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    expect(overflow).toBeLessThanOrEqual(1);
    const blocks = ['.photo', '.hello', '.skills', '.experience', '.education', '.contacts', '[data-avatar]'];
    for (const selector of blocks) {
      await expect(page.locator(selector)).toBeInViewport({ ratio: 1 });
    }
    // No block may overlap another (text running into the contacts row, the figure covering text…).
    const boxes = await Promise.all(blocks.map(async (s) => ({ s, box: (await page.locator(s).boundingBox())! })));
    const overlaps = boxes.flatMap((a, i) =>
      boxes.slice(i + 1).filter((b) => a.box.x < b.box.x + b.box.width && b.box.x < a.box.x + a.box.width && a.box.y < b.box.y + b.box.height && b.box.y < a.box.y + a.box.height).map((b) => `${a.s} × ${b.s}`),
    );
    expect(overlaps).toEqual([]);
  });

  test(`Hello! stays on one line at ${size.width}×${size.height} in both languages`, async ({ page }) => {
    await page.setViewportSize(size);
    for (const url of ['/', '/en/']) {
      await page.goto(url);
      const { height, fontSize } = await page.locator('.hello h1').evaluate((h) => ({ height: h.getBoundingClientRect().height, fontSize: parseFloat(getComputedStyle(h).fontSize) }));
      expect(height, url).toBeLessThan(fontSize * 1.6);
    }
  });
}

for (const locale of ['ja', 'en'] as const) {
  const home = locale === 'ja' ? '/' : '/en/';

  test(`${locale}: hello introduces me and links to every project and the workflow`, async ({ page }) => {
    await page.goto(home);
    await expect(page.locator('.hello h1')).toHaveText('Hello!');
    await expect(page.locator('.hello .bio')).toContainText(locale === 'ja' ? '番場エリク' : 'Eric Bamba');
    const expected = expectedProjectLinks(locale);
    expect(expected.length).toBeGreaterThan(0);
    const links = await page.locator('.hello .links a').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
    expect(links).toEqual([...expected, locale === 'ja' ? '/about/#workflow' : '/en/about/#workflow']);
    await page.locator('.hello .links a').first().click();
    await expect(page).toHaveURL(expected[0]!);
  });

  test(`${locale}: skills, experience, education and contacts`, async ({ page }) => {
    await page.goto(home);
    await expect(page.locator('.skills h2')).toHaveText('Skills');
    expect(await page.locator('.skills li').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))).toEqual([
      'Go',
      'React',
      'TypeScript',
      'PostgreSQL',
      'Docker',
      'AWS',
    ]);
    await expect(page.locator('.experience h2')).toHaveText('Experience');
    await expect(page.locator('.experience li')).toHaveCount(3);
    await expect(page.locator('.experience li').last()).toContainText(locale === 'ja' ? '旅行会社' : 'Travel company');
    await expect(page.locator('.education h2')).toHaveText('Education');
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
    await page.goto('/');
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

test('on a phone the blocks stack: picture, hello, skills, experience, education, contacts', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/');
  const tops = await Promise.all(
    ['.photo', '.hello', '.skills', '.experience', '.education', '.contacts'].map(async (s) => (await page.locator(s).boundingBox())!.y),
  );
  expect([...tops].sort((a, b) => a - b)).toEqual(tops);
});

test('the site is white and has no theme switcher', async ({ page }) => {
  await page.goto('/');
  const [r, g, b] = (await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).match(/\d+/g)!.map(Number);
  expect(Math.min(r!, g!, b!)).toBeGreaterThan(215);
  await expect(page.locator('[data-theme-option]')).toHaveCount(0);
  await page.goto('/projects/visa-docs/');
  await expect(page.locator('[data-theme-option]')).toHaveCount(0);
});

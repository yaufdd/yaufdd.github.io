import { expect, test } from './fixtures';

const SLIDES = ['cover', 'task', 'before', 'after', 'architecture', 'highlights', 'outcome'];
const HEADINGS = {
  ja: { task: '課題', before: '以前', after: '現在', architecture: 'アーキテクチャ', highlights: '技術的な工夫', outcome: '振り返りと次の一手' },
  en: { task: 'The problem', before: 'Before', after: 'Now', architecture: 'Architecture', highlights: 'Technical highlights', outcome: 'What’s next' },
} as const;

for (const locale of ['ja', 'en'] as const) {
  const url = locale === 'ja' ? '/projects/visa-docs/' : '/en/projects/visa-docs/';

  test(`${locale}: the visa case is a deck of slides, in order, each with its heading`, async ({ page }) => {
    await page.goto(url);
    expect(await page.locator('.deck > .slide').evaluateAll((els) => els.map((e) => e.id.replace('slide-', '')))).toEqual(SLIDES);
    for (const [id, heading] of Object.entries(HEADINGS[locale])) {
      await expect(page.locator(`#slide-${id} h2`)).toHaveText(heading);
    }
    await expect(page.locator('#slide-cover h1')).toContainText(locale === 'ja' ? 'ビザ申請書類' : 'Visa Document Automation');
  });

  test(`${locale}: the problem slide shows the time saved per traveller`, async ({ page }) => {
    await page.goto(url);
    const metric = page.locator('#slide-task .metric');
    await expect(metric.locator('.before')).toHaveText('60');
    await expect(metric.locator('.after')).toHaveText('15');
    await expect(metric).toContainText(locale === 'ja' ? '30 人' : '30-person');
  });
}

test('before: traveller → staff → about 10 documents, with the pain spelled out', async ({ page }) => {
  await page.goto('/en/projects/visa-docs/');
  const flow = page.locator('#slide-before .flow');
  await expect(flow.locator('li.step b')).toHaveText(['Traveller', 'Staff']);
  await expect(flow.locator('li.result b')).toHaveText('~10 documents');
  await expect(page.locator('#slide-before .note')).toContainText('typo');
});

test('now: online form → admin panel ⇄ AI, and the admin panel hands out the files for the whole group', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/en/projects/visa-docs/');
  const flow = page.locator('#slide-after .flow');
  await expect(flow.locator('li.step b')).toHaveText(['Online form', 'Admin panel', 'AI (OCR + LLM)']);
  await expect(flow.locator('li.step').nth(1)).toHaveAttribute('data-link', 'both');
  await expect(flow.locator('li.step').nth(0)).toHaveAttribute('data-link', 'next');
  await expect(flow.locator('li.result b')).toHaveText('~10 ready files');
  // On a wide screen the result hangs right under the step it comes from (the admin panel), not after the AI.
  const admin = (await flow.locator('li.step').nth(1).boundingBox())!;
  const result = (await flow.locator('li.result').boundingBox())!;
  expect(Math.abs(result.x + result.width / 2 - (admin.x + admin.width / 2))).toBeLessThanOrEqual(4);
  expect(result.y).toBeGreaterThan(admin.y + admin.height);
  await expect(page.locator('#slide-after .note')).toContainText('whole set');
});

test('architecture: browser → Traefik/nginx → Go, branching to PostgreSQL, Yandex Cloud and Python', async ({ page }) => {
  await page.goto('/en/projects/visa-docs/');
  const arch = page.locator('#slide-architecture');
  await expect(arch.locator('.layers b')).toHaveText(['Browser', 'Traefik → nginx', 'Go backend']);
  await expect(arch.locator('.leaves b')).toHaveText(['PostgreSQL', 'Yandex Cloud', 'Python']);
});

test('highlights are short cards and the last slide links to the next project and home', async ({ page }) => {
  await page.goto('/projects/visa-docs/');
  const cards = page.locator('#slide-highlights .highlights li');
  expect(await cards.count()).toBeGreaterThanOrEqual(3);
  await expect(page.locator('#slide-outcome a[href="/projects/pacxpuctanno/"]')).toBeVisible();
  await expect(page.locator('#slide-outcome a[href="/"]')).toBeVisible();
});

for (const size of [
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
]) {
  test(`at ${size.width}×${size.height} every slide fills the screen and fits on it`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto('/projects/visa-docs/');
    for (const id of SLIDES) {
      const slide = page.locator(`#slide-${id}`);
      const { height } = (await slide.boundingBox())!;
      const content = await slide.evaluate((el) => el.scrollHeight);
      expect(height, `${id} is one screen tall`).toBeGreaterThanOrEqual(size.height - 1);
      expect(height, `${id} is one screen tall`).toBeLessThanOrEqual(size.height + 1);
      expect(content, `${id} content fits on the screen`).toBeLessThanOrEqual(height + 1);
    }
  });
}

test('on opening, the page stays at the very top: the header and its language switch are on screen', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/projects/visa-docs/');
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator('.lang a[hreflang="en"]')).toBeInViewport();
});

test('the dots: one per slide, the current one marked, a click jumps to its slide', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/projects/visa-docs/');
  const dots = page.locator('.deck-dots a');
  await expect(dots).toHaveCount(SLIDES.length);
  await expect(dots.first()).toHaveAttribute('aria-current', 'true');
  await dots.nth(3).click();
  await expect(page.locator('#slide-after')).toBeInViewport({ ratio: 0.6 });
  await expect(dots.nth(3)).toHaveAttribute('aria-current', 'true');
  await expect(dots.first()).not.toHaveAttribute('aria-current', 'true');
});

test('“Read more” is folded and holds the full case text', async ({ page }) => {
  await page.goto('/projects/visa-docs/');
  const more = page.locator('details.more');
  await expect(more).not.toHaveAttribute('open');
  await expect(more.locator('.prose h2').first()).toBeHidden();
  await more.locator('summary').click();
  await expect(more.locator('.prose h2').first()).toBeVisible();
  await expect(more.locator('.prose h2')).toHaveCount(5);
});

test('on a phone the flow runs top to bottom', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/projects/visa-docs/');
  const tops = await page.locator('#slide-after .flow li').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().top));
  expect(tops.length).toBe(4);
  expect([...tops].sort((a, b) => a - b)).toEqual(tops);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('every card is visible', async ({ page }) => {
    await page.goto('/projects/visa-docs/');
    for (const card of await page.locator('.deck li').all()) await expect(card).toHaveCSS('opacity', '1');
  });
});

test('pacxpuctanno keeps the article layout for now', async ({ page }) => {
  await page.goto('/projects/pacxpuctanno/');
  await expect(page.locator('.deck')).toHaveCount(0);
  await expect(page.locator('.prose h2').first()).toBeVisible();
});

import { expect, test, type Page } from '@playwright/test';

const opacityOf = (page: Page, selector: string) =>
  page.locator(selector).evaluateAll((els) => els.map((el) => getComputedStyle(el).opacity));

test('hero types `whoami`, then shows who I am and where to go next', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/\bmotion\b/);
  await expect(page.locator('.hero [data-type]').first()).toHaveText('whoami');
  await expect(page.locator('.hero [data-type]').nth(1)).toHaveText('番場 エリク — Eric Bamba');
  await expect(page.locator('.hero h1')).toHaveCSS('opacity', '1');
  await expect(page.locator('.hero .lead')).toContainText('一人で担当しているフルスタックエンジニア');
  await expect(page.locator('.hero .facts li')).toHaveCount(3);
  await expect(page.getByRole('link', { name: '実績を見る ↓' })).toHaveAttribute('href', '/#projects');
  await expect(page.getByRole('link', { name: '経歴・開発スタイル →' })).toHaveAttribute('href', '/about/');
});

test('english hero links stay in english', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.getByRole('link', { name: 'See projects ↓' })).toHaveAttribute('href', '/en/#projects');
  await expect(page.getByRole('link', { name: 'About & workflow →' })).toHaveAttribute('href', '/en/about/');
});

test('screen readers get the full hero text even while it is being typed', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.hero .sr-only').first()).toHaveText('whoami');
  await expect(page.locator('.hero [data-type]').first()).toHaveAttribute('aria-hidden', 'true');
});

test('"What I do" lists three things in both languages', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#what h2')).toHaveText('できること');
  await expect(page.locator('#what li')).toHaveCount(3);
  await page.goto('/en/');
  await expect(page.locator('#what h2')).toHaveText('What I do');
  await expect(page.locator('#what li')).toHaveCount(3);
});

test('project cards are calm text cards that invite a click', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('#projects .card');
  await expect(cards.first()).toContainText('詳しく見る →');
  await expect(cards.locator('.screen')).toHaveCount(0);
  await expect(cards.locator('img')).toHaveCount(0);
});

test('sections below the fold appear when scrolled to', async ({ page }) => {
  await page.goto('/');
  const item = page.locator('#what li').first();
  await item.scrollIntoViewIfNeeded();
  await expect(item).toHaveCSS('opacity', '1');
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('shows everything at once, without typing', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveClass(/\bmotion\b/);
    expect(new Set(await opacityOf(page, '[data-reveal]'))).toEqual(new Set(['1']));
    await expect(page.locator('.hero [data-type]').first()).toHaveText('whoami');
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('everything is visible and complete', async ({ page }) => {
    await page.goto('/');
    expect(new Set(await opacityOf(page, '[data-reveal], [data-type]'))).toEqual(new Set(['1']));
    await expect(page.locator('#projects .card').first()).toContainText('詳しく見る →');
  });
});

test('if the animation script fails, content still appears within ~3 seconds', async ({ page }) => {
  // Astro inlines small module scripts, so simulate a failure inside the script instead of blocking a request.
  await page.addInitScript(() => {
    // @ts-expect-error deliberately removing a browser API
    delete window.IntersectionObserver;
  });
  await page.goto('/');
  await page.waitForTimeout(3500);
  expect(new Set(await opacityOf(page, '[data-reveal], [data-type]'))).toEqual(new Set(['1']));
});

test('a space separates the prompt sign from the command', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.hero [data-type]').first()).toHaveText('whoami');
  const gap = await page.locator('.hero .prompt').evaluate((prompt) => {
    const sign = prompt.querySelector('.accent')!.getBoundingClientRect();
    const command = prompt.querySelector('[data-type]')!.getBoundingClientRect();
    return command.left - sign.right;
  });
  expect(gap).toBeGreaterThan(4);
});

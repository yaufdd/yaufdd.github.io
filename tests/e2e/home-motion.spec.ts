import { expect, test, type Page } from './fixtures';

const opacityOf = (page: Page, selector: string) =>
  page.locator(selector).evaluateAll((els) => els.map((el) => getComputedStyle(el).opacity));

test('blocks fade in and end up fully visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/\bmotion\b/);
  await expect(page.locator('.hello')).toHaveCSS('opacity', '1');
  // Lower blocks fade in as they scroll into view (on a short window the page scrolls).
  await page.locator('.contacts').scrollIntoViewIfNeeded();
  await expect(page.locator('.contacts')).toHaveCSS('opacity', '1');
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('shows everything at once', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveClass(/\bmotion\b/);
    expect(new Set(await opacityOf(page, '[data-reveal]'))).toEqual(new Set(['1']));
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('everything is visible', async ({ page }) => {
    await page.goto('/');
    expect(new Set(await opacityOf(page, '[data-reveal]'))).toEqual(new Set(['1']));
    await expect(page.locator('.hello h1')).toBeVisible();
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
  expect(new Set(await opacityOf(page, '[data-reveal]'))).toEqual(new Set(['1']));
});

import { expect, test } from './fixtures';

test('home pages exist and declare their language', async ({ page }) => {
  expect((await page.goto('/'))?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  // Astro's built-in 404 page also says lang="en", so the status check is what proves /en/ exists.
  expect((await page.goto('/en/'))?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('language switch on the home page', async ({ page }) => {
  await page.goto('/');
  await page.locator('.lang a[hreflang="en"]').click();
  await expect(page).toHaveURL('/en/');
  await page.locator('.lang a[hreflang="ja"]').click();
  await expect(page).toHaveURL('/');
});

test('head carries canonical and reciprocal hreflang links', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://yaufdd.github.io/en/');
  await expect(page.locator('link[hreflang="ja"]')).toHaveAttribute('href', 'https://yaufdd.github.io/');
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', 'https://yaufdd.github.io/en/');
  await expect(page.locator('link[hreflang="x-default"]')).toHaveAttribute('href', 'https://yaufdd.github.io/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https:\/\/yaufdd\.github\.io\/_astro\/.+\.png$/);
});

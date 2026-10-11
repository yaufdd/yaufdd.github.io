import { expect, test } from '@playwright/test';

for (const p of [
  { url: '/about/', lang: 'ja', h1: '経歴', workflow: '開発スタイル', other: '/en/about/' },
  { url: '/en/about/', lang: 'en', h1: 'About', workflow: 'How I work', other: '/about/' },
] as const) {
  test(`${p.url} shows background and workflow`, async ({ page }) => {
    await page.goto(p.url);
    await expect(page.locator('html')).toHaveAttribute('lang', p.lang);
    await expect(page.locator('h1')).toHaveText(p.h1);
    await expect(page.locator('#workflow h2')).toHaveText(p.workflow);
    await expect(page.locator('#workflow')).toContainText('Claude Code');
  });

  test(`${p.url} language switch keeps the page`, async ({ page }) => {
    await page.goto(p.url);
    await page.locator(`.lang a[hreflang="${p.lang === 'ja' ? 'en' : 'ja'}"]`).click();
    await expect(page).toHaveURL(p.other);
  });
}

test('./workflow in the nav jumps to the workflow section', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: './workflow' }).click();
  await expect(page).toHaveURL('/about/#workflow');
  await expect(page.locator('#workflow')).toBeInViewport();
});

test('unknown URLs get a noindex 404 page whose links work', async ({ page }) => {
  const response = await page.goto('/no-such-page/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('ページが見つかりません');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('.lang a[hreflang="ja"]')).toHaveAttribute('href', '/');
  await expect(page.locator('.lang a[hreflang="en"]')).toHaveAttribute('href', '/en/');
});

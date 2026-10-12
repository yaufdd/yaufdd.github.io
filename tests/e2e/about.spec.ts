import { expect, test } from './fixtures';

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
  await page.goto('/projects/visa-docs/');
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
  await expect(page.locator('.notfound p.mono')).toHaveText('トップへ戻る · Back to top');
});

test('contacts show the email address on both languages', async ({ page }) => {
  for (const url of ['/about/', '/en/about/']) {
    await page.goto(url);
    await expect(page.locator('.contacts a[href="mailto:ercbamba@gmail.com"]')).toHaveText('ercbamba@gmail.com');
  }
});

test('about lists experience, education and languages', async ({ page }) => {
  await page.goto('/about/');
  const prose = page.locator('.prose').first();
  for (const heading of ['自己紹介', '職歴', '学歴', '言語']) {
    await expect(prose.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  }
  await expect(prose).toContainText('FEAT MUSIC');
  await expect(prose).toContainText('一越株式会社');
  await expect(prose).toContainText('MIREA');
  await expect(prose).toContainText('日本語 — ネイティブ');
  await page.goto('/en/about/');
  const en = page.locator('.prose').first();
  for (const heading of ['About me', 'Experience', 'Education', 'Languages']) {
    await expect(en.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  }
  await expect(en).toContainText('Japanese — native');
});

test('the home page lists the languages I speak', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.contacts')).toContainText('日本語・ロシア語（ネイティブ）');
  await page.goto('/en/');
  await expect(page.locator('.contacts')).toContainText('Japanese · Russian (native)');
});

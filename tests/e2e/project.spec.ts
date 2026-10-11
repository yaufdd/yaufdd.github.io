import { expect, test } from '@playwright/test';

const PAGES = [
  { url: '/projects/visa-docs/', lang: 'ja', h1: 'ビザ申請書類 自動生成システム', other: '/en/projects/visa-docs/' },
  { url: '/en/projects/visa-docs/', lang: 'en', h1: 'Visa Document Automation', other: '/projects/visa-docs/' },
  { url: '/projects/pacxpuctanno/', lang: 'ja', h1: 'pacxpuctanno', other: '/en/projects/pacxpuctanno/' },
  { url: '/en/projects/pacxpuctanno/', lang: 'en', h1: 'pacxpuctanno', other: '/projects/pacxpuctanno/' },
] as const;

for (const p of PAGES) {
  test(`${p.url} renders the case`, async ({ page }) => {
    await page.goto(p.url);
    await expect(page.locator('html')).toHaveAttribute('lang', p.lang);
    await expect(page.locator('h1')).toContainText(p.h1);
    await expect(page.locator('.meta dl')).toBeVisible();
    await expect(page.locator('.prose h2')).toHaveCount(5);
  });

  test(`${p.url} language switch opens its translation`, async ({ page }) => {
    await page.goto(p.url);
    await page.locator(`.lang a[hreflang="${p.lang === 'ja' ? 'en' : 'ja'}"]`).click();
    await expect(page).toHaveURL(p.other);
  });
}

test('the overview shows period, team and roles', async ({ page }) => {
  await page.goto('/projects/visa-docs/');
  const meta = page.locator('.meta');
  await expect(meta).toContainText('2026年4月 〜 現在');
  await expect(meta).toContainText('1人（個人開発）');
  await expect(meta).toContainText('担当範囲');
  await expect(meta.locator('.tags li').first()).toHaveText('Go');
});

test('pacxpuctanno links to the live site in a new tab', async ({ page }) => {
  await page.goto('/projects/pacxpuctanno/');
  const live = page.locator('a.live');
  await expect(live).toHaveAttribute('href', 'https://pacxpuctanno.shop');
  await expect(live).toHaveAttribute('target', '_blank');
  await expect(live).toHaveAttribute('rel', /noopener/);
});

test('visa-docs has no live link', async ({ page }) => {
  expect((await page.goto('/projects/visa-docs/'))?.status()).toBe(200);
  await expect(page.locator('.meta')).toBeVisible();
  await expect(page.locator('a.live')).toHaveCount(0);
});

test('project pages use the project cover as OG image', async ({ page }) => {
  await page.goto('/projects/pacxpuctanno/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/_astro\/cover\..+\.png$/);
});

test('screenshots open in a lightbox and Escape returns focus', async ({ page }) => {
  await page.goto('/projects/pacxpuctanno/');
  const shot = page.locator('.prose img').first();
  await shot.click();
  const dialog = page.locator('dialog.lightbox');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('img.full')).toHaveAttribute('src', /\/_astro\/01-home\./);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(shot).toBeFocused();
});

test('the lightbox works from the keyboard', async ({ page }) => {
  await page.goto('/en/projects/pacxpuctanno/');
  await page.locator('.prose img').first().focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('dialog.lightbox')).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.locator('dialog.lightbox')).toBeHidden();
});

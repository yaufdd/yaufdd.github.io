import { expect, test } from './fixtures';

const PAGES = [
  { url: '/projects/visa-docs/', lang: 'ja', h1: 'ビザ申請書類 自動生成システム', other: '/en/projects/visa-docs/', story: true },
  { url: '/en/projects/visa-docs/', lang: 'en', h1: 'Visa Document Automation', other: '/projects/visa-docs/', story: true },
  { url: '/projects/pacxpuctanno/', lang: 'ja', h1: 'pacxpuctanno', other: '/en/projects/pacxpuctanno/', story: false },
  { url: '/en/projects/pacxpuctanno/', lang: 'en', h1: 'pacxpuctanno', other: '/projects/pacxpuctanno/', story: false },
] as const;

for (const p of PAGES) {
  test(`${p.url} renders the case`, async ({ page }) => {
    await page.goto(p.url);
    await expect(page.locator('html')).toHaveAttribute('lang', p.lang);
    await expect(page.locator('h1')).toContainText(p.h1);
    await expect(page.locator('.meta dl')).toBeVisible();
    // A case told as a visual story has its sections; an article has the five Markdown sections.
    if (p.story) await expect(page.locator('.story > section')).toHaveCount(6);
    else await expect(page.locator('.prose h2')).toHaveCount(5);
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
  await expect(meta).toContainText('2025年9月 〜 現在');
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

for (const url of ['/projects/pacxpuctanno/', '/en/projects/pacxpuctanno/']) {
  test(`the 3D figure stands to the right of the retrospective, beside it and clear of the text: ${url}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(url);
    const figure = page.locator('.case [data-avatar]');
    await expect(figure).toHaveCount(1);
    await figure.scrollIntoViewIfNeeded();
    const a = (await figure.boundingBox())!;
    // The retrospective is the last section: its heading and everything after it.
    const retro = await page.locator('.prose > h2').last().evaluate((h) => {
      const els = [h, ...[...h.parentElement!.children].slice([...h.parentElement!.children].indexOf(h) + 1)];
      const rects = els.map((el) => el.getBoundingClientRect());
      return { top: Math.min(...rects.map((r) => r.top)) + window.scrollY, bottom: Math.max(...rects.map((r) => r.bottom)) + window.scrollY, right: Math.max(...rects.map((r) => r.right)) };
    });
    const top = a.y + (await page.evaluate(() => window.scrollY));
    expect(a.x, 'to the right of the text').toBeGreaterThanOrEqual(retro.right);
    expect(top, 'beside the retrospective, not higher').toBeGreaterThanOrEqual(retro.top - 1);
    expect(top + a.height, 'beside the retrospective, not lower').toBeLessThanOrEqual(retro.bottom + 40);
  });
}

test('on a phone the figure of an article case sits under the retrospective', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/projects/pacxpuctanno/');
  const last = (await page.locator('.prose > *').last().boundingBox())!;
  const a = (await page.locator('.case [data-avatar]').boundingBox())!;
  expect(a.y).toBeGreaterThanOrEqual(last.y + last.height);
});

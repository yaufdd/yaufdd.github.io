import { expect, test, type Page } from './fixtures';

/** Pixels the petal canvas currently paints (alpha > 0). */
const paintedPixels = (page: Page) =>
  page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('[data-sakura]');
    if (!canvas || canvas.width === 0) return 0;
    const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
    let n = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i]! > 0) n++;
    return n;
  });

const sweep = async (page: Page) => {
  await page.mouse.move(200, 400);
  for (let i = 1; i <= 30; i++) await page.mouse.move(200 + i * 25, 400 + Math.sin(i / 4) * 80);
};

test('moving the mouse leaves a trail of pink sakura petals that falls and fades away', async ({ page }) => {
  await page.goto('/');
  await sweep(page);
  await expect.poll(() => paintedPixels(page)).toBeGreaterThan(200);
  const pink = await page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('[data-sakura]')!;
    const d = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
    let pinkish = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i + 3]! > 128 && d[i]! > 200 && d[i]! - d[i + 1]! > 25) pinkish++;
    return pinkish;
  });
  expect(pink).toBeGreaterThan(50);
  await expect.poll(() => paintedPixels(page), { timeout: 5_000 }).toBe(0);
});

test('the petals never get in the way of clicks', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-sakura]')).toHaveCSS('pointer-events', 'none');
  await sweep(page);
  const link = page.locator('.projects a').first();
  const href = await link.getAttribute('href');
  await link.click();
  await expect(page).toHaveURL(href!);
});

test('the case pages stay calm: no petals there', async ({ page }) => {
  await page.goto('/projects/visa-docs/');
  await expect(page.locator('[data-sakura]')).toHaveCount(0);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('no petals', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-sakura]'), 'the canvas is there, just never painted').toHaveCount(1);
    await sweep(page);
    await page.waitForTimeout(300);
    expect(await paintedPixels(page)).toBe(0);
  });
});

test.describe('touch screens', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  test('no petals', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-sakura]'), 'the canvas is there, just never painted').toHaveCount(1);
    await page.touchscreen.tap(200, 400);
    await sweep(page);
    await page.waitForTimeout(300);
    expect(await paintedPixels(page)).toBe(0);
  });
});

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

/** Computed cursor values: the flower image for ordinary places, a bigger flower for things to click. */
const FLOWER = /url\("[^"]*\/cursors\/sakura\.png"\)/;
const FLOWER_LINK = /url\("[^"]*\/cursors\/sakura-link\.png"\)/;
const cursorOf = (page: Page, selector: string) => page.locator(selector).first().evaluate((el) => getComputedStyle(el).cursor);

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

for (const url of ['/about/', '/en/', '/projects/visa-docs/', '/en/projects/pacxpuctanno/', '/404.html']) {
  test(`petals and the flower cursor on every page: ${url}`, async ({ page }) => {
    await page.goto(url);
    await expect(page.locator('[data-sakura]')).toHaveCount(1);
    expect(await cursorOf(page, 'body')).toMatch(FLOWER);
    await sweep(page);
    await expect.poll(() => paintedPixels(page)).toBeGreaterThan(200);
  });
}

test('the screenshot viewer keeps the flower cursor', async ({ page }) => {
  await page.goto('/projects/pacxpuctanno/');
  await page.locator('.prose img').first().click();
  await expect(page.locator('dialog.lightbox')).toBeVisible();
  expect(await cursorOf(page, 'dialog.lightbox')).toMatch(FLOWER);
  expect(await cursorOf(page, 'dialog.lightbox button.close')).toMatch(FLOWER_LINK);
});

test('the arrow is a sakura flower; over links and the 3D figure it is a bigger one', async ({ page }) => {
  await page.goto('/');
  for (const target of ['body', '.hello h1', '.experience p']) expect(await cursorOf(page, target), target).toMatch(FLOWER);
  for (const target of ['.projects a', '.contacts a', '.lang a', '[data-avatar]']) expect(await cursorOf(page, target), target).toMatch(FLOWER_LINK);
  // The arrow is never hidden: the flower is a real cursor, so the pointer is visible even when it stands still.
  expect(await cursorOf(page, 'body')).not.toBe('none');
});

test('the flower cursor images are served and small', async ({ request }) => {
  for (const file of ['sakura.png', 'sakura@2x.png', 'sakura-link.png', 'sakura-link@2x.png']) {
    const response = await request.get(`/cursors/${file}`);
    expect(response.status(), file).toBe(200);
    expect((await response.body()).byteLength, file).toBeLessThan(20 * 1024);
  }
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
  test('the flower cursor stays (it does not move by itself)', async ({ page }) => {
    await page.goto('/');
    expect(await cursorOf(page, 'body')).toMatch(FLOWER);
    expect(await cursorOf(page, '.projects a')).toMatch(FLOWER_LINK);
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

import { expect, test, type Page } from '@playwright/test';

const avatar = '[data-avatar]';

// These tests load the real model (unlike ./fixtures), but like the fixtures they skip Google Fonts:
// a slow font fetch delays the load event past the test timeout, and nothing here depends on the font.
test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
});

test('the 3D avatar loads, renders and reacts to a click', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator(`${avatar} img.poster`)).toHaveAttribute('alt', '番場エリクの 3D アバター');
  await expect(page.locator(avatar)).toHaveAttribute('data-state', 'ready', { timeout: 20_000 });
  await expect(page.locator(`${avatar} canvas`)).toBeVisible();
  await expect(page.locator(avatar), 'the model has a separate head').toHaveAttribute('data-head', 'turns');
  await page.locator(`${avatar} canvas`).click();
  await expect(page.locator(avatar)).toHaveAttribute('data-jumps', '1');
  expect(errors).toEqual([]);
});

/**
 * Mean colour and area of the figure's own pixels: those that differ from the empty frame. Comparing these instead of
 * pixel by pixel tolerates the live figure's idle sway. PNGs are decoded in the page (no image library on the Node side).
 */
async function figureLook(page: Page, empty: Buffer, shot: Buffer): Promise<{ area: number; rgb: number[] }> {
  return page.evaluate(
    async ([emptyB64, shotB64]) => {
      const pixels = async (b64: string) => {
        const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${b64}`)).blob());
        const ctx = new OffscreenCanvas(bitmap.width, bitmap.height).getContext('2d')!;
        ctx.drawImage(bitmap, 0, 0);
        return ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
      };
      const [bg, px] = await Promise.all([pixels(emptyB64!), pixels(shotB64!)]);
      const sum = [0, 0, 0];
      let area = 0;
      for (let i = 0; i < px.length; i += 4) {
        if (Math.abs(px[i]! - bg[i]!) + Math.abs(px[i + 1]! - bg[i + 1]!) + Math.abs(px[i + 2]! - bg[i + 2]!) < 24) continue;
        for (let c = 0; c < 3; c++) sum[c]! += px[i + c]!;
        area++;
      }
      return { area, rgb: sum.map((v) => v / Math.max(area, 1)) };
    },
    [empty.toString('base64'), shot.toString('base64')],
  );
}

test('the still image looks like the live 3D figure, so swapping one for the other does not flash', async ({ page }) => {
  // Renders the 350k-triangle model on the CPU (headless WebGL) while the rest of the suite runs in parallel.
  test.slow();
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/');
  const figure = page.locator(avatar);
  await figure.scrollIntoViewIfNeeded();
  await expect(figure).toHaveAttribute('data-state', 'ready', { timeout: 30_000 });
  const css = (canvas: number, poster: number) =>
    `${avatar} canvas { opacity: ${canvas} !important; transition: none !important } ${avatar} .poster { opacity: ${poster} !important; transition: none !important }`;
  const style = await page.addStyleTag({ content: css(0, 0) });
  const show = async (canvas: number, poster: number) => {
    await style.evaluate((el, text) => (el.textContent = text), css(canvas, poster));
    return figure.screenshot();
  };
  const empty = await show(0, 0);
  const live = await figureLook(page, empty, await show(1, 0));
  const still = await figureLook(page, empty, await show(0, 1));
  // Measured: live vs a still from the same camera and light differ by < 2 per channel; the old Blender still by ~25.
  for (let c = 0; c < 3; c++) expect(Math.abs(live.rgb[c]! - still.rgb[c]!), `channel ${c}: live ${live.rgb} vs still ${still.rgb}`).toBeLessThan(5);
  expect(still.area / live.area).toBeGreaterThan(0.93);
  expect(still.area / live.area).toBeLessThan(1.07);
});

test('the avatar blinks every few seconds', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator(avatar)).toHaveAttribute('data-state', 'ready', { timeout: 20_000 });
  await expect(page.locator(avatar)).toHaveAttribute('data-blinks', /^[1-9][0-9]*$/, { timeout: 15_000 });
});

test('the closed-eye textures are served and stay within their size budget', async ({ request }) => {
  for (const file of ['avatar-blink.webp', 'avatar-blink-normal.webp']) {
    const response = await request.get(`/models/${file}`);
    expect(response.status(), file).toBe(200);
    expect((await response.body()).byteLength, file).toBeLessThan(300 * 1024);
  }
});

test('the model file is served and stays within its size budget', async ({ request }) => {
  const response = await request.get('/models/avatar.glb');
  expect(response.status()).toBe(200);
  expect((await response.body()).byteLength).toBeLessThan(4 * 1024 * 1024);
});

test('english page labels the avatar in english', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator(`${avatar} img.poster`)).toHaveAttribute('alt', '3D avatar of Eric Bamba');
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('shows the still image and never downloads the 3D model', async ({ page }) => {
    const modelRequests: string[] = [];
    page.on('request', (r) => r.url().endsWith('.glb') && modelRequests.push(r.url()));
    await page.goto('/');
    await expect(page.locator(avatar)).toHaveAttribute('data-state', 'static');
    await expect(page.locator(`${avatar} img.poster`)).toBeVisible();
    await page.waitForTimeout(1500);
    expect(modelRequests).toEqual([]);
  });
});

test('without WebGL the still image stays and nothing breaks', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (type.startsWith('webgl')) return null;
      return (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof original;
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator(avatar)).toHaveAttribute('data-state', 'fallback');
  await expect(page.locator(`${avatar} img.poster`)).toBeVisible();
  expect(errors).toEqual([]);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('the still image is shown', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator(`${avatar} img.poster`)).toBeVisible();
  });
});

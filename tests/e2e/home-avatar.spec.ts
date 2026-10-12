import { expect, test } from '@playwright/test';

const avatar = '.hero [data-avatar]';

test('the 3D avatar loads, renders and reacts to a click', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator(`${avatar} img.poster`)).toHaveAttribute('alt', '番場エリクの 3D アバター');
  await expect(page.locator(avatar)).toHaveAttribute('data-state', 'ready', { timeout: 20_000 });
  await expect(page.locator(`${avatar} canvas`)).toBeVisible();
  await page.locator(`${avatar} canvas`).click();
  await expect(page.locator(avatar)).toHaveAttribute('data-jumps', '1');
  expect(errors).toEqual([]);
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

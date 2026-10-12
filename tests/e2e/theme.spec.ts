import { expect, test } from './fixtures';

const DIM_BG = 'rgb(34, 39, 46)';

test('dim is the default theme', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dim');
  await expect(page.locator('body')).toHaveCSS('background-color', DIM_BG);
  await expect(page.getByRole('button', { name: 'dim', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('the chosen theme persists across reloads and pages', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'paper', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper');
  await page.goto('/en/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper');
  await expect(page.getByRole('button', { name: 'paper', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('the stored theme is applied before <body> exists (no flash)', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'light');
    new MutationObserver((_, observer) => {
      if (document.body) {
        (window as unknown as { themeAtBody: string }).themeAtBody = document.documentElement.dataset.theme ?? 'none';
        observer.disconnect();
      }
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto('/');
  expect(await page.evaluate(() => (window as unknown as { themeAtBody: string }).themeAtBody)).toBe('light');
});

test('blocked storage: renders dim and switching still works', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('denied', 'SecurityError');
      },
    });
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dim');
  await page.getByRole('button', { name: 'light', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(errors).toEqual([]);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('falls back to dim and hides the switcher', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toHaveCSS('background-color', DIM_BG);
    await expect(page.locator('.themes')).toBeHidden();
    await expect(page.locator('h1')).toBeVisible();
  });
});

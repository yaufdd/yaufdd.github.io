import { expect, test } from '@playwright/test';

test('home lists the projects in order and links to them', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('#projects .card');
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0)).toContainText('ビザ申請書類');
  await expect(cards.nth(1)).toContainText('pacxpuctanno');
  await cards.nth(0).click();
  await expect(page).toHaveURL('/projects/visa-docs/');
});

test('english home links to english cases', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('#projects .card').first()).toHaveAttribute('href', '/en/projects/visa-docs/');
  await expect(page.locator('#projects .card').first()).toContainText('Visa Document Automation');
});

test('stack shows AI dev tools as their own group', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'AI・開発ツール' })).toBeVisible();
  await expect(page.getByText('Claude Code', { exact: true })).toBeVisible();
});

test('./projects in the nav jumps to the list', async ({ page }) => {
  await page.goto('/about/');
  await page.getByRole('link', { name: './projects' }).click();
  await expect(page).toHaveURL('/#projects');
  await expect(page.locator('#projects')).toBeInViewport();
});

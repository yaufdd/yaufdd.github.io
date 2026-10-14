import { expect, test } from './fixtures';

for (const locale of ['ja', 'en'] as const) {
  const url = locale === 'ja' ? '/projects/estimate-versions/' : '/en/projects/estimate-versions/';

  test(`${locale}: the quote version control case is told the same way as the visa case`, async ({ page }) => {
    expect((await page.goto(url))?.status()).toBe(200);
    await expect(page.locator('#story-cover h1')).toHaveText(locale === 'ja' ? '見積書バージョン管理' : 'Quote Version Control');
    expect(await page.locator('.story > section').evaluateAll((els) => els.map((e) => e.id))).toEqual([
      'story-cover',
      'story-task',
      'story-change',
      'story-architecture',
      'story-highlights',
      'story-outcome',
    ]);
    await expect(page.locator('#story-change .flow')).toHaveCount(2);
    await expect(page.locator('#story-change .flow.after li.aside')).toHaveCount(1);
    await expect(page.locator('.story > figure.screens img')).toHaveCount(2);
    await expect(page.locator('#story-highlights li')).toHaveCount(3);
    await expect(page.locator('#story-outcome [data-avatar]')).toHaveCount(1);
  });

  test(`${locale}: the employer's name never shows on the quote case`, async ({ page }) => {
    await page.goto(url);
    expect((await page.content()).toLowerCase()).not.toContain('fuji');
  });
}

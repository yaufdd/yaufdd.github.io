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
    await expect(page.locator('#story-cover figure.screens img')).toHaveCount(2);
    await expect(page.locator('#story-highlights li')).toHaveCount(3);
    await expect(page.locator('#story-outcome [data-avatar]')).toHaveCount(1);
  });

  test(`${locale}: the employer's name never shows on the quote case`, async ({ page }) => {
    await page.goto(url);
    expect((await page.content()).toLowerCase()).not.toContain('fuji');
  });
}

test('the screens sit right under the summary, so they are the first thing you see', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/projects/estimate-versions/');
  const next = await page.locator('#story-cover .lead').evaluate((el) => el.nextElementSibling?.matches('figure.screens'));
  expect(next, 'the figure follows the summary').toBe(true);
  await expect(page.locator('#story-cover figure.screens')).toBeInViewport({ ratio: 0.9 });
  await expect(page.locator('#story-cover figure.screens img[src*="quote-diff"]')).toBeVisible();
  await expect(page.locator('.story > figure.screens')).toHaveCount(0);
});

for (const locale of ['ja', 'en'] as const) {
  test(`${locale}: the before-row explains why versions matter: many quotes from first request to final, for the client and for staff`, async ({ page }) => {
    await page.goto(locale === 'ja' ? '/projects/estimate-versions/' : '/en/projects/estimate-versions/');
    const pain = page.locator('#story-change .note.pain');
    for (const words of locale === 'ja' ? ['最初の問い合わせ', '最終', '顧客', '自分'] : ['first request', 'final', 'show the client', 'themselves']) {
      await expect(pain).toContainText(words);
    }
  });
}

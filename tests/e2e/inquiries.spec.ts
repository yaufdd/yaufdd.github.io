import { expect, test } from './fixtures';

for (const locale of ['ja', 'en'] as const) {
  const url = locale === 'ja' ? '/projects/inquiry-hub/' : '/en/projects/inquiry-hub/';

  test(`${locale}: the inquiry hub case opens with its screens and tells the story like the others`, async ({ page }) => {
    expect((await page.goto(url))?.status()).toBe(200);
    await expect(page.locator('#story-cover h1')).toHaveText(locale === 'ja' ? '問い合わせ一元管理システム' : 'Inquiry Hub');
    expect(await page.locator('.story > section').evaluateAll((els) => els.map((e) => e.id))).toEqual([
      'story-cover',
      'story-task',
      'story-change',
      'story-architecture',
      'story-highlights',
      'story-outcome',
    ]);
    // Screens right under the summary: the admin home and a request (no Telegram screenshot).
    const shots = page.locator('#story-cover figure.screens img');
    await expect(shots).toHaveCount(2);
    expect(await shots.evaluateAll((els) => els.map((e) => (e as HTMLImageElement).currentSrc || (e as HTMLImageElement).src))).toEqual([
      expect.stringContaining('hub-home'),
      expect.stringContaining('hub-request'),
    ]);
    await expect(page.locator('img[src*="hub-bot"]')).toHaveCount(0);
    await expect(page.locator('#story-cover figure.screens .mock-note')).toBeVisible();
    await expect(page.locator('#story-highlights li')).toHaveCount(3);
    await expect(page.locator('#story-outcome [data-avatar]')).toHaveCount(1);
  });

  test(`${locale}: the problem is inquiries scattered across channels; the hub puts them in one list`, async ({ page }) => {
    await page.goto(url);
    for (const words of locale === 'ja' ? ['メール', 'Telegram', 'WhatsApp'] : ['email', 'Telegram', 'WhatsApp']) {
      await expect(page.locator('#story-task')).toContainText(words);
    }
    await expect(page.locator('#story-change .flow.after')).toContainText(locale === 'ja' ? '1 つの一覧' : 'One list');
  });

  test(`${locale}: no employer or product name on the inquiry hub case`, async ({ page }) => {
    await page.goto(url);
    expect((await page.content()).toLowerCase()).not.toContain('fuji');
  });
}


import { expect, test } from './fixtures';

const GROUPS = {
  ja: { travel: '旅行会社での開発', personal: '個人プロジェクト' },
  en: { travel: 'At a travel company', personal: 'Personal projects' },
} as const;

for (const locale of ['ja', 'en'] as const) {
  const prefix = locale === 'ja' ? '/' : '/en/';

  test(`${locale}: the projects page lists the travel company's systems, then personal projects`, async ({ page }) => {
    expect((await page.goto(`${prefix}projects/`))?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('h1')).toHaveText(locale === 'ja' ? 'プロジェクト' : 'Projects');
    await expect(page.locator('#travel h2')).toHaveText(GROUPS[locale].travel);
    await expect(page.locator('#personal h2')).toHaveText(GROUPS[locale].personal);
    const hrefs = (id: string) => page.locator(`#${id} .card a`).evaluateAll((els) => els.map((e) => e.getAttribute('href')));
    expect(await hrefs('travel')).toEqual([`${prefix}projects/visa-docs/`, `${prefix}projects/estimate-versions/`, `${prefix}projects/inquiry-hub/`]);
    expect(await hrefs('personal')).toEqual([`${prefix}projects/pacxpuctanno/`]);
  });

  test(`${locale}: each card shows a picture, the title, the summary and the stack, and opens the case`, async ({ page }) => {
    await page.goto(`${prefix}projects/`);
    const cards = page.locator('.card');
    await expect(cards).toHaveCount(4);
    for (const card of await cards.all()) {
      await expect(card.locator('img')).toHaveAttribute('alt', /.+/);
      await expect(card.locator('h3')).not.toBeEmpty();
      await expect(card.locator('p')).not.toBeEmpty();
      expect(await card.locator('.tags li').count()).toBeGreaterThan(0);
    }
    await cards.first().locator('a').click();
    await expect(page).toHaveURL(`${prefix}projects/visa-docs/`);
  });

  test(`${locale}: "see details" on the home page lands on the travel company's part`, async ({ page }) => {
    await page.goto(prefix);
    await page.locator('.projects li.group a').click();
    await expect(page).toHaveURL(`${prefix}projects/#travel`);
    await expect(page.locator('#travel')).toBeInViewport();
  });
}

test('the projects page has no employer or product names', async ({ page }) => {
  for (const url of ['/projects/', '/en/projects/']) {
    await page.goto(url);
    expect((await page.content()).toLowerCase(), url).not.toContain('fuji');
  }
});

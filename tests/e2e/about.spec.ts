import { expect, test } from './fixtures';

for (const p of [
  { url: '/about/', lang: 'ja', h1: '経歴', other: '/en/about/' },
  { url: '/en/about/', lang: 'en', h1: 'About', other: '/about/' },
  { url: '/workflow/', lang: 'ja', h1: '開発スタイル', other: '/en/workflow/' },
  { url: '/en/workflow/', lang: 'en', h1: 'How I work', other: '/workflow/' },
] as const) {
  test(`${p.url} has its title in its language`, async ({ page }) => {
    await page.goto(p.url);
    await expect(page.locator('html')).toHaveAttribute('lang', p.lang);
    await expect(page.locator('h1')).toHaveText(p.h1);
  });

  test(`${p.url} shows the 3D figure only on the About page: centred under the links, without pushing the text down`, async ({ page }) => {
    await page.goto(p.url);
    if (p.url.includes('workflow')) {
      await expect(page.locator('[data-avatar]')).toHaveCount(0);
      return;
    }
    const figure = (await page.locator('[data-avatar]').boundingBox())!;
    expect(Math.abs(figure.x + figure.width / 2 - page.viewportSize()!.width / 2)).toBeLessThanOrEqual(2);
    expect(figure.height).toBeGreaterThanOrEqual(170);
    expect(figure.y).toBeGreaterThanOrEqual((await page.locator('.site-header').boundingBox())!.y + (await page.locator('.site-header').boundingBox())!.height - 16);
    expect(figure.y + figure.height).toBeLessThanOrEqual((await page.locator('.prose h2').first().boundingBox())!.y);
    // The heading row is only as tall as the title: the figure takes no room of its own.
    const head = (await page.locator('.page-head').boundingBox())!;
    const titleBlock = (await page.locator('.page-head > div').first().boundingBox())!;
    expect(Math.abs(head.height - titleBlock.height)).toBeLessThanOrEqual(1);
  });

  test(`${p.url} language switch keeps the page`, async ({ page }) => {
    await page.goto(p.url);
    await page.locator(`.lang a[hreflang="${p.lang === 'ja' ? 'en' : 'ja'}"]`).click();
    await expect(page).toHaveURL(p.other);
  });
}

test('the header links to about, workflow and projects', async ({ page }) => {
  await page.goto('/about/');
  await page.getByRole('link', { name: './projects' }).click();
  await expect(page).toHaveURL('/projects/');
  await page.goto('/en/about/');
  await expect(page.getByRole('link', { name: './projects' })).toHaveAttribute('href', '/en/projects/');
});

test('how I work has its own page, apart from the background', async ({ page }) => {
  await page.goto('/about/');
  await expect(page.locator('.prose')).not.toContainText('Claude Code');
  await page.goto('/projects/visa-docs/');
  await page.getByRole('link', { name: './workflow' }).click();
  await expect(page).toHaveURL('/workflow/');
  const prose = page.locator('.prose');
  for (const heading of ['プロジェクトの始め方', '進め方：仕様 → 計画 → 実装', 'エージェント', '技術スタック', 'ツール：MCP とプラグイン']) {
    await expect(prose.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  }
  for (const word of ['CLAUDE.md', 'Superpowers', 'Gin', 'sqlc', 'PostgreSQL', 'Traefik', 'Serena']) await expect(prose).toContainText(word);
});

test('unknown URLs get a noindex 404 page whose links work', async ({ page }) => {
  const response = await page.goto('/no-such-page/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('ページが見つかりません');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('.lang a[hreflang="ja"]')).toHaveAttribute('href', '/');
  await expect(page.locator('.lang a[hreflang="en"]')).toHaveAttribute('href', '/en/');
  await expect(page.locator('.notfound p.mono')).toHaveText('トップへ戻る · Back to top');
});

test('contacts show the email address on both languages', async ({ page }) => {
  for (const url of ['/about/', '/en/about/']) {
    await page.goto(url);
    await expect(page.locator('.contacts a[href="mailto:ercbamba@gmail.com"]')).toHaveText('ercbamba@gmail.com');
  }
});

test('about lists experience, education and languages', async ({ page }) => {
  await page.goto('/about/');
  const prose = page.locator('.prose').first();
  for (const heading of ['自己紹介', '趣味', '職歴', '学歴', '言語']) {
    await expect(prose.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  }
  await expect(prose).toContainText('FEAT MUSIC');
  await expect(prose).toContainText('一越株式会社');
  await expect(prose).toContainText('MIREA');
  await expect(prose).toContainText('日本語 — ネイティブ');
  await page.goto('/en/about/');
  const en = page.locator('.prose').first();
  for (const heading of ['About me', 'Hobbies', 'Experience', 'Education', 'Languages']) {
    await expect(en.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  }
  await expect(en).toContainText('Japanese — native');
  await expect(en).toContainText('Ace of Diamond');
});

test('the home page lists the languages I speak', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.contacts')).toContainText('日本語・ロシア語・英語');
  await page.goto('/en/');
  await expect(page.locator('.contacts')).toContainText('Japanese · Russian · English');
});

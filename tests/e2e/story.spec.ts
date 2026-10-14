import { expect, test } from './fixtures';

const SECTIONS = ['cover', 'task', 'change', 'architecture', 'highlights', 'outcome'];
const HEADINGS = {
  ja: { task: '課題', change: '以前と現在', architecture: 'アーキテクチャ', highlights: '技術的な工夫', outcome: '振り返りと次の一手' },
  en: { task: 'The problem', change: 'Before and now', architecture: 'Architecture', highlights: 'Technical highlights', outcome: 'What’s next' },
} as const;
const ROWS = { ja: ['以前', '現在'], en: ['Before', 'Now'] } as const;

for (const locale of ['ja', 'en'] as const) {
  const url = locale === 'ja' ? '/projects/visa-docs/' : '/en/projects/visa-docs/';

  test(`${locale}: the visa case is told in visual sections, in order, each with its heading`, async ({ page }) => {
    await page.goto(url);
    expect(await page.locator('.story > section').evaluateAll((els) => els.map((e) => e.id.replace('story-', '')))).toEqual(SECTIONS);
    for (const [id, heading] of Object.entries(HEADINGS[locale])) {
      await expect(page.locator(`#story-${id} h2`)).toHaveText(heading);
    }
    await expect(page.locator('#story-change h3')).toHaveText([...ROWS[locale]]);
    await expect(page.locator('#story-cover h1')).toContainText(locale === 'ja' ? 'ビザ申請書類' : 'Visa Document Automation');
  });

  test(`${locale}: the problem is plain text, with only the times in bold`, async ({ page }) => {
    await page.goto(url);
    const task = page.locator('#story-task');
    await expect(task.locator('.metric')).toHaveCount(0);
    await expect(task.locator('p').first()).toHaveCSS('font-weight', '400');
    const bold = await task.locator('strong').allTextContents();
    expect(bold.length).toBeGreaterThanOrEqual(2);
    expect(bold.join(' ')).toContain(locale === 'ja' ? '15 分' : '15 minutes');
    for (const text of bold) expect(text, 'only times are bold').toMatch(locale === 'ja' ? /[0-9.]+ ?(分|時間)/ : /[0-9.]+ (minutes|hours)|an hour/);
    await expect(task).toContainText(locale === 'ja' ? '30 人のツアー' : '30-person tour');
    // A tour is not 30 × 15 minutes: once everyone has filled in the form, the whole tour's documents come out at once.
    await expect(task.locator('.statement')).toContainText(locale === 'ja' ? 'まとめて生成' : 'at once');
    await expect(task.locator('.statement')).not.toContainText('7.5');
  });
}

for (const locale of ['ja', 'en'] as const) {
  const url = locale === 'ja' ? '/projects/visa-docs/' : '/en/projects/visa-docs/';
  const DOCS = {
    ja: { must: ['査証申請書', '委任状', 'スポンサーレター', '滞在予定表'], note: ['約 10 個', '手作業'], source: '外務省' },
    en: { must: ['Visa application form', 'Power of attorney', 'Sponsor letter', 'Schedule of stay'], note: ['about 10', 'by hand'], source: 'Ministry of Foreign Affairs' },
  }[locale];

  test(`${locale}: the problem lists the documents made for each traveller, with the official form as an example`, async ({ page }) => {
    await page.goto(url);
    const docs = page.locator('#story-task .docs');
    const items = await docs.locator('li').allTextContents();
    expect(items.length).toBeGreaterThanOrEqual(6);
    for (const name of DOCS.must) expect(items.some((i) => i.includes(name)), name).toBe(true);
    for (const words of DOCS.note) await expect(docs.locator('.docs-note')).toContainText(words);
    const example = docs.locator('figure.example');
    await expect(example.locator('img')).toBeVisible();
    await expect(example.locator('img')).toHaveAttribute('alt', /.+/);
    await expect(example.locator('a')).toHaveAttribute('href', 'https://www.mofa.go.jp/mofaj/files/000124525.pdf');
    await expect(example.locator('figcaption')).toContainText(DOCS.source);
    // The embassy page was only the source of the list: it is not linked.
    await expect(page.locator('a[href*="emb-japan"]')).toHaveCount(0);
  });
}

test('before: traveller → staff → about 10 documents in one row, with the pain spelled out', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/en/projects/visa-docs/');
  const flow = page.locator('#story-change .flow.before');
  await expect(flow.locator('li.step b')).toHaveText(['Traveller', 'Staff']);
  await expect(flow.locator('li.result b')).toHaveText('~10 documents');
  // The result comes from the last step, so it simply follows it in the same row.
  await expect(flow.locator('li.step').nth(1)).toHaveAttribute('data-link', 'next');
  const staff = (await flow.locator('li.step').nth(1).boundingBox())!;
  const result = (await flow.locator('li.result').boundingBox())!;
  expect(Math.abs(result.y - staff.y)).toBeLessThanOrEqual(2);
  expect(result.x).toBeGreaterThan(staff.x + staff.width);
  // The pain is explained in plain words (spelling mistakes got documents rejected: human error), not shouted in red.
  const pain = page.locator('#story-change .note.pain');
  await expect(pain).toContainText('misspelt');
  await expect(pain).toContainText('human error');
  const [r, g, b] = (await pain.evaluate((el) => getComputedStyle(el).color)).match(/\d+/g)!.map(Number);
  expect(Math.max(r!, g!, b!) - Math.min(r!, g!, b!), 'grey, not red').toBeLessThanOrEqual(8);
  await expect(pain).toHaveCSS('font-weight', '400');
});

test('before and now share one section, and the cards are compact', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/projects/visa-docs/');
  await expect(page.locator('#story-change .flow')).toHaveCount(2);
  for (const card of await page.locator('#story-change li').all()) {
    expect((await card.boundingBox())!.height).toBeLessThanOrEqual(90);
  }
  expect((await page.locator('#story-change').boundingBox())!.height).toBeLessThan(800);
});

test('now: online form → admin panel → about 10 ready files, with the AI under the admin panel, back and forth', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/en/projects/visa-docs/');
  const flow = page.locator('#story-change .flow.after');
  await expect(flow.locator('li.step b')).toHaveText(['Online form', 'Admin panel']);
  await expect(flow.locator('li.result b')).toHaveText('~10 ready files');
  await expect(flow.locator('li.aside b')).toHaveText('AI (OCR + LLM)');
  await expect(flow.locator('li.aside')).toHaveAttribute('data-link', 'both');
  const admin = (await flow.locator('li.step').nth(1).boundingBox())!;
  const files = (await flow.locator('li.result').boundingBox())!;
  const ai = (await flow.locator('li.aside').boundingBox())!;
  // The files follow the admin panel in the row …
  expect(Math.abs(files.y - admin.y)).toBeLessThanOrEqual(2);
  expect(files.x).toBeGreaterThan(admin.x + admin.width);
  // … and the AI hangs right under the admin panel.
  expect(Math.abs(ai.x + ai.width / 2 - (admin.x + admin.width / 2))).toBeLessThanOrEqual(4);
  expect(ai.y).toBeGreaterThan(admin.y + admin.height);
  await expect(page.locator('#story-change .note:not(.pain)')).toContainText('whole set');
});

test('architecture: browser → Traefik/nginx → Go, branching to PostgreSQL, Yandex Cloud and Python', async ({ page }) => {
  await page.goto('/en/projects/visa-docs/');
  const arch = page.locator('#story-architecture');
  await expect(arch.locator('.layers b')).toHaveText(['Browser', 'Traefik → nginx', 'Go backend']);
  await expect(arch.locator('.leaves b')).toHaveText(['PostgreSQL', 'Yandex Cloud', 'Python']);
});

test('highlights are short cards and the last section links to the next project and home', async ({ page }) => {
  await page.goto('/projects/visa-docs/');
  const cards = page.locator('#story-highlights .highlights li');
  expect(await cards.count()).toBeGreaterThanOrEqual(3);
  await expect(page.locator('#story-outcome a[href="/projects/pacxpuctanno/"]')).toBeVisible();
  await expect(page.locator('#story-outcome a[href="/"]')).toBeVisible();
});

test('it is one continuous page: no snapping, no slide dots, sections only as tall as their content', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/projects/visa-docs/');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType)).toMatch(/^(none)?$/);
  await expect(page.locator('.deck-dots, .story-dots')).toHaveCount(0);
  for (const id of ['outcome']) {
    const { height } = (await page.locator(`#story-${id}`).boundingBox())!;
    expect(height, id).toBeLessThan(600);
  }
});

test('on opening, the page stays at the very top: the header and its language switch are on screen', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/projects/visa-docs/');
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator('.lang a[hreflang="en"]')).toBeInViewport();
});

test('“Read more” is folded and holds the full case text', async ({ page }) => {
  await page.goto('/projects/visa-docs/');
  const more = page.locator('details.more');
  await expect(more).not.toHaveAttribute('open');
  await expect(more.locator('.prose h2').first()).toBeHidden();
  await more.locator('summary').click();
  await expect(more.locator('.prose h2').first()).toBeVisible();
  await expect(more.locator('.prose h2')).toHaveCount(5);
});

test('on a phone the flow runs top to bottom', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/projects/visa-docs/');
  const tops = await page.locator('#story-change .flow.after li').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().top));
  expect(tops.length).toBe(4);
  expect([...tops].sort((a, b) => a - b)).toEqual(tops);
});

test('nothing fades in: every card and arrow is there from the start, even far down the page', async ({ page }) => {
  await page.goto('/projects/visa-docs/');
  await expect(page.locator('.story [data-reveal]')).toHaveCount(0);
  for (const card of await page.locator('.story li').all()) await expect(card).toHaveCSS('opacity', '1');
  const arrow = await page.locator('#story-change .flow.after li.step').first().evaluate((el) => getComputedStyle(el, '::after').transform);
  expect(arrow).toMatch(/^(none|matrix(1, 0, 0, 1, 0, 0))$/);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('every card is visible', async ({ page }) => {
    await page.goto('/projects/visa-docs/');
    for (const card of await page.locator('.story li').all()) await expect(card).toHaveCSS('opacity', '1');
  });
});

test('pacxpuctanno keeps the article layout for now', async ({ page }) => {
  await page.goto('/projects/pacxpuctanno/');
  await expect(page.locator('.story')).toHaveCount(0);
  await expect(page.locator('.prose h2').first()).toBeVisible();
});

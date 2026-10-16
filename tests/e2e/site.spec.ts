import { expect, test, type APIRequestContext } from './fixtures';

async function sitemapPaths(request: APIRequestContext): Promise<string[]> {
  const xml = await (await request.get('/sitemap-0.xml')).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1] ?? '/').pathname);
}

test('sitemap pairs every Japanese page with an English one', async ({ request }) => {
  const paths = await sitemapPaths(request);
  const ja = paths.filter((p) => !p.startsWith('/en/'));
  expect(ja).toEqual(expect.arrayContaining(['/', '/about/', '/workflow/', '/projects/visa-docs/', '/projects/pacxpuctanno/']));
  for (const p of ja) expect(paths, p).toContain(`/en${p}`);
  expect(paths.filter((p) => p.startsWith('/en/'))).toHaveLength(ja.length);
  expect(paths.some((p) => p.includes('404'))).toBe(false);
});

test('no page scrolls horizontally on a 375px screen', async ({ page, request }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  for (const path of await sitemapPaths(request)) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});

test('internal links, images, canonical/hreflang and OG images resolve', async ({ page, request }) => {
  const status = new Map<string, number>();
  for (const path of await sitemapPaths(request)) {
    await page.goto(path);
    const origin = new URL(page.url()).origin;
    const urls = await page.evaluate(() => [
      ...Array.from(document.querySelectorAll('a[href]'), (a) => (a as HTMLAnchorElement).href),
      ...Array.from(document.querySelectorAll('img[src]'), (i) => (i as HTMLImageElement).src),
      ...Array.from(document.querySelectorAll('link[rel="canonical"], link[rel="alternate"]'), (l) => l.getAttribute('href') ?? ''),
      ...Array.from(document.querySelectorAll('meta[property="og:image"]'), (m) => m.getAttribute('content') ?? ''),
    ]);
    for (const raw of urls) {
      const url = new URL(raw, page.url());
      // canonical / hreflang / og:image point at production; check the same path on this server.
      if (url.origin !== origin && url.origin !== 'https://yaufdd.github.io') continue;
      if (status.has(url.pathname)) continue;
      status.set(url.pathname, (await request.get(url.pathname)).status());
    }
  }
  expect([...status].filter(([, code]) => code !== 200)).toEqual([]);
});

test('hreflang alternates are complete and reciprocal', async ({ page, request }) => {
  for (const path of await sitemapPaths(request)) {
    await page.goto(path);
    const alternates = Object.fromEntries(
      await page.locator('link[rel="alternate"][hreflang]').evaluateAll((links) =>
        links.map((l) => [l.getAttribute('hreflang'), new URL(l.getAttribute('href') ?? '/').pathname]),
      ),
    );
    expect(Object.keys(alternates).sort(), path).toEqual(['en', 'ja', 'x-default']);
    expect(alternates['x-default'], path).toBe(alternates['ja']);
    expect([alternates['ja'], alternates['en']], path).toContain(path);
  }
});

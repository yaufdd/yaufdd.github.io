#!/usr/bin/env node
// Renders a 1200×630 PNG in the site's dim theme: a mono heading plus terminal-style lines.
// Lines starting with "$" render bright, "✓" in the accent colour, everything else muted.
// Usage: node scripts/make-cover.mjs --out <file.png> --heading "~/projects/x" --line '$ cmd' --line '✓ done'
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { parseArgs } from 'node:util';
import { chromium } from '@playwright/test';

const { values } = parseArgs({
  options: {
    out: { type: 'string' },
    heading: { type: 'string' },
    line: { type: 'string', multiple: true, default: [] },
  },
});
if (!values.out || !values.heading) {
  console.error('Usage: node scripts/make-cover.mjs --out <file.png> --heading "~/projects/x" [--line "..."]...');
  process.exit(1);
}

const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const lineClass = (s) => (s.startsWith('$') ? 'cmd' : s.startsWith('✓') ? 'ok' : 'out');
const lines = values.line.map((l) => `<div class="${lineClass(l)}">${escapeHtml(l)}</div>`).join('');

const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Noto+Sans+JP:wght@500&display=block">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; width: 1200px; height: 630px; background: #22272e; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono', 'Noto Sans JP', monospace; }
  .window { width: 1040px; border: 2px solid #444c56; border-radius: 16px; background: #2d333b; overflow: hidden; }
  .bar { display: flex; gap: 10px; padding: 18px 22px; border-bottom: 2px solid #444c56; }
  .bar i { width: 14px; height: 14px; border-radius: 50%; background: #444c56; }
  .body { padding: 40px 48px 48px; }
  h1 { margin: 0 0 32px; font-size: 52px; font-weight: 600; color: #6bc46d; }
  .body div { font-size: 30px; line-height: 1.7; white-space: pre-wrap; }
  .cmd { color: #cdd9e5; } .ok { color: #6bc46d; } .out { color: #909dab; }
</style></head><body><div class="window"><div class="bar"><i></i><i></i><i></i></div>
<div class="body"><h1>${escapeHtml(values.heading)}</h1>${lines}</div></div></body></html>`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await mkdir(dirname(values.out), { recursive: true });
  await page.screenshot({ path: values.out, type: 'png' });
  console.log(`written ${values.out}`);
} finally {
  await browser.close();
}

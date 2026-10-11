#!/usr/bin/env node
// Screenshots a page with Playwright's Chromium.
// Usage: node scripts/shoot.mjs --url <url> --out <file.png> [--width 1440] [--height 900] [--full] [--wait 1500]
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { parseArgs } from 'node:util';
import { chromium } from '@playwright/test';

const { values } = parseArgs({
  options: {
    url: { type: 'string' },
    out: { type: 'string' },
    width: { type: 'string', default: '1440' },
    height: { type: 'string', default: '900' },
    full: { type: 'boolean', default: false },
    wait: { type: 'string', default: '1500' },
  },
});
if (!values.url || !values.out) {
  console.error('Usage: node scripts/shoot.mjs --url <url> --out <file.png> [--width 1440] [--height 900] [--full] [--wait 1500]');
  process.exit(1);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: Number(values.width), height: Number(values.height) } });
  await page.goto(values.url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(Number(values.wait)); // let carousels and fade-ins settle
  await mkdir(dirname(values.out), { recursive: true });
  await page.screenshot({ path: values.out, fullPage: values.full });
  console.log(`written ${values.out}`);
} finally {
  await browser.close();
}

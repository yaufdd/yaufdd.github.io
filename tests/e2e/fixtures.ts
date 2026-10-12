import { test as base } from '@playwright/test';

export { expect } from '@playwright/test';
export type { APIRequestContext, Page } from '@playwright/test';

/**
 * Default page for e2e tests:
 * - the 3D avatar's model request is aborted, so the avatar stays a still image. Headless Chromium renders
 *   WebGL on the CPU, and a spinning 350k-triangle figure in every home page test starves the parallel workers.
 *   Tests about the avatar import `test` from '@playwright/test' directly.
 * - Google Fonts are aborted: a slow font fetch delays the `load` event past the test timeout, and no test
 *   depends on the webfont itself.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route('**/models/*.glb', (route) => route.abort());
    await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
    await use(page);
  },
});

// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://yaufdd.github.io',
  trailingSlash: 'always',
  image: { layout: 'constrained' },
  i18n: {
    defaultLocale: 'ja',
    locales: ['ja', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'ja', locales: { ja: 'ja-JP', en: 'en-US' } },
      filter: (page) => !page.includes('/404'),
    }),
  ],
});

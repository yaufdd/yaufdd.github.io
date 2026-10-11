# yaufdd.github.io

Portfolio of **Eric Bamba (番場エリク)** — full-stack engineer (Go / React).
🌐 https://yaufdd.github.io · English: https://yaufdd.github.io/en/

## Stack

Astro 7 · TypeScript · plain CSS · Vitest · Playwright · GitHub Actions → GitHub Pages

## Develop

```bash
npm ci
npx playwright install chromium   # once
npm run dev                        # http://localhost:4321
npm test                           # unit tests
npm run test:e2e                   # build + browser tests
```

## Add a project

1. Create `src/content/projects/<slug>/` with `ja.md`, `en.md` and an `images/` folder.
2. Frontmatter follows the schema in `src/content.config.ts`.
3. Body sections, in order — ja: `課題 / 解決策 / アーキテクチャ / 技術的な工夫 / 振り返り`, en: `Problem / Solution / Architecture / Technical highlights / Retrospective`.
4. Cover image:
   ```bash
   npm run cover -- --out src/content/projects/<slug>/images/cover.png --heading "~/projects/<slug>" --line '$ some command' --line '✓ result'
   ```
5. `npm test && npm run test:e2e` — the tests pick up the new project automatically.

## Content checks

CI fails if the built site or the source mentions a term from a private list (repository secret `FORBIDDEN_TERMS`, one term per line; locally `forbidden.local.txt`, gitignored).

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

## 3D avatar

`public/models/avatar.glb` is shown live on the home page. It is cut at the neck: the `neck` node holds the head, so the head turns on its own (`src/lib/avatar-motion.ts`). `avatar-blink.webp` and `avatar-blink-normal.webp` are closed-eye copies of the model's base colour and normal maps (same UV atlas), swapped in for a blink. Its camera and studio light live in `src/lib/avatar-stage.ts`; after changing the model, the camera or the light, re-render the still poster with the same setup (an e2e test fails if the poster no longer looks like the live figure):

```bash
npm run stills   # → src/assets/avatar-poster.png
```

## Content checks

A private list of terms must never appear anywhere public (repository secret `FORBIDDEN_TERMS`, one term per line; locally `forbidden.local.txt`, gitignored). Matching ignores case, full-width forms, punctuation, whitespace and inline HTML tags.

```bash
npm run check:forbidden                          # every tracked or new file + the built site (CI runs this too)
npm run check:forbidden -- --history --all       # every file version, commit message and author in history
git config core.hooksPath .githooks              # once per clone: the pre-push hook runs the history check
```

CI only sees a commit after it is public, so the pre-push hook is the real gate.

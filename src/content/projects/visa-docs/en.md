---
title: Visa Document Automation
summary: An internal system that reads passport and ticket scans with OCR and an LLM, then generates the full document set for a Japanese visa application.
tagline: Visa paperwork, generated with OCR and an LLM
period: { start: "2025-09", end: null }
team: 1
roles: [Requirements, Design, Backend, Frontend, Infra & CI/CD, Operations]
stack: [Go, React, PostgreSQL, Python, YandexGPT, Yandex Vision OCR, Docker, GitHub Actions]
status: active
devProcess: Built with Claude Code in a spec → plan → TDD → review loop.
cover: ./images/cover.png
coverAlt: "~/projects/visa-docs — terminal-style cover image"
order: 1
story:
  task:
    text: "Visa paperwork was made by hand from scans: about **60 minutes** per traveller. Now it takes **15 minutes**, and even a 30-person tour gets all its documents at once, as soon as everyone has filled in the form."
    documents:
      title: "Documents for one traveller, for example"
      items:
        - "Visa application form (2 copies, with photo)"
        - "Schedule of stay"
        - "Power of attorney (when submitted by a proxy)"
        - "Sponsor letter (for minors)"
        - "Letter for a multiple-entry visa"
        - "Visa centre application"
        - "Submission checklist"
      note: "Depending on the traveller's situation, one person can need about 10 PDF and Word files — and all of them were made by hand."
      example: { image: "./images/visa-application-form.png", alt: "Visa application form of the Ministry of Foreign Affairs of Japan, page 1", caption: "Example: visa application form (source: Ministry of Foreign Affairs of Japan)", href: "https://www.mofa.go.jp/mofaj/files/000124525.pdf" }
  before:
    steps:
      - { icon: pen-line, title: "Traveller", note: "fills in a Word form by hand" }
      - { icon: user-cog, title: "Staff", note: "retypes everything from the scans" }
    result: { icon: files, title: "~10 documents", note: "PDF and Word, one at a time", from: 1 }
    note: "Everything was typed by hand, so one misspelt name or a wrong date was enough for the documents to be rejected — human error could hold up the whole process."
  after:
    steps:
      - { icon: smartphone, title: "Online form", note: "travellers fill it in themselves" }
      - { icon: layout-dashboard, title: "Admin panel", note: "staff only check" }
    aside: { icon: sparkles, title: "AI (OCR + LLM)", note: "reads the scans, returns JSON", to: 1 }
    result: { icon: folder-check, title: "~10 ready files", note: "for the whole group at once", from: 1 }
    note: "As soon as everyone in the group has filled in the form, the whole set is generated in one go."
  architecture:
    layers:
      - { icon: globe, title: "Browser", note: "admin panel · traveller form" }
      - { icon: shield, title: "Traefik → nginx", note: "TLS · React SPA · /api proxy" }
      - { icon: server, title: "Go backend", note: "one binary · chi" }
    leaves:
      - { icon: database, title: "PostgreSQL", note: "isolated per organisation" }
      - { icon: cloud, title: "Yandex Cloud", note: "GPT · Vision OCR" }
      - { icon: file-code, title: "Python", note: "generates DOCX and PDF" }
    note: "A layered monolith with one-way dependencies, shipped as a single binary."
  highlights:
    - { title: "Tenant ID is a required argument", text: "A forgotten filter does not compile: the compiler does the job of row-level security." }
    - { title: "AI only where it is needed", text: "Rules live in Go code, and the code always has the last word." }
    - { title: "Failures handled on purpose", text: "A failed translation stops generation; a failed declension only warns." }
    - { title: "Model fallback", text: "If YandexGPT refuses to answer, Qwen3-235B steps in." }
    - { title: "Personal data stays at home", text: "All AI runs in a domestic cloud, as Russian law 152-FZ requires." }
  outcome:
    - "Next: move document generation to a job queue."
    - "As it grows, pull a service layer out of the handlers."
---

## Problem

Preparing visa paperwork meant staff reading passport, flight ticket and hotel voucher scans and copying every field by hand.

Each group needs about ten documents — itinerary, power of attorney, the application form (PDF), the visa centre request and submission list, and multi-entry visa papers. A single typo in a romanised name or a date gets the documents sent back and puts the travellers' departure at risk.

## Solution

The manual copying is gone; staff only review and confirm.

1. **Create a group** — staff set up a group and subgroups for each tour
2. **Travellers fill in a form** — a multi-step online form with consent collection and SmartCaptcha bot protection
3. **Scans are read automatically** — Yandex Vision OCR and YandexGPT extract the fields from passports, tickets and hotel vouchers; staff review and correct them on screen
4. **Rules validate and complete the data** — transliteration, Russian name declension (for the power of attorney), nationality, place of birth and length of stay are computed and checked by deterministic Go code
5. **The document set is generated** — all ten or so documents in one ZIP

Hotel data comes from a shared catalogue plus each organisation's own entries.

## Architecture

<figure class="diagram">
<svg viewBox="0 0 360 348" role="img" aria-labelledby="visa-arch-title-en">
  <title id="visa-arch-title-en">System overview: browser → Traefik / nginx → Go backend → PostgreSQL, Yandex Cloud, Python</title>
  <defs>
    <marker id="visa-arch-arrow-en" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path class="d-arrow" d="M0 0 L10 5 L0 10 z"/>
    </marker>
  </defs>
  <rect class="d-box" x="40" y="8" width="280" height="52" rx="8"/>
  <text class="d-text" x="180" y="30" text-anchor="middle">Browser</text>
  <text class="d-mono" x="180" y="48" text-anchor="middle">admin UI · traveller form</text>
  <path class="d-line" d="M180 60 V84" marker-end="url(#visa-arch-arrow-en)"/>
  <rect class="d-box" x="40" y="88" width="280" height="52" rx="8"/>
  <text class="d-text" x="180" y="110" text-anchor="middle">Traefik → nginx</text>
  <text class="d-mono" x="180" y="128" text-anchor="middle">TLS · React SPA · /api proxy</text>
  <path class="d-line" d="M180 140 V164" marker-end="url(#visa-arch-arrow-en)"/>
  <rect class="d-accent" x="10" y="168" width="340" height="76" rx="8"/>
  <text class="d-text" x="180" y="192" text-anchor="middle">Go backend (single binary)</text>
  <text class="d-mono" x="180" y="212" text-anchor="middle">chi → middleware → api</text>
  <text class="d-mono" x="180" y="230" text-anchor="middle">db · ai · docgen · storage</text>
  <path class="d-line" d="M60 244 V276" marker-end="url(#visa-arch-arrow-en)"/>
  <path class="d-line" d="M180 244 V276" marker-end="url(#visa-arch-arrow-en)"/>
  <path class="d-line" d="M300 244 V276" marker-end="url(#visa-arch-arrow-en)"/>
  <rect class="d-box" x="5" y="280" width="110" height="60" rx="8"/>
  <text class="d-text" x="60" y="304" text-anchor="middle">PostgreSQL</text>
  <text class="d-mono" x="60" y="324" text-anchor="middle">org_id scoped</text>
  <rect class="d-box" x="125" y="280" width="110" height="60" rx="8"/>
  <text class="d-text" x="180" y="304" text-anchor="middle">Yandex Cloud</text>
  <text class="d-mono" x="180" y="324" text-anchor="middle">GPT · OCR</text>
  <rect class="d-box" x="245" y="280" width="110" height="60" rx="8"/>
  <text class="d-text" x="300" y="304" text-anchor="middle">Python</text>
  <text class="d-mono" x="300" y="324" text-anchor="middle">DOCX · PDF</text>
</svg>
<figcaption>System overview</figcaption>
</figure>

It is a plain layered monolith in a single binary. Around sixteen packages import strictly in one direction, so a dependency cycle simply does not compile.

There is no web framework: chi sits on top of the standard `net/http` as a router. A request flows Traefik (TLS) → nginx (serves the SPA, proxies `/api`) → Go. All dependencies are wired in one place, `main.go`, without a DI framework.

Document generation runs as a Python subprocess, and the Go–Python boundary is a JSON file on disk, so the intermediate data can be opened and replayed by hand. The database is PostgreSQL 16; a custom runner applies migrations on startup, and a failed migration stops the process instead of serving traffic on a half-migrated schema.

## Technical highlights

### Multi-tenancy enforced by function signatures

Every repository function takes the organisation ID as a required argument, so forgetting the tenant filter is a compile error — the compiler does the job row-level security would otherwise do. Requests for another organisation's data get 404, not 403, so existing IDs cannot be probed.

### AI only where it is needed; Go has the final say

The AI code is split into prompts, deterministic Go logic and an assembler. Rule-based steps never go to a model, and the assembler lets Go rules override model output. On a visa application, one mistake can mean a refusal.

### Deliberately non-uniform error handling

If translation or itinerary generation fails, generation stops: carrying on would silently print Cyrillic into English form fields. A failed name declension, on the other hand, is only a warning with a deterministic fallback.

### Interfaces only at the edges

There are exactly seven interfaces, all at boundaries with external services. The AI audit log lives in the adapter layer, so no call can skip it. Integration tests run the real router against a real PostgreSQL with only the translator faked — CI never makes a paid API call.

### Model fallback and in-country data

YandexGPT refuses some prompts that mention certain place names, so the system falls back to Qwen3-235B in the same cloud. All AI services run in a Russian cloud region, keeping personal data inside the country as Russian data-protection law (152-FZ) requires.

## Retrospective

The first bottleneck at higher volume will be document generation running synchronously inside the HTTP request: the connection stays open while the AI and Python do their work. Moving it to a job queue is the next step.

Business logic also lives in the handlers — easy to read, harder to test without HTTP. As the system grows I would extract a service layer. Relying on the compiler instead of RLS is likewise a conscious trade-off for the current scale.

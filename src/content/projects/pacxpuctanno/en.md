---
title: pacxpuctanno
subtitle: РАСХРИСТАННО
summary: The official site of my own clothing brand — catalog, lookbook, a T-shirt designer and a custom admin panel, built and run solo.
period: { start: "2026-03", end: "2026-04" }
team: 1
roles: [Planning, Design, Backend, Frontend, Infra & CI/CD, Operations]
stack: [React, Go, Gin, PostgreSQL, Redis, templ, sqlc, Docker]
status: active
links: { live: "https://pacxpuctanno.shop" }
devProcess: Spec and implementation plan written with Claude Code before coding (kept in the repository).
cover: ./images/cover.png
coverAlt: "~/projects/pacxpuctanno — terminal-style cover image"
order: 2
---

## Problem

The brand needed a site that carries its visual identity, plus a way for me alone to update products and drops.

## Solution

Besides the catalog, lookbook and drop announcements, there is a designer where visitors build their own T-shirt. Purchases go through Telegram and Avito, so there is deliberately no cart.

## Architecture

A React SPA embedded in a Go (Gin) binary; the same binary serves the REST API and a templ-rendered admin panel.

## Technical highlights

To give every product page correct OG tags despite being an SPA, the Go server injects per-product metadata into index.html.

## Retrospective

One binary made deployment simple, but the trade-off is that even a frontend-only change requires rebuilding the server.

---
title: How I work
---

I use an AI agent (Claude Code) like a development team and keep design, decisions and review for myself. The AI may write the code, but I own the specification and the quality.

## How a project starts

- I start by talking it through with the AI, making clear what I want to build
- I lay out the whole picture I have in my head, down to the architecture and the database structure
- Once the AI has understood it correctly, I get to work and first prepare a `CLAUDE.md`: a living document with the structure, rules and pitfalls, which the agent reads first every time

## Process: spec → plan → build

1. **Specification** — the AI writes the decisions down as a Markdown spec, and I review it
2. **Implementation plan** — the spec is broken into small tasks
3. **Building to the plan** — each task goes to its own subagent, test-driven (TDD)
4. **Review** — a separate agent reviews each task and, at the end, the whole branch

I run this whole loop with the **Superpowers** plugin for Claude Code.

## Agents

I have a subagent for each area:

- **Backend** — Go, APIs
- **Frontend** — React, TypeScript
- **Database** — schema, migrations, queries
- **Code review**

When a task is big, I split it up between the subagents. Each one works only with its own context, which keeps development simpler and faster.

## Tech stack

My current base stack:

- **Backend** — Go + Gin
- **Database access** — sqlc (type-safe Go code generated from SQL)
- **Database** — PostgreSQL
- **Frontend** — React + TypeScript
- **Infrastructure** — everything runs in Docker, with Traefik in front as the reverse proxy

That is the foundation; depending on the project, I bring in whatever other libraries it needs.

<p class="note">* For example, this portfolio is mostly static pages and a 3D model, so I built it with <b>Astro</b>, which is lighter than React.</p>

## Tools: MCP servers and plugins

In Claude Code I have these MCP servers and plugins installed:

- **Serena** — symbol-level code search and navigation
- **Context7** — up-to-date library documentation
- **GitHub** — issues, pull requests and reviews
- **Figma** — moving between design and code
- **Notion** — notes and documentation
- **Claude in Chrome** — checking behaviour in a real browser
- **Plugins** — Superpowers (the development process), frontend-design, code-review

This site was built the same way.

---
title: How I work
---

I use an AI agent (Claude Code) like a development team and keep design, decisions and review for myself. The AI may write the code, but I own the specification and the quality.

### Process

1. **Brainstorming** — put the goal, constraints and success criteria into words, compare options and pick a direction
2. **Specification** — write the decisions down as a Markdown spec and review it before moving on
3. **Implementation plan** — break the spec into small, test-sized tasks
4. **Test-driven implementation** — failing test → minimal code → refactor
5. **Review** — a separate agent reviews each task and, at the end, the whole branch

### Setup

- **A `CLAUDE.md` per project** — a living document with structure, rules and pitfalls; the agent reads it first every time
- **A shared knowledge base for all projects** — stack, deployment and server runbooks in one place, so a new project gets full context immediately
- **MCP servers** — Serena (symbol-level code navigation), Context7 (up-to-date library docs), Playwright (checking behaviour in a real browser)

This site was built the same way. A detailed case study is coming to the Projects section.

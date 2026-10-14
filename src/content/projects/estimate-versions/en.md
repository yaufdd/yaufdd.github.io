---
title: Quote Version Control
summary: An internal system that keeps every version of the Excel quotes staff build, shows any of them instantly, and highlights what changed since the last one.
tagline: History and diffs for Excel quotes
period: { start: "2026-07", end: null }
team: 1
roles: [Requirements, Design, Backend, Frontend, Infra & CI/CD, Operations]
stack: [Go, gin, SQLBoiler, PostgreSQL, React, TypeScript, Gotenberg, LibreOffice, Docker, GitHub Actions]
status: active
devProcess: Built with Claude Code in a "spec → implementation plan → TDD → review" loop.
cover: ./images/cover.png
coverAlt: "~/projects/estimate-versions — terminal-style cover image"
order: 2
story:
  task:
    text: "Staff built quotes in Excel, and every revision added another file. Which one was the latest, and what had changed since the last version, could only be found by opening the files and comparing them by eye."
  before:
    steps:
      - { icon: user-cog, title: "Staff", note: "edit the quote in Excel" }
      - { icon: files, title: "More and more files", note: "“final_2.xlsx”, “final_3.xlsx”…" }
    result: { icon: triangle-alert, title: "Changes found by eye", note: "prices checked cell by cell", from: 1 }
    note: "Between a traveller's first request and the final quote there are several versions. Staff needed a history of what changed, to show the client when needed and to keep track themselves."
  after:
    steps:
      - { icon: upload, title: "Upload the Excel file", note: "the same Excel as always" }
      - { icon: history, title: "Version history", note: "numbered and saved automatically" }
    aside: { icon: file-code, title: "PDF preview", note: "rendered by LibreOffice in the background", to: 1 }
    result: { icon: git-compare, title: "Changes at a glance", note: "changed, cancelled and confirmed in colour", from: 1 }
    note: "The interface borrows from GitHub — quotes are like repositories and versions like commits — without showing any of those words."
  screens:
    at: top
    caption: "Example screens"
    items:
      - { image: "./images/quote-diff.png", alt: "A quote compared with its previous version: changed, cancelled and confirmed cells in colour (test data)" }
      - { image: "./images/recent-changes.png", alt: "Recent changes: the latest version of each quote (test data)" }
  architecture:
    layers:
      - { icon: globe, title: "Browser", note: "React SPA" }
      - { icon: shield, title: "Traefik", note: "TLS" }
      - { icon: server, title: "Go backend", note: "gin · SQLBoiler · serves the SPA" }
    leaves:
      - { icon: database, title: "PostgreSQL", note: "versions and sheet snapshots" }
      - { icon: file-code, title: "Gotenberg", note: "xlsx → PDF" }
      - { icon: cloud, title: "Object Storage", note: "originals and PDFs" }
    note: "One process serves both the API and the SPA; there is no nginx."
  highlights:
    - { title: "Diffs from stored snapshots", text: "Each upload saves its sheets as JSONB, so comparing never re-opens the Excel files." }
    - { title: "Upload now, render later", text: "A version shows up at once; the PDF is made separately, and unfinished renders resume after a restart." }
    - { title: "Keeping .xls numbers intact", text: "LibreOffice breaks some calculated values; a Python step puts back the ones stored in the original file." }
  outcome:
    - "Any version of a quote can be checked at once, without opening a file."
    - "Changes since the last version show in colour, so checking prices is faster."
    - "Excel stays exactly as people use it; the history is simply added behind it."
---

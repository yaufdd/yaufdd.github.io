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
group: travel
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
  screens:
    at: top
    caption: "Example screens of the admin panel"
    items:
      - { image: "./images/admin-home.png", alt: "Admin panel home: flights, tickets, hotels, templates and a new booking" }
      - { image: "./images/admin-groups.png", alt: "Group screen: travellers and hotels (test data)" }
  architecture:
    layers:
      - { icon: globe, title: "Browser", note: "admin panel · traveller form" }
      - { icon: shield, title: "Traefik → nginx", note: "TLS · React SPA · /api proxy" }
      - { icon: server, title: "Go backend", note: "one binary · chi" }
    leaves:
      - { icon: database, title: "PostgreSQL" }
      - { icon: cloud, title: "Yandex Cloud", note: "AI" }
      - { icon: file-code, title: "Python", note: "generates DOCX and PDF" }
    note: "A layered monolith with one-way dependencies, shipped as a single binary."
  highlights:
    - { title: "AI only where it is needed", text: "Rules live in Go code, and the code always has the last word." }
    - { title: "Failures handled on purpose", text: "A failed translation stops generation; a failed declension only warns." }
    - { title: "Personal data stays at home", text: "Personal data may not leave the country, so Claude and ChatGPT were out: I used YandexGPT and made up for the weaker model with prompting." }
  outcome:
    - "Today the system is part of everyday work."
    - "Freed from the paperwork, the staff have more time for the tours themselves."
    - "A visa is not part of the tour, but without it the trip never starts, which is why this matters."
---

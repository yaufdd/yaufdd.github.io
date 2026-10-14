---
title: Inquiry Hub
summary: An internal system that gathers travel inquiries arriving by email, messengers and the website into one list, so everyone can see who owns each one and how far it has got.
tagline: Every inquiry in one place
period: { start: "2026-07", end: null }
team: 1
roles: [Requirements, Design, Backend, Frontend, Infra & CI/CD, Operations]
stack: [Go, chi, PostgreSQL, React, TypeScript, Telegram Bot API, Telegram Mini App, Yandex SpeechKit, YandexGPT, Docker, GitHub Actions]
status: active
devProcess: Built with Claude Code in a "spec → implementation plan → TDD → review" loop.
cover: ./images/cover.png
coverAlt: "~/projects/inquiry-hub — terminal-style cover image"
order: 3
story:
  task:
    text: "Inquiries came in by email, WhatsApp, Telegram and the website form. Keeping track of who was handling which one, and how far each had got, was hard, and so was keeping them in order."
  before:
    steps:
      - { icon: message-circle, title: "From everywhere", note: "email · WhatsApp · Telegram · form" }
      - { icon: user-cog, title: "Staff", note: "handle each app separately" }
    result: { icon: triangle-alert, title: "No overview", note: "who has it, and how far it got", from: 1 }
    note: "With inquiries spread across apps, some slipped through or were handled twice, and checking where things stood took time."
  after:
    steps:
      - { icon: send, title: "Forward to the bot", note: "chats, voice and email as they are" }
      - { icon: list-checks, title: "One list", note: "number · owner · status" }
    aside: { icon: mic, title: "Voice to text", note: "transcribed by SpeechKit, summed up by AI", to: 0 }
    result: { icon: folder-check, title: "Synced with the CRM", note: "to the u-on CRM and the quote tool", from: 1 }
    note: "Whatever channel an inquiry comes from, it is recorded the same way and keeps its history."
  screens:
    at: top
    caption: "Example screens"
    items:
      - { image: "./images/hub-home.png", alt: "Admin home: all requests, new request and categories" }
      - { image: "./images/hub-request.png", alt: "A request: client, manager and status, with its history of changes (mock data)" }
      - { image: "./images/hub-bot.png", alt: "The Telegram bot: creating a request from a forwarded message (mock data)" }
  architecture:
    layers:
      - { icon: globe, title: "Browser · Mini App", note: "React SPA" }
      - { icon: shield, title: "Traefik → nginx", note: "TLS · serves the SPA" }
      - { icon: server, title: "Go (one binary)", note: "bot · API · background jobs" }
    leaves:
      - { icon: database, title: "PostgreSQL", note: "the outbox lives here too" }
      - { icon: cloud, title: "Yandex Cloud", note: "speech · AI · files" }
      - { icon: folder-check, title: "u-on CRM", note: "two-way sync" }
    note: "The Telegram bot, the API and the background jobs all run in one process."
  highlights:
    - { title: "The queue is an outbox table", text: "An inquiry and its delivery task are saved in one transaction, so nothing is lost while the CRM is down." }
    - { title: "No key? Only that feature stops", text: "A feature without its service key is simply switched off instead of crashing the app." }
    - { title: "Bot state lives in the database", text: "A restart mid-conversation never loses a half-collected inquiry." }
  outcome:
    - "Today every inquiry ends up in one list, whatever channel it came from."
    - "Who owns it and how far it has got can be seen at a glance."
    - "Staff just forward the chat, so the way they work barely changed."
---

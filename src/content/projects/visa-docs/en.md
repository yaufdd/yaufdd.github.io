---
title: Visa Document Automation
summary: An internal system that reads passport and ticket scans with OCR and an LLM, then generates the full document set for a Japanese visa application.
period: { start: "2026-04", end: null }
team: 1
roles: [Requirements, Design, Backend, Frontend, Infra & CI/CD, Operations]
stack: [Go, React, PostgreSQL, Python, YandexGPT, Yandex Vision OCR, Docker, GitHub Actions]
status: active
devProcess: Built with Claude Code in a spec → plan → TDD → review loop.
cover: ./images/cover.png
coverAlt: "~/projects/visa-docs — terminal-style cover image"
order: 1
---

## Problem

Preparing visa paperwork meant copying data by hand from passport and ticket scans. Each trip needs six documents — itinerary, power of attorney, application form and more — and every typo can get an application sent back.

## Solution

Staff collect traveller data through an online form and upload the scans. OCR and an LLM read them, and the system generates the complete set of documents for the visa application centre.

## Architecture

A single Go binary (chi + pgx) at the centre, with a React admin UI, PostgreSQL and a Python subprocess for document generation.

## Technical highlights

The organisation ID is a mandatory argument of every repository function, so a missing tenant filter is a compile error.

## Retrospective

Using AI only where it is really needed — and leaving rule-based steps to deterministic Go code — is what made the output reliable.

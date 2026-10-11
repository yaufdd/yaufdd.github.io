---
title: ビザ申請書類 自動生成システム
summary: OCR と LLM でパスポートや航空券のスキャンを読み取り、日本のビザ申請書類一式を自動生成する社内システム。
period: { start: "2026-04", end: null }
team: 1
roles: [要件定義, 設計, バックエンド, フロントエンド, インフラ・CI/CD, 運用]
stack: [Go, React, PostgreSQL, Python, YandexGPT, Yandex Vision OCR, Docker, GitHub Actions]
status: active
devProcess: Claude Code で「仕様 → 実装計画 → TDD → レビュー」のサイクルを回して開発。
cover: ./images/cover.png
coverAlt: "~/projects/visa-docs — ターミナル風のカバー画像"
order: 1
---

## 課題

ビザ申請の書類づくりは、担当者がパスポートや航空券のスキャンを見ながら手で転記する作業でした。書類は旅程表、委任状、申請書など 6 種類あり、転記ミスはそのまま申請の差し戻しにつながります。

## 解決策

担当者はオンラインフォームで旅行者のデータを集め、スキャンをアップロードするだけ。OCR と LLM が内容を読み取り、ビザ申請センターに提出する書類一式を生成します。

## アーキテクチャ

Go の単一バイナリ（chi + pgx）を中心に、React の管理画面、PostgreSQL、書類生成用の Python サブプロセスで構成しています。

## 技術的な工夫

組織 ID をリポジトリ関数の必須引数にし、マルチテナントのフィルタ漏れをコンパイラで防いでいます。

## 振り返り

AI を使うのは本当に必要な箇所だけにし、ルールが決まっている処理は決定的な Go のコードに任せたことで、品質が安定しました。

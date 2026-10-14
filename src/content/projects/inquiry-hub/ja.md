---
title: 問い合わせ一元管理システム
summary: メールやメッセンジャー、サイトのフォームなど、あちこちから届く問い合わせを 1 つの一覧にまとめ、担当者と進み具合をひと目で追える社内システム。
tagline: バラバラの問い合わせを 1 か所に
period: { start: "2026-07", end: null }
team: 1
roles: [要件定義, 設計, バックエンド, フロントエンド, インフラ・CI/CD, 運用]
stack: [Go, chi, PostgreSQL, React, TypeScript, Telegram Bot API, Telegram Mini App, Yandex SpeechKit, YandexGPT, Docker, GitHub Actions]
status: active
devProcess: Claude Code で「仕様 → 実装計画 → TDD → レビュー」のサイクルを回して開発。
cover: ./images/cover.png
coverAlt: "~/projects/inquiry-hub — ターミナル風のカバー画像"
order: 3
story:
  task:
    text: "問い合わせは、メール、WhatsApp、Telegram、サイトのフォームなど、いろいろな経路から届いていました。どれに誰が対応していて、どこまで進んだのかを追うのが難しく、整理するのも大変でした。"
  before:
    steps:
      - { icon: message-circle, title: "あちこちから届く", note: "メール・WhatsApp・Telegram・フォーム" }
      - { icon: user-cog, title: "担当者", note: "アプリごとに別々に対応" }
    result: { icon: triangle-alert, title: "全体が見えない", note: "誰が・どこまで進めたか分からない", from: 1 }
    note: "問い合わせがアプリごとに散らばっていたため、対応の抜け漏れや重複が起きやすく、状況の確認にも時間がかかっていました。"
  after:
    steps:
      - { icon: send, title: "ボットに転送", note: "チャット・音声・メールをそのまま" }
      - { icon: list-checks, title: "1 つの一覧", note: "通し番号・担当者・ステータス" }
    aside: { icon: mic, title: "音声を文字に", note: "SpeechKit で文字起こし、AI で要約", to: 0 }
    result: { icon: folder-check, title: "CRM と同期", note: "u-on CRM と見積もりへ自動で", from: 1 }
    note: "どの経路から届いた問い合わせも、同じ形で記録され、履歴として残ります。"
  screens:
    at: top
    caption: "画面の例"
    items:
      - { image: "./images/hub-home.png", alt: "管理画面のホーム：問い合わせの一覧・新規作成・カテゴリ" }
      - { image: "./images/hub-request.png", alt: "問い合わせの画面：顧客・担当者・ステータスと、変更の履歴（ダミーデータ）" }
      - { image: "./images/hub-bot.png", alt: "Telegram ボット：転送したメッセージから問い合わせを作成（ダミーデータ）" }
  architecture:
    layers:
      - { icon: globe, title: "ブラウザ・Mini App", note: "React SPA" }
      - { icon: shield, title: "Traefik → nginx", note: "TLS・SPA の配信" }
      - { icon: server, title: "Go（1 つのバイナリ）", note: "ボット・API・バックグラウンド処理" }
    leaves:
      - { icon: database, title: "PostgreSQL", note: "outbox も同じ DB に" }
      - { icon: cloud, title: "Yandex Cloud", note: "音声認識・AI・ファイル" }
      - { icon: folder-check, title: "u-on CRM", note: "双方向の同期" }
    note: "Telegram ボット、API、バックグラウンド処理が 1 つのプロセスで動いています。"
  highlights:
    - { title: "キューは outbox テーブル", text: "問い合わせと送信タスクを同じトランザクションで保存。CRM が止まっていても取りこぼしません。" }
    - { title: "設定がなければ、その機能だけ止める", text: "外部サービスのキーがない機能は、エラーで落ちずにその機能だけが無効になります。" }
    - { title: "ボットの状態は DB に", text: "会話の途中で再起動しても、まとめかけの問い合わせは消えません。" }
  outcome:
    - "今は、どの経路から届いた問い合わせも 1 つの一覧に集まります。"
    - "誰が担当し、どこまで進んだのかがひと目で分かるようになりました。"
    - "チャットを転送するだけなので、担当者のいつものやり方はほとんど変わりません。"
---

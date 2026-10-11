---
title: pacxpuctanno
subtitle: РАСХРИСТАННО
summary: 自分のアパレルブランドの公式サイト。カタログ、ルックブック、T シャツデザイナー、自作の管理画面まで一人で開発・運用。
period: { start: "2026-03", end: "2026-04" }
team: 1
roles: [企画, デザイン, バックエンド, フロントエンド, インフラ・CI/CD, 運用]
stack: [React, Go, Gin, PostgreSQL, Redis, templ, sqlc, Docker]
status: active
links: { live: "https://pacxpuctanno.shop" }
devProcess: Claude Code で仕様書と実装計画を書いてから実装（spec / plan をリポジトリで管理）。
cover: ./images/cover.png
coverAlt: "~/projects/pacxpuctanno — ターミナル風のカバー画像"
order: 2
---

## 課題

ブランドの世界観を伝えるサイトと、商品やドロップを自分ひとりで更新できる仕組みが必要でした。

## 解決策

カタログ・ルックブック・ドロップ告知に加え、ユーザーが自分で T シャツを組み立てられるデザイナーを用意しました。購入は Telegram と Avito 経由で、カートは持たない設計です。

## アーキテクチャ

React の SPA を Go（Gin）のバイナリに埋め込んで配信し、同じバイナリが REST API と templ による管理画面も提供します。

## 技術的な工夫

SPA でも商品ページの OG タグが正しく出るよう、Go 側で index.html に商品ごとのメタ情報を注入しています。

## 振り返り

1 つのバイナリにまとめたことでデプロイは単純になりましたが、フロントだけの変更でもサーバーの再ビルドが必要になる点はトレードオフでした。

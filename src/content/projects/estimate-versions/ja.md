---
title: 見積書バージョン管理
summary: 担当者が Excel で作る見積書の版をすべて保存してすぐに表示し、前の版との違いを色分けで示す社内システム。
tagline: Excel 見積書の履歴と差分を一目で
period: { start: "2026-07", end: null }
team: 1
roles: [要件定義, 設計, バックエンド, フロントエンド, インフラ・CI/CD, 運用]
stack: [Go, gin, SQLBoiler, PostgreSQL, React, TypeScript, Gotenberg, LibreOffice, Docker, GitHub Actions]
status: active
devProcess: Claude Code で「仕様 → 実装計画 → TDD → レビュー」のサイクルを回して開発。
cover: ./images/cover.png
coverAlt: "~/projects/estimate-versions — ターミナル風のカバー画像"
order: 2
story:
  task:
    text: "見積書は担当者が Excel で作り、修正のたびに新しいファイルが増えていきました。どれが最新で、前の版から何が変わったのかは、ファイルを開いて目で比べるしかありませんでした。"
  before:
    steps:
      - { icon: user-cog, title: "担当者", note: "Excel で見積書を修正" }
      - { icon: files, title: "ファイルが増える", note: "「最終版_2.xlsx」「最終版_3.xlsx」…" }
    result: { icon: triangle-alert, title: "変更点は目で探す", note: "金額の差を 1 セルずつ確認", from: 1 }
    note: "旅行者の最初の問い合わせから最終的な見積もりまでには、いくつもの版ができます。担当者には、必要なときに顧客へ見せるためにも、自分で確認するためにも、どこがどう変わったのかを追える履歴が必要でした。"
  after:
    steps:
      - { icon: upload, title: "Excel をアップロード", note: "いつもの Excel のまま" }
      - { icon: history, title: "版の履歴", note: "番号を付けて自動で保存" }
    aside: { icon: file-code, title: "PDF プレビュー", note: "裏で LibreOffice が生成", to: 1 }
    result: { icon: git-compare, title: "変更点が一目で", note: "変更・取消・確定を色分け", from: 1 }
    note: "画面は GitHub を参考にしました。見積書がリポジトリ、版がコミットのイメージですが、そうした用語は画面に出していません。"
  screens:
    at: top
    caption: "画面の例"
    items:
      - { image: "./images/quote-diff.png", alt: "見積書の画面：版の比較で変更・取消・確定のセルを色分け（テストデータ）" }
      - { image: "./images/recent-changes.png", alt: "最近の変更：見積書ごとの最新の版（テストデータ）" }
  architecture:
    layers:
      - { icon: globe, title: "ブラウザ", note: "React SPA" }
      - { icon: shield, title: "Traefik", note: "TLS" }
      - { icon: server, title: "Go バックエンド", note: "gin・SQLBoiler・SPA の配信" }
    leaves:
      - { icon: database, title: "PostgreSQL", note: "版とシートのスナップショット" }
      - { icon: file-code, title: "Gotenberg", note: "xlsx → PDF" }
      - { icon: cloud, title: "Object Storage", note: "原本と PDF" }
    note: "API と SPA を 1 つのプロセスで配信し、nginx は置いていません。"
  highlights:
    - { title: "差分は保存済みのスナップショットで", text: "アップロード時にシートを JSONB で保存。比較のたびに Excel を開き直しません。" }
    - { title: "アップロードは即時、PDF は裏で", text: "版はすぐに表示。PDF は別処理で作り、再起動しても未完了の分を自動で再開します。" }
    - { title: ".xls の数値を守る", text: "LibreOffice が壊してしまう計算結果を、Python で元ファイルの値に戻します。" }
  outcome:
    - "見積書のどの版でも、ファイルを開かずにすぐ確認できるようになりました。"
    - "前の版との違いが色で分かるので、金額の確認が早くなりました。"
    - "Excel の使い方は変えず、履歴だけを後ろに足す設計です。"
---

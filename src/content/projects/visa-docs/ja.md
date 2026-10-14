---
title: ビザ申請書類 自動生成システム
summary: OCR と LLM でパスポートや航空券のスキャンを読み取り、日本のビザ申請書類一式を自動生成する社内システム。
tagline: OCR と LLM でビザ申請書類を自動生成
period: { start: "2025-09", end: null }
team: 1
roles: [要件定義, 設計, バックエンド, フロントエンド, インフラ・CI/CD, 運用]
stack: [Go, React, PostgreSQL, Python, YandexGPT, Yandex Vision OCR, Docker, GitHub Actions]
status: active
devProcess: Claude Code で「仕様 → 実装計画 → TDD → レビュー」のサイクルを回して開発。
cover: ./images/cover.png
coverAlt: "~/projects/visa-docs — ターミナル風のカバー画像"
order: 1
group: travel
story:
  task:
    text: "ビザ申請の書類は、担当者がスキャンを見ながら手で作っていて、1 人あたり約 **60 分** かかっていました。システムを入れてからは **15 分** です。30 人のツアーでも、全員の入力がそろった時点でツアー全員分の書類がまとめて生成されるので、人数が増えても待ち時間はほとんど変わりません。"
    documents:
      title: "1 人分の書類の例"
      items:
        - "査証申請書（2 部・写真付き）"
        - "滞在予定表"
        - "委任状（代理申請の場合）"
        - "スポンサーレター（未成年の場合）"
        - "数次ビザの理由書"
        - "ビザ申請センターへの申込書"
        - "提出書類リスト"
      note: "状況によって、1 人あたり約 10 個の PDF・Word ファイルが必要になり、そのすべてを手作業で作っていました。"
      example: { image: "./images/visa-application-form.png", alt: "外務省の査証申請書（1 ページ目）", caption: "例：査証申請書（出典：外務省）", href: "https://www.mofa.go.jp/mofaj/files/000124525.pdf" }
  before:
    steps:
      - { icon: pen-line, title: "旅行者", note: "Word の申請書に手で記入" }
      - { icon: user-cog, title: "担当者", note: "スキャンを見ながら手で転記" }
    result: { icon: files, title: "約 10 個の書類", note: "PDF と Word を 1 つずつ作成", from: 1 }
    note: "書類はすべて手作業で作っていたため、ローマ字のつづりや日付を 1 か所間違えるだけで受け付けてもらえませんでした。人為的なミスが、そのまま手続き全体を止めてしまうこともありました。"
  after:
    steps:
      - { icon: smartphone, title: "オンラインフォーム", note: "旅行者が自分で入力" }
      - { icon: layout-dashboard, title: "管理画面", note: "担当者は確認するだけ" }
    aside: { icon: sparkles, title: "AI（OCR + LLM）", note: "スキャンを読み取り JSON で返す", to: 1 }
    result: { icon: folder-check, title: "約 10 個の完成ファイル", note: "グループ全員分を一括生成", from: 1 }
    note: "グループ全員の入力がそろった時点で、書類一式がまとめて生成されます。"
  screens:
    at: top
    caption: "管理画面の例"
    items:
      - { image: "./images/admin-home.png", alt: "管理画面のホーム：フライト・チケット・ホテル・テンプレートと新規予約" }
      - { image: "./images/admin-groups.png", alt: "グループの画面：旅行者とホテルの一覧（テストデータ）" }
  architecture:
    layers:
      - { icon: globe, title: "ブラウザ", note: "管理画面・旅行者フォーム" }
      - { icon: shield, title: "Traefik → nginx", note: "TLS・React SPA・/api プロキシ" }
      - { icon: server, title: "Go バックエンド", note: "単一バイナリ・chi" }
    leaves:
      - { icon: database, title: "PostgreSQL" }
      - { icon: cloud, title: "Yandex Cloud", note: "AI" }
      - { icon: file-code, title: "Python", note: "DOCX・PDF を生成" }
    note: "依存の向きが一方向のレイヤードモノリス。バイナリは 1 つです。"
  highlights:
    - { title: "AI は必要な所だけ", text: "ルールで決まる処理は Go のコード。最終判断は常にコードが下します。" }
    - { title: "失敗の扱いを使い分け", text: "翻訳の失敗は生成を止め、格変化の失敗は警告にとどめて続行します。" }
    - { title: "個人データは国内に", text: "個人データを国外に出せないため、Claude や ChatGPT は使えず YandexGPT を採用。モデルの弱さは、プロンプトの調整で補いました。" }
  outcome:
    - "システムは今、毎日の業務で使われています。"
    - "書類づくりから解放された担当者は、ツアーそのものに時間を使えるようになりました。"
    - "ビザはツアーの一部ではありませんが、取れなければ旅行は始まりません。だからこそ、この仕組みは大切です。"
---

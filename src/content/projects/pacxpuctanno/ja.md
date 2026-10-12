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
screen: ["$ curl pacxpuctanno.shop/api/v1/catalog/drops/active", "✓ 200 OK", "✓ designer: ready"]
order: 2
---

## 課題

自分のアパレルブランド「РАСХРИСТАННО」には、ブランドの世界観をそのまま伝えられるサイトが必要でした。商品は数量限定のドロップ形式で出すため、商品の追加や入れ替え、トップページの見せ方まで、コードを触らずに管理画面から自分ひとりで素早く更新できることが条件でした。

販売は Telegram と Avito で行うので、カートや決済はあえて持たない設計にしています。

## 解決策

![トップページ：ヒーローカルーセルと新作ドロップの告知](./images/01-home.png)

トップページは、クロスフェードするヒーローカルーセル、マーキー、新作ドロップ、ベストセラー、ブランドの哲学で構成しています。

![カタログ：カテゴリーで絞り込める商品一覧](./images/02-catalog.png)

カタログはカテゴリーで絞り込めます。商品ページからは Avito での購入、または Telegram での問い合わせに進みます。

![商品ページ：画像ギャラリー、価格、在庫、購入ボタン](./images/03-product.png)

![T シャツデザイナー：スケッチをドラッグして配置する画面](./images/04-designer.png)

T シャツデザイナー（`/create`）では、スケッチをドラッグ＆ドロップで配置し、色・テクスチャ・サイズを選んで PNG として書き出せます。作ったデザインは、メールのワンタイムコードでログインするマイページに保存でき、お気に入りも管理できます。

![スマートフォン表示のトップページ](./images/05-mobile.png)

スマートフォンでは専用のレイアウトに切り替わり、デザイナーには下部のタブバーを用意しました。

運営側は templ で作った SSR の管理画面から、商品・ドロップ・サイト設定・ユーザー・アクセス解析・デザイナー用素材・顧客を管理します。ログもその場で確認できます。

## アーキテクチャ

<figure class="diagram">
<svg viewBox="0 0 360 348" role="img" aria-labelledby="pacx-arch-title">
  <title id="pacx-arch-title">システム構成図：ブラウザ → Traefik → Go バイナリ → PostgreSQL・Redis・画像ストレージ</title>
  <defs>
    <marker id="pacx-arch-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path class="d-arrow" d="M0 0 L10 5 L0 10 z"/>
    </marker>
  </defs>
  <rect class="d-box" x="40" y="8" width="280" height="52" rx="8"/>
  <text class="d-text" x="180" y="30" text-anchor="middle">ブラウザ</text>
  <text class="d-mono" x="180" y="48" text-anchor="middle">React SPA · T シャツデザイナー</text>
  <path class="d-line" d="M180 60 V84" marker-end="url(#pacx-arch-arrow)"/>
  <rect class="d-box" x="40" y="88" width="280" height="52" rx="8"/>
  <text class="d-text" x="180" y="110" text-anchor="middle">Traefik</text>
  <text class="d-mono" x="180" y="128" text-anchor="middle">TLS · Let's Encrypt</text>
  <path class="d-line" d="M180 140 V164" marker-end="url(#pacx-arch-arrow)"/>
  <rect class="d-accent" x="10" y="168" width="340" height="76" rx="8"/>
  <text class="d-text" x="180" y="192" text-anchor="middle">Go バイナリ（Gin）</text>
  <text class="d-mono" x="180" y="212" text-anchor="middle">SPA (go:embed) + OG 注入</text>
  <text class="d-mono" x="180" y="230" text-anchor="middle">REST API · templ 管理画面</text>
  <path class="d-line" d="M60 244 V276" marker-end="url(#pacx-arch-arrow)"/>
  <path class="d-line" d="M180 244 V276" marker-end="url(#pacx-arch-arrow)"/>
  <path class="d-line" d="M300 244 V276" marker-end="url(#pacx-arch-arrow)"/>
  <rect class="d-box" x="5" y="280" width="110" height="60" rx="8"/>
  <text class="d-text" x="60" y="304" text-anchor="middle">PostgreSQL</text>
  <text class="d-mono" x="60" y="324" text-anchor="middle">sqlc · goose</text>
  <rect class="d-box" x="125" y="280" width="110" height="60" rx="8"/>
  <text class="d-text" x="180" y="304" text-anchor="middle">Redis</text>
  <text class="d-mono" x="180" y="324" text-anchor="middle">セッション</text>
  <rect class="d-box" x="245" y="280" width="110" height="60" rx="8"/>
  <text class="d-text" x="300" y="304" text-anchor="middle">画像</text>
  <text class="d-mono" x="300" y="324" text-anchor="middle">最適化して保存</text>
</svg>
<figcaption>システム構成</figcaption>
</figure>

フロントエンド（React 18 + Vite）、管理画面（templ + Tailwind CSS）、バックエンド（Go 1.25 + Gin）を 1 つのモノレポで管理しています。Docker のマルチステージビルドでフロントエンドと管理画面の CSS をビルドし、`go:embed` で Go のバイナリに埋め込むため、本番で動くのはバイナリ 1 つだけです。

データは PostgreSQL 16（pgxpool + sqlc）に、セッションは Redis 7 に保存します（管理者は 24 時間、ユーザーは 30 日）。マイグレーションは goose で書いてバイナリに埋め込み、起動時に適用します。アップロードされた画像はサーバー側で最適化し（長辺 1200px の JPEG と、OG 用の 1200×630 を生成）、`main` への push で GitHub Actions がサーバーにデプロイします。

## 技術的な工夫

### SPA でもリンクのプレビューが崩れない

SPA の HTML はどのページでも同じなので、そのままではメッセンジャーでリンクを共有したときのプレビューが空になります。そこで Go 側で `index.html` を返す前に、管理画面で設定した OG のタイトル・説明・画像を埋め込むようにしました（設定は 60 秒キャッシュ）。商品ページでは、React 側で商品ごとの OG タグと Schema.org の JSON-LD も出力しています。

### ORM を使わない型安全な SQL

約 85 本のクエリはすべて SQL で書き、sqlc で Go のコードを生成しています。ORM のように実際に実行されるクエリが見えなくなることがなく、型の不一致はビルド時に検出されます。コード生成は Docker ビルドの一部です。

### T シャツデザイナー

キャンバス上でスケッチを自由にドラッグして配置し、色やテクスチャを切り替えて、完成したデザインを PNG で書き出せます。スマートフォンでは操作パネルを下部のタブバーにまとめ、狭い画面でもキャンバスを大きく使えるようにしました。

### セキュリティとプライバシー

サイト設定や外部サービスの秘密情報は、AES-256-GCM で暗号化してデータベースに保存しています。自前のアクセス解析では IP アドレスを SHA-256 のハッシュとしてのみ記録し、パスワードは bcrypt でハッシュ化しています。

### 運用のしやすさ

すべてのリクエストに X-Request-ID を付け、zap で構造化ログを出力しています。直近 5000 件のログはリングバッファに保持して管理画面から確認できるので、サーバーにログインしなくても問題を追えます。

## 振り返り

1 つのバイナリにまとめたことで、デプロイとサーバー構成はとてもシンプルになりました。その代わり、フロントエンドだけの小さな修正でもサーバーの再ビルドが必要になります。

UI がフロントエンド（React + 素の CSS）と管理画面（templ + Tailwind）の 2 系統に分かれたため、部品を共有できない点も今後の課題です。

開発は、Claude Code で仕様書と実装計画を書いてから進めました。たとえばデザイナーのモバイル用タブバーは、仕様書と実装計画をリポジトリに残したうえで、小さなコミットに分けて実装しています。

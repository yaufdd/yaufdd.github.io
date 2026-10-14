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

## 課題

ビザ申請の書類づくりは、担当者がパスポート・航空券・ホテルのバウチャーのスキャンを見ながら、内容を一つずつ手で転記する作業でした。

1 つのグループにつき、旅程表、委任状、申請書（PDF）、ビザ申請センターへの申込書と提出リスト、数次ビザ用の書類など、約 10 個の書類が必要です。ローマ字表記や日付のわずかなミスでも書類は差し戻され、旅行者の出発スケジュールに直接影響します。

## 解決策

手作業の転記をなくし、担当者は内容を「確認する」だけでよい流れにしました。

1. **グループを作成** — 担当者がツアーごとにグループとサブグループを作る
2. **旅行者がフォームに入力** — 旅行者本人が多段階のオンラインフォームに入力する（個人情報の利用同意、SmartCaptcha によるボット対策付き）
3. **スキャンを読み取り** — パスポート・航空券・ホテルのバウチャーを Yandex Vision OCR と YandexGPT で読み取り、項目ごとに自動入力。担当者は画面上で確認・修正できる
4. **ルールで検証・補完** — 翻字、ロシア語の格変化（委任状用）、国籍、出生地、滞在日数などは決定的な Go のコードで計算・チェックする
5. **書類一式を生成** — 約 10 個の書類をまとめて ZIP でダウンロードする

ホテル情報は、全組織共通のカタログと組織ごとの独自カタログを併用できます。

## アーキテクチャ

<figure class="diagram">
<svg viewBox="0 0 360 348" role="img" aria-labelledby="visa-arch-title">
  <title id="visa-arch-title">システム構成図：ブラウザ → Traefik / nginx → Go バックエンド → PostgreSQL・Yandex Cloud・Python</title>
  <defs>
    <marker id="visa-arch-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path class="d-arrow" d="M0 0 L10 5 L0 10 z"/>
    </marker>
  </defs>
  <rect class="d-box" x="40" y="8" width="280" height="52" rx="8"/>
  <text class="d-text" x="180" y="30" text-anchor="middle">ブラウザ</text>
  <text class="d-mono" x="180" y="48" text-anchor="middle">管理画面 · 旅行者フォーム</text>
  <path class="d-line" d="M180 60 V84" marker-end="url(#visa-arch-arrow)"/>
  <rect class="d-box" x="40" y="88" width="280" height="52" rx="8"/>
  <text class="d-text" x="180" y="110" text-anchor="middle">Traefik → nginx</text>
  <text class="d-mono" x="180" y="128" text-anchor="middle">TLS · React SPA · /api proxy</text>
  <path class="d-line" d="M180 140 V164" marker-end="url(#visa-arch-arrow)"/>
  <rect class="d-accent" x="10" y="168" width="340" height="76" rx="8"/>
  <text class="d-text" x="180" y="192" text-anchor="middle">Go バックエンド（単一バイナリ）</text>
  <text class="d-mono" x="180" y="212" text-anchor="middle">chi → middleware → api</text>
  <text class="d-mono" x="180" y="230" text-anchor="middle">db · ai · docgen · storage</text>
  <path class="d-line" d="M60 244 V276" marker-end="url(#visa-arch-arrow)"/>
  <path class="d-line" d="M180 244 V276" marker-end="url(#visa-arch-arrow)"/>
  <path class="d-line" d="M300 244 V276" marker-end="url(#visa-arch-arrow)"/>
  <rect class="d-box" x="5" y="280" width="110" height="60" rx="8"/>
  <text class="d-text" x="60" y="304" text-anchor="middle">PostgreSQL</text>
  <text class="d-mono" x="60" y="324" text-anchor="middle">org_id で分離</text>
  <rect class="d-box" x="125" y="280" width="110" height="60" rx="8"/>
  <text class="d-text" x="180" y="304" text-anchor="middle">Yandex Cloud</text>
  <text class="d-mono" x="180" y="324" text-anchor="middle">GPT · OCR</text>
  <rect class="d-box" x="245" y="280" width="110" height="60" rx="8"/>
  <text class="d-text" x="300" y="304" text-anchor="middle">Python</text>
  <text class="d-mono" x="300" y="324" text-anchor="middle">DOCX · PDF</text>
</svg>
<figcaption>システム構成</figcaption>
</figure>

構成はシンプルなレイヤードモノリスで、バイナリは 1 つです。約 16 のパッケージはインポートの向きが常に一方向で、循環依存はそもそもコンパイルが通りません。

Web フレームワークは使わず、標準の `net/http` の上にルーターとして chi を載せています。リクエストは Traefik（TLS）→ nginx（SPA の配信と `/api` のプロキシ）→ Go の順に流れます。依存関係はすべて `main.go` の 1 か所で組み立て、DI フレームワークは使っていません。

書類生成は Python のサブプロセスに任せ、Go との境界はディスク上の JSON ファイルにしました。中間データをそのまま開いて再実行できるので、デバッグが簡単です。データベースは PostgreSQL 16 で、マイグレーションは起動時に自前のランナーが適用します。失敗した場合はプロセスを起動させず、中途半端なスキーマのままリクエストを受けることはありません。

## 技術的な工夫

### マルチテナントを関数シグネチャで保証

リポジトリ層のすべての関数で、組織 ID を必須の引数にしています。フィルタの書き忘れはコンパイルエラーになるため、行レベルセキュリティ（RLS）の役割をコンパイラが担います。他の組織のデータへのアクセスには 403 ではなく 404 を返し、存在する ID を推測されないようにしています。

### AI は必要な箇所だけ、最終判断は Go

AI まわりのコードは「プロンプト」「決定的な Go のロジック」「組み立て」の 3 種類に分けています。ルールが決まっている処理に AI は使いません。モデルの出力は組み立ての段階で Go のルールが上書きできるので、最終的な判断は常にコードが下します。ビザの書類では、1 つのミスが申請の却下につながるからです。

### エラー処理をあえて統一しない

翻訳と旅程表の生成が失敗したら、書類生成そのものを止めます。止めずに続けると、英語の欄にキリル文字がそのまま入ってしまうためです。一方、格変化の失敗は警告にとどめ、決定的なフォールバックで処理を続けます。

### 外部との境界にだけインターフェース

インターフェースは外部サービスとの境界にだけ置いています（全部で 7 つ）。AI 呼び出しの監査ログはアダプター層に組み込み、記録漏れが起きない構造です。結合テストは本物のルーターと PostgreSQL に対して実行し、翻訳だけを差し替えるので、CI で有料 API を一度も呼びません。

### モデルのフォールバックとデータの国内保管

YandexGPT が一部の地名を含むプロンプトへの回答を拒否する場合に備え、同じクラウド上の Qwen3-235B にフォールバックします。AI サービスはすべてロシア国内のクラウドで動かし、個人データを国外に出しません（ロシアの個人情報保護法 152-FZ への対応）。

## 振り返り

規模が大きくなったとき最初にボトルネックになるのは、HTTP リクエストの中で同期的に行っている書類生成です。AI と Python の処理が終わるまで接続を保持し続けるため、次の一手はジョブキューへの移行だと考えています。

また、業務ロジックがハンドラーに集まっているため、読むのは簡単でも HTTP から切り離したテストは書きにくい状態です。規模に応じてサービス層を切り出す予定です。RLS ではなくコンパイラに頼るという判断も、現在の規模に合わせた意識的なトレードオフです。

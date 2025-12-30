# if(塾) 見学申し込みサイト

塾見学希望者向けの申し込みサイトです。サイバーパンク/メタバース風のデザインで、予約管理機能を備えています。

## 機能一覧

- 新規見学申し込み
- 予約変更（予約IDとメールアドレスで認証）
- 予約キャンセル
- Googleスプレッドシートへのデータ蓄積
- Discord通知（新規・変更・キャンセル）
- 週間予約サマリー通知

## セットアップ

### 方法1: Google Apps Script を使用（推奨）

スプレッドシートにデータを蓄積し、Discord通知も行えます。

#### Step 1: Google スプレッドシートの作成

1. [Google スプレッドシート](https://sheets.google.com/)で新しいスプレッドシートを作成
2. 「拡張機能」→「Apps Script」を選択

#### Step 2: GASコードの設置

1. `gas/Code.gs` の内容をすべてコピー
2. Apps Script エディタに貼り付け
3. `CONFIG.DISCORD_WEBHOOK_URL` を自分のWebhook URLに変更:
   ```javascript
   const CONFIG = {
     DISCORD_WEBHOOK_URL: 'https://discord.com/api/webhooks/...',
     // ...
   };
   ```

#### Step 3: デプロイ

1. 「デプロイ」→「新しいデプロイ」をクリック
2. 種類で「ウェブアプリ」を選択
3. 設定:
   - 説明: if(塾) 見学申し込み
   - 次のユーザーとして実行: 自分
   - アクセスできるユーザー: **全員**
4. 「デプロイ」をクリック
5. 表示されたウェブアプリURLをコピー

#### Step 4: フロントエンド設定

`js/config.js` を編集:

```javascript
const CONFIG = {
  GAS_WEB_APP_URL: 'https://script.google.com/macros/s/xxxxx/exec',
  DISCORD_INVITE_URL: 'https://discord.gg/your-invite',
  // ...
  MODE: {
    useGAS: true,  // GASを使用
  }
};
```

### 方法2: Discord Webhook のみ使用

スプレッドシートへの蓄積なしで、Discordに直接通知します。

`js/config.js` を編集:

```javascript
const CONFIG = {
  DISCORD_WEBHOOK_URL: 'YOUR_DISCORD_WEBHOOK_URL',
  DISCORD_INVITE_URL: 'YOUR_DISCORD_INVITE_LINK',
  // ...
  MODE: {
    useGAS: false,  // Webhookを直接使用
  }
};
```

## ファイル構成

```
visitor-site/
├── index.html          # メインHTML
├── css/
│   └── style.css       # サイバーパンクスタイル
├── js/
│   ├── config.js       # 設定ファイル
│   ├── form.js         # フォーム処理・API通信
│   └── main.js         # 初期化・イベント処理
├── gas/
│   └── Code.gs         # Google Apps Script
├── assets/
│   └── favicon.svg     # ファビコン
├── agents/             # エージェント定義
├── docs/               # ドキュメント
├── CLAUDE.md           # プロジェクト設定
└── README.md           # このファイル
```

## 見学情報

- **開催日:** 毎週月曜日
- **時間:** 16:45 - 18:15
- **内容:**
  - 16:45 顔合わせ・事前説明
  - 17:00 授業見学
  - 18:00 質疑応答
  - 18:15 終了

## 予約IDについて

予約完了時に発行される予約IDは以下の形式です:
```
IF-YYYYMMDDHHMMSS-XXXX
例: IF-20241230143025-1234
```

このIDは予約変更・キャンセル時に必要です。

## スプレッドシートの列構成

GASを使用した場合、スプレッドシートには以下の列が作成されます:

| 列 | 内容 |
|---|---|
| A | 予約ID |
| B | 申込日時 |
| C | お名前 |
| D | メールアドレス |
| E | 学年 |
| F | 見学希望日 |
| G | メッセージ |
| H | ステータス |
| I | 変更履歴 |
| J | 備考 |

## Discord通知

各イベントでDiscordに通知されます:

- **新規申し込み**: シアン色のEmbed
- **予約変更**: 黄色のEmbed
- **キャンセル**: 赤色のEmbed

## デザインテーマ

サイバーパンク/メタバース風のデザインを採用:
- カラー: シアン (#00ffcc), マゼンタ (#ff00ff), ライム (#00ff00)
- 背景: ダークテーマ (#0a0a0a)
- 効果: グロー、スキャンライン、パーティクル
- アニメーション: パルス、フリッカー、フロート、グリッチ

## ホスティング

静的サイトとしてホスティングできます：
- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting

## セキュリティ考慮事項

### Webhook URLの保護

広く公開する場合は以下の対策を検討してください：
1. **GAS経由（推奨）**: Webhook URLがバックエンドに隠蔽されます
2. **Cloudflare Workers** を経由してWebhookを呼び出す
3. **Netlify/Vercel Serverless Functions** を使用

### スパム対策

- reCAPTCHA v3 の導入を検討
- GASでレート制限を実装

## ライセンス

© 2024 if(塾)

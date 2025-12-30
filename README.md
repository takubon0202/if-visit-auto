# if(塾) 見学申し込みサイト

塾見学希望者向けの申し込みサイトです。

## セットアップ

### 1. Discord Webhook の設定

`js/config.js` を開き、以下の値を設定してください：

```javascript
// Discord Webhook URL
DISCORD_WEBHOOK_URL: 'YOUR_DISCORD_WEBHOOK_URL',

// Discord招待リンク
DISCORD_INVITE_URL: 'YOUR_DISCORD_INVITE_LINK',
```

**Webhook URL の取得方法:**
1. Discord サーバーの設定を開く
2. 「連携サービス」→「ウェブフック」を選択
3. 「新しいウェブフック」をクリック
4. URLをコピー

**招待リンクの取得方法:**
1. Discord サーバーの設定を開く
2. 「招待」を選択
3. 招待リンクを作成してコピー

### 2. 公開

静的サイトとしてホスティングできます：
- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting

## ファイル構成

```
visitor-site/
├── index.html          # メインHTML
├── css/
│   └── style.css       # スタイルシート
├── js/
│   ├── config.js       # 設定ファイル
│   ├── form.js         # フォーム処理
│   └── main.js         # 初期化スクリプト
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

## 本番運用前の確認事項

### Webhook URLの保護

現在の実装では Discord Webhook URL がフロントエンドに露出しています。
小規模・限定公開であれば問題ありませんが、
広く公開する場合は以下の対策を検討してください：

1. **Cloudflare Workers** を経由してWebhookを呼び出す
2. **Netlify Functions** や **Vercel Serverless Functions** を使用
3. 自前のバックエンドサーバーを用意

### スパム対策

- reCAPTCHA v3 の導入を検討
- 送信レート制限の実装

## ライセンス

© 2024 if(塾)

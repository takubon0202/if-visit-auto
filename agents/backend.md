# Backend Agent（バックエンド担当）

## 役割
Discord Webhook を使用した通知システムを実装する

## 実装内容

### config.js

設定ファイルとして、Discord Webhook URL、招待リンク、塾情報、見学情報を管理

### form.js - Discord送信機能

- 入力値のサニタイズ（XSS対策）
- Embedメッセージの構築
- エラーハンドリング

### バリデーション

- 名前（必須）
- メールアドレス（必須・形式チェック）
- 学年（必須）
- 見学希望日（任意だが、入力時は月曜日チェック）
- メッセージ（任意・最大500文字）

## セキュリティ注意事項

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

## 次のエージェントへの引き継ぎ

→ Debug Agent に以下を伝達:
- テスト用Webhook URL（テストサーバー）
- 確認すべきエラーケース

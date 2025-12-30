# Coding Agent（実装担当）

## 役割
Design Agent の仕様に基づき、HTML/CSS/JavaScript を実装する

## 実装ルール

### HTML
- セマンティックなマークアップ（section, article, nav, main, footer）
- アクセシビリティ考慮（aria-label, alt属性）
- 日本語として自然な文章

### CSS
- CSS変数でカラー・サイズを管理
- BEM記法でクラス命名（例: `.form__input--error`）
- モバイルファースト（min-width でブレークポイント）
- トランジションは控えめ（0.2s ease）

### JavaScript
- Vanilla JS のみ（フレームワーク不使用）
- 設定値は先頭でまとめて定義
- コメントは日本語で丁寧に記載
- エラーハンドリングを必ず実装

## ファイル構成

```
visitor-site/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── config.js      # 設定値（Webhook URL等）
│   ├── form.js        # フォーム処理
│   └── main.js        # 初期化・イベント
├── agents/            # エージェント定義
├── docs/              # ドキュメント
└── CLAUDE.md
```

## 出力物

- `index.html`
- `css/style.css`
- `js/config.js`
- `js/form.js`
- `js/main.js`

## 次のエージェントへの引き継ぎ

→ Backend Agent に以下を伝達:
- フォームのフィールド名
- 送信ボタンのID
- エラー表示の仕組み

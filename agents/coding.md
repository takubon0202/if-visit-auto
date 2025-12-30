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
│   ├── form.js        # フォーム処理・バリデーション
│   ├── calendar.js    # 月曜日専用カレンダー
│   └── main.js        # 初期化・イベント・予約管理
├── gas/
│   └── Code.gs        # Google Apps Script
├── agents/            # エージェント定義
├── docs/              # ドキュメント
└── CLAUDE.md
```

## 主要実装

### 予約タブ表示制御
- **ReservationManager**: ローカルストレージで予約情報を管理
- **tab-btn--reserved**: 予約済みユーザーのみ表示されるタブボタン
- **tab-panel--reserved**: 予約済みユーザーのみ表示されるパネル
- **updateReservationTabsVisibility()**: 表示/非表示を更新

### 月曜日専用カレンダー
- **MondayCalendar**: カスタムカレンダークラス
- 月曜日のみ選択可能
- 過去の日付は選択不可
- 時間帯 16:45-18:15 を表示

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

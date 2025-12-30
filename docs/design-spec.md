# デザイン仕様書

## 1. カラーパレット

```css
:root {
  /* メインカラー */
  --color-primary: #4A7C59;      /* 落ち着いた緑（黒板をイメージ） */
  --color-primary-light: #6B9B7A;
  --color-primary-dark: #3A6249;

  /* アクセント */
  --color-accent: #E8A87C;       /* 温かみのあるオレンジ */
  --color-accent-light: #F5D5C0;

  /* 背景 */
  --color-bg: #FAF8F5;           /* クリーム色の紙 */
  --color-bg-card: #FFFFFF;
  --color-bg-subtle: #F5F2ED;

  /* テキスト */
  --color-text: #3D3D3D;
  --color-text-light: #6B6B6B;
  --color-text-inverse: #FFFFFF;

  /* 状態 */
  --color-success: #5A8F5A;
  --color-error: #C45C5C;
  --color-border: #E0DCD5;

  /* Discord */
  --color-discord: #5865F2;
}
```

## 2. タイポグラフィ

| 要素 | フォント | サイズ | ウェイト |
|-----|---------|--------|---------|
| 見出し1 | Noto Sans JP | 32px (mobile: 24px) | 700 |
| 見出し2 | Noto Sans JP | 24px (mobile: 20px) | 600 |
| 見出し3 | Noto Sans JP | 18px | 600 |
| 本文 | Noto Sans JP | 16px | 400 |
| 補足 | Noto Sans JP | 14px | 400 |

## 3. スペーシング

```css
:root {
  --space-xs: 0.5rem;   /* 8px */
  --space-sm: 1rem;     /* 16px */
  --space-md: 1.5rem;   /* 24px */
  --space-lg: 2rem;     /* 32px */
  --space-xl: 3rem;     /* 48px */
  --space-2xl: 4rem;    /* 64px */
}
```

## 4. レイアウト構成

```
┌─────────────────────────────────────────────┐
│  ヘッダー                                    │
│  背景: var(--color-bg) / 高さ: 控えめ         │
│  ロゴ: if(塾) テキストロゴ                    │
├─────────────────────────────────────────────┤
│                                             │
│  ヒーローセクション                           │
│  キャッチ: 「学校だけが学びの場所じゃない」     │
│  サブ: 「自分のペースで、自分らしく」          │
│  背景: 淡い緑のグラデーション（控えめ）        │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  特徴セクション（3カラム → モバイル1カラム）    │
│  ・自分のペースで学べる                       │
│  ・オンラインで全国対応                       │
│  ・AI先生が24時間サポート                    │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  見学情報セクション                           │
│  ・開催日: 毎週月曜日                         │
│  ・時間: 16:45 - 18:15                       │
│  ・タイムライン表示                           │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  Discordコミュニティ案内                      │
│  「まずは気軽にのぞいてみませんか？」          │
│  [Discordに参加] ボタン                       │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  見学申し込みフォーム                         │
│  カード形式 / 影: 控えめ / 角丸: 12px          │
│  フィールド: 名前, メール, 学年, 希望日, 備考  │
│                                             │
├─────────────────────────────────────────────┤
│  フッター                                    │
│  © 2024 if(塾) / リンク: 公式サイト            │
└─────────────────────────────────────────────┘
```

## 5. コンポーネント仕様

### ボタン

**プライマリボタン**
```css
.btn-primary {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  padding: 0.875rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  transition: background 0.2s ease;
}
.btn-primary:hover {
  background: var(--color-primary-dark);
}
```

**Discordボタン**
```css
.btn-discord {
  background: var(--color-discord);
  color: white;
}
```

### フォーム入力

```css
.form__input {
  padding: 0.875rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s ease;
}
.form__input:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(74, 124, 89, 0.1);
}
.form__input--error {
  border-color: var(--color-error);
}
```

### カード

```css
.card {
  background: var(--color-bg-card);
  border-radius: 12px;
  padding: var(--space-lg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
```

### タイムライン

```css
.timeline {
  position: relative;
  padding-left: 2rem;
}
.timeline::before {
  content: '';
  position: absolute;
  left: 0.5rem;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--color-primary-light);
}
.timeline__item::before {
  content: '';
  position: absolute;
  left: -1.5rem;
  top: 0.5rem;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-primary);
}
```

## 6. ブレークポイント

| 名前 | 幅 |
|-----|-----|
| mobile | < 640px |
| tablet | 640px - 1023px |
| desktop | >= 1024px |

## 7. 禁止事項

- 絵文字をデザイン要素として使用しない
- 紫・ピンク・ネオン系の配色を使用しない
- 派手なグラデーションを避ける
- ストックフォト風のイラストを使用しない
- 過度なアニメーションを避ける

## 8. 推奨事項

- 余白を十分にとり、圧迫感を排除
- 手書き風のアクセントを適度に取り入れる
- 温かみのある柔らかい印象を維持
- テキストの可読性を最優先

// =============================================
// 設定ファイル - デプロイ前に編集してください
// =============================================

const CONFIG = {
  // Google Apps Script Web App URL
  // 取得方法: GASエディタ → デプロイ → 新しいデプロイ → ウェブアプリURL
  GAS_WEB_APP_URL: 'YOUR_GAS_WEB_APP_URL',

  // Discord Webhook URL（フォールバック用・GASが設定されていない場合に使用）
  // 取得方法: サーバー設定 → 連携サービス → ウェブフック → 新しいウェブフック
  DISCORD_WEBHOOK_URL: 'YOUR_DISCORD_WEBHOOK_URL',

  // Discord招待リンク
  // 取得方法: サーバー設定 → 招待 → 招待リンクを作成
  DISCORD_INVITE_URL: 'YOUR_DISCORD_INVITE_LINK',

  // 塾情報
  JUKU: {
    name: 'if(塾)',
    tagline: '学校だけが学びの場所じゃない',
    website: 'https://if-juku.net/',
  },

  // 見学情報
  VISIT: {
    day: '毎週月曜日',
    timeStart: '16:45',
    timeEnd: '18:15',
    classStart: '17:00',
    classEnd: '18:00',
  },

  // フォーム設定
  FORM: {
    maxMessageLength: 500,
    submitButtonId: 'submit-btn',
    formId: 'visit-form',
    modifyFormId: 'modify-form',
    cancelFormId: 'cancel-form',
  },

  // モード設定
  MODE: {
    // true: GAS経由でスプレッドシートに保存
    // false: Discord Webhookに直接送信（従来方式）
    useGAS: true,
  }
};

// グローバルに公開（モジュール非対応環境用）
window.CONFIG = CONFIG;

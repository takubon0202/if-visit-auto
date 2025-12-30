/**
 * if(塾) 見学申し込み管理システム - Google Apps Script
 *
 * このスクリプトをGoogle Apps Scriptエディタに貼り付けて使用してください。
 *
 * セットアップ手順:
 * 1. Google スプレッドシートを作成
 * 2. 拡張機能 → Apps Script を開く
 * 3. このコードを貼り付け
 * 4. デプロイ → 新しいデプロイ → ウェブアプリ
 * 5. アクセスできるユーザー: 全員
 * 6. デプロイして、ウェブアプリURLをコピー
 */

// =============================================
// 設定
// =============================================

const CONFIG = {
  // Discord Webhook URL（設定してください）
  DISCORD_WEBHOOK_URL: 'YOUR_DISCORD_WEBHOOK_URL',

  // シート名
  SHEET_NAME: '見学申し込み',

  // ステータス
  STATUS: {
    PENDING: '予約確定',
    MODIFIED: '変更済み',
    CANCELLED: 'キャンセル'
  }
};

// =============================================
// メイン処理
// =============================================

/**
 * POSTリクエストを処理
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    let result;

    switch (data.action) {
      case 'submit':
        result = handleSubmit(data);
        break;
      case 'modify':
        result = handleModify(data);
        break;
      case 'cancel':
        result = handleCancel(data);
        break;
      case 'lookup':
        result = handleLookup(data);
        break;
      default:
        result = { success: false, message: '不明なアクションです' };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * GETリクエストを処理（CORS対応）
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'OK', message: 'if(塾) 見学申し込みAPI' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// =============================================
// 申し込み処理
// =============================================

/**
 * 新規申し込みを処理
 */
function handleSubmit(data) {
  const sheet = getOrCreateSheet();

  // 予約IDを生成（年月日時分秒 + ランダム4桁）
  const reservationId = generateReservationId();

  // 現在日時
  const timestamp = new Date();

  // データを行に追加
  sheet.appendRow([
    reservationId,
    timestamp,
    data.name,
    data.email,
    data.grade,
    data.preferredDate || '未定',
    data.message || '',
    CONFIG.STATUS.PENDING,
    '', // 変更履歴
    '' // 備考
  ]);

  // Discord通知
  sendDiscordNotification({
    type: 'new',
    reservationId: reservationId,
    name: data.name,
    email: data.email,
    grade: data.grade,
    preferredDate: data.preferredDate,
    message: data.message
  });

  return {
    success: true,
    message: 'お申し込みを受け付けました',
    reservationId: reservationId
  };
}

/**
 * 予約変更を処理
 */
function handleModify(data) {
  const sheet = getOrCreateSheet();
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();

  // 予約IDとメールアドレスで検索
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === data.reservationId && values[i][3] === data.email) {
      // 変更前の情報を保存
      const oldDate = values[i][5];
      const history = values[i][8] ? values[i][8] + '\n' : '';
      const newHistory = history + `[${new Date().toLocaleString('ja-JP')}] 日程変更: ${oldDate} → ${data.newDate}`;

      // 更新
      sheet.getRange(i + 1, 6).setValue(data.newDate); // 希望日
      sheet.getRange(i + 1, 8).setValue(CONFIG.STATUS.MODIFIED); // ステータス
      sheet.getRange(i + 1, 9).setValue(newHistory); // 変更履歴

      // Discord通知
      sendDiscordNotification({
        type: 'modify',
        reservationId: data.reservationId,
        name: values[i][2],
        oldDate: oldDate,
        newDate: data.newDate
      });

      return {
        success: true,
        message: '予約を変更しました',
        newDate: data.newDate
      };
    }
  }

  return {
    success: false,
    message: '予約が見つかりませんでした。予約IDとメールアドレスを確認してください。'
  };
}

/**
 * キャンセルを処理
 */
function handleCancel(data) {
  const sheet = getOrCreateSheet();
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();

  // 予約IDとメールアドレスで検索
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === data.reservationId && values[i][3] === data.email) {
      // 既にキャンセル済みかチェック
      if (values[i][7] === CONFIG.STATUS.CANCELLED) {
        return {
          success: false,
          message: 'この予約は既にキャンセルされています'
        };
      }

      const history = values[i][8] ? values[i][8] + '\n' : '';
      const newHistory = history + `[${new Date().toLocaleString('ja-JP')}] キャンセル`;

      // 更新
      sheet.getRange(i + 1, 8).setValue(CONFIG.STATUS.CANCELLED); // ステータス
      sheet.getRange(i + 1, 9).setValue(newHistory); // 変更履歴

      // Discord通知
      sendDiscordNotification({
        type: 'cancel',
        reservationId: data.reservationId,
        name: values[i][2],
        preferredDate: values[i][5]
      });

      return {
        success: true,
        message: '予約をキャンセルしました'
      };
    }
  }

  return {
    success: false,
    message: '予約が見つかりませんでした。予約IDとメールアドレスを確認してください。'
  };
}

/**
 * 予約照会を処理
 */
function handleLookup(data) {
  const sheet = getOrCreateSheet();
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();

  // 予約IDとメールアドレスで検索
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === data.reservationId && values[i][3] === data.email) {
      return {
        success: true,
        reservation: {
          reservationId: values[i][0],
          timestamp: values[i][1],
          name: values[i][2],
          email: values[i][3],
          grade: values[i][4],
          preferredDate: values[i][5],
          message: values[i][6],
          status: values[i][7]
        }
      };
    }
  }

  return {
    success: false,
    message: '予約が見つかりませんでした'
  };
}

// =============================================
// Discord通知
// =============================================

/**
 * Discord Webhookに通知を送信
 */
function sendDiscordNotification(data) {
  if (!CONFIG.DISCORD_WEBHOOK_URL || CONFIG.DISCORD_WEBHOOK_URL === 'YOUR_DISCORD_WEBHOOK_URL') {
    console.log('Discord Webhook URLが設定されていません');
    return;
  }

  let embed;

  switch (data.type) {
    case 'new':
      embed = createNewReservationEmbed(data);
      break;
    case 'modify':
      embed = createModifyEmbed(data);
      break;
    case 'cancel':
      embed = createCancelEmbed(data);
      break;
    default:
      return;
  }

  const payload = {
    username: 'if(塾) 見学管理Bot',
    embeds: [embed]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    UrlFetchApp.fetch(CONFIG.DISCORD_WEBHOOK_URL, options);
  } catch (error) {
    console.error('Discord通知エラー:', error);
  }
}

/**
 * 新規予約のEmbed作成
 */
function createNewReservationEmbed(data) {
  const dateStr = data.preferredDate
    ? formatDateJapanese(data.preferredDate)
    : '未定・相談希望';

  return {
    title: '📋 新しい見学申し込み',
    color: 0x00ffcc, // シアン
    fields: [
      { name: '🎫 予約ID', value: `\`${data.reservationId}\``, inline: true },
      { name: '👤 お名前', value: data.name, inline: true },
      { name: '📧 メール', value: data.email, inline: true },
      { name: '🎓 学年', value: data.grade, inline: true },
      { name: '📅 見学希望日', value: dateStr, inline: true },
      { name: '💬 メッセージ', value: data.message || 'なし', inline: false }
    ],
    footer: { text: `送信日時: ${new Date().toLocaleString('ja-JP')}` },
    thumbnail: { url: 'https://em-content.zobj.net/thumbs/120/google/350/calendar_1f4c5.png' }
  };
}

/**
 * 予約変更のEmbed作成
 */
function createModifyEmbed(data) {
  return {
    title: '🔄 予約変更',
    color: 0xffff00, // 黄色
    fields: [
      { name: '🎫 予約ID', value: `\`${data.reservationId}\``, inline: true },
      { name: '👤 お名前', value: data.name, inline: true },
      { name: '📅 変更前', value: formatDateJapanese(data.oldDate), inline: true },
      { name: '📅 変更後', value: formatDateJapanese(data.newDate), inline: true }
    ],
    footer: { text: `変更日時: ${new Date().toLocaleString('ja-JP')}` }
  };
}

/**
 * キャンセルのEmbed作成
 */
function createCancelEmbed(data) {
  return {
    title: '❌ 予約キャンセル',
    color: 0xff0000, // 赤
    fields: [
      { name: '🎫 予約ID', value: `\`${data.reservationId}\``, inline: true },
      { name: '👤 お名前', value: data.name, inline: true },
      { name: '📅 キャンセルされた日程', value: formatDateJapanese(data.preferredDate), inline: true }
    ],
    footer: { text: `キャンセル日時: ${new Date().toLocaleString('ja-JP')}` }
  };
}

// =============================================
// ユーティリティ関数
// =============================================

/**
 * シートを取得または作成
 */
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    // ヘッダー行を設定
    sheet.appendRow([
      '予約ID',
      '申込日時',
      'お名前',
      'メールアドレス',
      '学年',
      '見学希望日',
      'メッセージ',
      'ステータス',
      '変更履歴',
      '備考'
    ]);
    // ヘッダー行を固定
    sheet.setFrozenRows(1);
    // 列幅を調整
    sheet.setColumnWidth(1, 150); // 予約ID
    sheet.setColumnWidth(2, 150); // 申込日時
    sheet.setColumnWidth(3, 100); // お名前
    sheet.setColumnWidth(4, 200); // メール
    sheet.setColumnWidth(5, 100); // 学年
    sheet.setColumnWidth(6, 120); // 希望日
    sheet.setColumnWidth(7, 200); // メッセージ
    sheet.setColumnWidth(8, 100); // ステータス
    sheet.setColumnWidth(9, 250); // 変更履歴
  }

  return sheet;
}

/**
 * 予約IDを生成
 */
function generateReservationId() {
  const now = new Date();
  const dateStr = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyyMMddHHmmss');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `IF-${dateStr}-${random}`;
}

/**
 * 日付を日本語形式にフォーマット
 */
function formatDateJapanese(dateStr) {
  if (!dateStr || dateStr === '未定') return '未定・相談希望';

  try {
    const date = new Date(dateStr);
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    return date.toLocaleDateString('ja-JP', options);
  } catch (e) {
    return dateStr;
  }
}

/**
 * 今週の予約一覧を取得（毎週月曜日に自動実行用）
 */
function getWeeklyReservations() {
  const sheet = getOrCreateSheet();
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();

  const today = new Date();
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
  nextMonday.setHours(0, 0, 0, 0);

  const reservations = [];

  for (let i = 1; i < values.length; i++) {
    if (values[i][7] !== CONFIG.STATUS.CANCELLED) {
      const preferredDate = new Date(values[i][5]);
      if (preferredDate.toDateString() === nextMonday.toDateString()) {
        reservations.push({
          name: values[i][2],
          grade: values[i][4],
          reservationId: values[i][0]
        });
      }
    }
  }

  if (reservations.length > 0) {
    sendWeeklySummary(nextMonday, reservations);
  }
}

/**
 * 週間サマリーをDiscordに送信
 */
function sendWeeklySummary(date, reservations) {
  if (!CONFIG.DISCORD_WEBHOOK_URL || CONFIG.DISCORD_WEBHOOK_URL === 'YOUR_DISCORD_WEBHOOK_URL') {
    return;
  }

  const dateStr = formatDateJapanese(date.toISOString().split('T')[0]);
  const participantList = reservations.map((r, i) =>
    `${i + 1}. ${r.name}（${r.grade}）`
  ).join('\n');

  const embed = {
    title: '📢 今週の見学予定',
    color: 0x00ffcc,
    fields: [
      { name: '📅 日程', value: dateStr, inline: false },
      { name: '👥 参加予定者', value: participantList || 'なし', inline: false },
      { name: '📊 参加人数', value: `${reservations.length}名`, inline: true }
    ],
    footer: { text: '見学時間: 16:45 - 18:15' }
  };

  const payload = {
    username: 'if(塾) 見学管理Bot',
    embeds: [embed]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  };

  UrlFetchApp.fetch(CONFIG.DISCORD_WEBHOOK_URL, options);
}

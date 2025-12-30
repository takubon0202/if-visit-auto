// =============================================
// フォーム処理（GAS連携・予約変更・キャンセル対応）
// =============================================

/**
 * 入力値のサニタイズ（XSS対策）
 */
function sanitize(str) {
  if (!str) return '';
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .substring(0, 1000);
}

/**
 * 日付文字列をローカルタイムゾーンでパース
 */
function parseLocalDate(dateString) {
  const dateParts = dateString.split('-');
  return new Date(
    parseInt(dateParts[0], 10),
    parseInt(dateParts[1], 10) - 1,
    parseInt(dateParts[2], 10)
  );
}

// =============================================
// バリデーション
// =============================================

/**
 * 新規申し込みフォームのバリデーション
 */
function validateForm(formData) {
  const errors = {};

  if (!formData.name || formData.name.trim().length === 0) {
    errors.name = 'お名前を入力してください';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.email) {
    errors.email = 'メールアドレスを入力してください';
  } else if (!emailRegex.test(formData.email)) {
    errors.email = '有効なメールアドレスを入力してください';
  }

  if (!formData.visitorType) {
    errors['visitor-type'] = 'ご職業・属性を選択してください';
  }

  if (formData.preferredDate) {
    const date = parseLocalDate(formData.preferredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date.getDay() !== 1) {
      errors.preferredDate = '見学は月曜日のみ受け付けています';
    } else if (date < today) {
      errors.preferredDate = '過去の日付は選択できません';
    }
  }

  if (formData.message && formData.message.length > CONFIG.FORM.maxMessageLength) {
    errors.message = `メッセージは${CONFIG.FORM.maxMessageLength}文字以内で入力してください`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * 予約変更フォームのバリデーション
 */
function validateModifyForm(formData) {
  const errors = {};

  if (!formData.reservationId || formData.reservationId.trim().length === 0) {
    errors.modifyReservationId = '予約IDを入力してください';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.email) {
    errors.modifyEmail = 'メールアドレスを入力してください';
  } else if (!emailRegex.test(formData.email)) {
    errors.modifyEmail = '有効なメールアドレスを入力してください';
  }

  if (!formData.newDate) {
    errors.modifyNewDate = '新しい日程を選択してください';
  } else {
    const date = parseLocalDate(formData.newDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date.getDay() !== 1) {
      errors.modifyNewDate = '見学は月曜日のみ受け付けています';
    } else if (date < today) {
      errors.modifyNewDate = '過去の日付は選択できません';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * キャンセルフォームのバリデーション
 */
function validateCancelForm(formData) {
  const errors = {};

  if (!formData.reservationId || formData.reservationId.trim().length === 0) {
    errors.cancelReservationId = '予約IDを入力してください';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.email) {
    errors.cancelEmail = 'メールアドレスを入力してください';
  } else if (!emailRegex.test(formData.email)) {
    errors.cancelEmail = '有効なメールアドレスを入力してください';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// =============================================
// エラー表示
// =============================================

/**
 * エラー表示を更新
 */
function displayErrors(errors, formPrefix = '') {
  // すべてのエラー表示をリセット
  const errorElements = document.querySelectorAll('.form__error');
  errorElements.forEach((el) => {
    el.textContent = '';
    el.classList.remove('form__error--visible');
  });

  const inputElements = document.querySelectorAll('.form__input');
  inputElements.forEach((el) => {
    el.classList.remove('form__input--error');
  });

  // エラーがあれば表示
  Object.keys(errors).forEach((field) => {
    const errorEl = document.getElementById(`${field}-error`);
    const inputEl = document.getElementById(field) ||
      document.getElementById(field.replace(/([A-Z])/g, '-$1').toLowerCase());

    if (errorEl) {
      errorEl.textContent = errors[field];
      errorEl.classList.add('form__error--visible');
    }

    if (inputEl) {
      inputEl.classList.add('form__input--error');
    }
  });
}

// =============================================
// API通信
// =============================================

/**
 * GASにリクエストを送信
 */
async function sendToGAS(action, data) {
  if (!CONFIG.GAS_WEB_APP_URL || CONFIG.GAS_WEB_APP_URL === 'YOUR_GAS_WEB_APP_URL') {
    console.error('GAS Web App URLが設定されていません');
    throw new Error('GAS Web App URLが設定されていません');
  }

  const payload = {
    action: action,
    ...data
  };

  try {
    const response = await fetch(CONFIG.GAS_WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors', // CORSエラー回避
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // no-corsモードではレスポンスを読めないので、成功として扱う
    return { success: true };
  } catch (error) {
    console.error('GAS送信エラー:', error);
    throw error;
  }
}

/**
 * Discord Webhookに直接送信（フォールバック用）
 */
async function sendToDiscord(formData) {
  if (!CONFIG.DISCORD_WEBHOOK_URL || CONFIG.DISCORD_WEBHOOK_URL === 'YOUR_DISCORD_WEBHOOK_URL') {
    console.error('Discord Webhook URLが設定されていません');
    return false;
  }

  const embed = {
    title: '📋 新しい見学申し込み',
    color: 0x00ffcc,
    fields: [
      { name: '👤 お名前', value: sanitize(formData.name) || '未入力', inline: true },
      { name: '📧 メール', value: sanitize(formData.email) || '未入力', inline: true },
      { name: '💼 ご職業・属性', value: sanitize(formData.visitorType) || '未選択', inline: true },
      {
        name: '📅 見学希望日',
        value: formData.preferredDate
          ? new Date(formData.preferredDate).toLocaleDateString('ja-JP', {
              year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
            })
          : '未定・相談したい',
        inline: false,
      },
      { name: '💬 メッセージ', value: sanitize(formData.message) || 'なし', inline: false },
    ],
    footer: { text: `送信日時: ${new Date().toLocaleString('ja-JP')}` },
  };

  try {
    const response = await fetch(CONFIG.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'if(塾) 見学申込Bot', embeds: [embed] }),
    });
    return response.ok;
  } catch (error) {
    console.error('Discord送信エラー:', error);
    return false;
  }
}

// =============================================
// フォーム送信処理
// =============================================

/**
 * 新規申し込みを送信
 */
async function submitReservation(formData) {
  if (CONFIG.MODE.useGAS) {
    return await sendToGAS('submit', formData);
  } else {
    const success = await sendToDiscord(formData);
    return { success };
  }
}

/**
 * 予約変更を送信
 */
async function modifyReservation(formData) {
  return await sendToGAS('modify', {
    reservationId: formData.reservationId,
    email: formData.email,
    newDate: formData.newDate
  });
}

/**
 * 予約キャンセルを送信
 */
async function cancelReservation(formData) {
  return await sendToGAS('cancel', {
    reservationId: formData.reservationId,
    email: formData.email
  });
}

// =============================================
// ユーティリティ
// =============================================

/**
 * フォームデータを取得
 */
function getFormData(form) {
  const formData = new FormData(form);
  const data = {};
  for (const [key, value] of formData.entries()) {
    data[key] = typeof value === 'string' ? value.trim() : value;
  }
  return data;
}

/**
 * 送信結果を表示
 */
function showResult(resultEl, success, message) {
  if (!resultEl) return;

  resultEl.className = 'form__result';

  if (success) {
    resultEl.classList.add('form__result--success');
    resultEl.innerHTML = message || 'お申し込みありがとうございます。<br>担当者より追ってご連絡いたします。';
  } else {
    resultEl.classList.add('form__result--error');
    resultEl.textContent = message || '送信に失敗しました。しばらく経ってから再度お試しください。';
  }
}

/**
 * ボタンのローディング状態を更新
 */
function setButtonLoading(btn, loading) {
  if (!btn) return;

  if (loading) {
    btn.classList.add('btn--loading');
    btn.disabled = true;
  } else {
    btn.classList.remove('btn--loading');
    btn.disabled = false;
  }
}

// グローバルに公開
window.FormHandler = {
  validateForm,
  validateModifyForm,
  validateCancelForm,
  displayErrors,
  submitReservation,
  modifyReservation,
  cancelReservation,
  getFormData,
  showResult,
  setButtonLoading,
};

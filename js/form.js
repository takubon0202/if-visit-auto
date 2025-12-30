// =============================================
// フォーム処理
// =============================================

/**
 * 入力値のサニタイズ（XSS対策）
 * @param {string} str - サニタイズする文字列
 * @returns {string} サニタイズ済みの文字列
 */
function sanitize(str) {
  if (!str) return '';
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .substring(0, 1000); // 最大長制限
}

/**
 * 日付文字列をローカルタイムゾーンでパース
 * @param {string} dateString - YYYY-MM-DD形式の日付文字列
 * @returns {Date} Dateオブジェクト
 */
function parseLocalDate(dateString) {
  const dateParts = dateString.split('-');
  return new Date(
    parseInt(dateParts[0], 10),
    parseInt(dateParts[1], 10) - 1,
    parseInt(dateParts[2], 10)
  );
}

/**
 * フォームバリデーション
 * @param {Object} formData - フォームデータ
 * @returns {Object} { isValid: boolean, errors: Object }
 */
function validateForm(formData) {
  const errors = {};

  // 名前（必須）
  if (!formData.name || formData.name.trim().length === 0) {
    errors.name = 'お名前を入力してください';
  }

  // メールアドレス（必須・形式チェック）
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.email) {
    errors.email = 'メールアドレスを入力してください';
  } else if (!emailRegex.test(formData.email)) {
    errors.email = '有効なメールアドレスを入力してください';
  }

  // 学年（必須）
  if (!formData.grade) {
    errors.grade = '学年を選択してください';
  }

  // 見学希望日（任意だが、入力時は月曜日チェック）
  if (formData.preferredDate) {
    // YYYY-MM-DD形式をローカルタイムゾーンでパース（タイムゾーン問題の回避）
    const date = parseLocalDate(formData.preferredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date.getDay() !== 1) {
      errors.preferredDate = '見学は月曜日のみ受け付けています';
    } else if (date < today) {
      errors.preferredDate = '過去の日付は選択できません';
    }
  }

  // メッセージ（任意・最大500文字）
  if (formData.message && formData.message.length > CONFIG.FORM.maxMessageLength) {
    errors.message = `メッセージは${CONFIG.FORM.maxMessageLength}文字以内で入力してください`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * エラー表示を更新
 * @param {Object} errors - エラーオブジェクト
 */
function displayErrors(errors) {
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
    const inputEl = document.getElementById(field) || document.getElementById(field.replace(/([A-Z])/g, '-$1').toLowerCase());

    if (errorEl) {
      errorEl.textContent = errors[field];
      errorEl.classList.add('form__error--visible');
    }

    if (inputEl) {
      inputEl.classList.add('form__input--error');
    }
  });
}

/**
 * Discord Webhookに見学申し込みを送信
 * @param {Object} formData - フォームデータ
 * @returns {Promise<boolean>} 送信成功/失敗
 */
async function sendToDiscord(formData) {
  // Webhook URLが設定されているか確認
  if (!CONFIG.DISCORD_WEBHOOK_URL || CONFIG.DISCORD_WEBHOOK_URL === 'YOUR_DISCORD_WEBHOOK_URL') {
    console.error('Discord Webhook URLが設定されていません');
    return false;
  }

  // Embedメッセージを構築
  const embed = {
    title: '新しい見学申し込み',
    color: 0x4A7C59, // プライマリカラー
    fields: [
      {
        name: 'お名前',
        value: sanitize(formData.name) || '未入力',
        inline: true,
      },
      {
        name: 'メールアドレス',
        value: sanitize(formData.email) || '未入力',
        inline: true,
      },
      {
        name: '学年',
        value: sanitize(formData.grade) || '未選択',
        inline: true,
      },
      {
        name: '見学希望日',
        value: formData.preferredDate
          ? new Date(formData.preferredDate).toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })
          : '未定・相談したい',
        inline: false,
      },
      {
        name: 'ご質問・ご要望',
        value: sanitize(formData.message) || 'なし',
        inline: false,
      },
    ],
    footer: {
      text: `送信日時: ${new Date().toLocaleString('ja-JP')}`,
    },
  };

  try {
    const response = await fetch(CONFIG.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'if(塾) 見学申込Bot',
        embeds: [embed],
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Discord送信エラー:', error);
    return false;
  }
}

/**
 * フォームデータを取得
 * @param {HTMLFormElement} form - フォーム要素
 * @returns {Object} フォームデータ
 */
function getFormData(form) {
  const formData = new FormData(form);
  return {
    name: formData.get('name')?.trim() || '',
    email: formData.get('email')?.trim() || '',
    grade: formData.get('grade') || '',
    preferredDate: formData.get('preferredDate') || '',
    message: formData.get('message')?.trim() || '',
  };
}

/**
 * 送信結果を表示
 * @param {boolean} success - 成功/失敗
 */
function showResult(success) {
  const resultEl = document.getElementById('form-result');
  if (!resultEl) return;

  resultEl.className = 'form__result';

  if (success) {
    resultEl.classList.add('form__result--success');
    resultEl.textContent = 'お申し込みありがとうございます。担当者より追ってご連絡いたします。';
  } else {
    resultEl.classList.add('form__result--error');
    resultEl.textContent = '送信に失敗しました。しばらく経ってから再度お試しください。';
  }
}

/**
 * 送信ボタンの状態を更新
 * @param {boolean} loading - ローディング中かどうか
 */
function setButtonLoading(loading) {
  const btn = document.getElementById(CONFIG.FORM.submitButtonId);
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
  displayErrors,
  sendToDiscord,
  getFormData,
  showResult,
  setButtonLoading,
};

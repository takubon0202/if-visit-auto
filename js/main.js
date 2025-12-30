// =============================================
// メイン初期化スクリプト
// =============================================

document.addEventListener('DOMContentLoaded', () => {
  initDiscordLink();
  initForm();
  initDateInput();
  initFooterYear();
});

/**
 * フッターの年を動的に更新
 */
function initFooterYear() {
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

/**
 * Discord招待リンクを設定
 */
function initDiscordLink() {
  const discordLink = document.getElementById('discord-link');
  if (!discordLink) return;

  // 招待リンクが設定されているか確認
  if (CONFIG.DISCORD_INVITE_URL && CONFIG.DISCORD_INVITE_URL !== 'YOUR_DISCORD_INVITE_LINK') {
    discordLink.href = CONFIG.DISCORD_INVITE_URL;
  } else {
    // 未設定の場合は非表示にするか、デフォルトリンクを設定
    discordLink.style.display = 'none';
    console.warn('Discord招待リンクが設定されていません');
  }
}

/**
 * フォームの初期化
 */
function initForm() {
  const form = document.getElementById(CONFIG.FORM.formId);
  if (!form) return;

  form.addEventListener('submit', handleFormSubmit);

  // リアルタイムバリデーション（フォーカスアウト時）
  const inputs = form.querySelectorAll('.form__input');
  inputs.forEach((input) => {
    input.addEventListener('blur', () => {
      const formData = FormHandler.getFormData(form);
      const { errors } = FormHandler.validateForm(formData);

      // 該当フィールドのみエラー表示
      const fieldName = input.name;
      if (errors[fieldName]) {
        const errorEl = document.getElementById(`${fieldName}-error`) ||
          document.getElementById(`${fieldName.replace(/([A-Z])/g, '-$1').toLowerCase()}-error`);
        if (errorEl) {
          errorEl.textContent = errors[fieldName];
          errorEl.classList.add('form__error--visible');
        }
        input.classList.add('form__input--error');
      } else {
        const errorEl = document.getElementById(`${fieldName}-error`) ||
          document.getElementById(`${fieldName.replace(/([A-Z])/g, '-$1').toLowerCase()}-error`);
        if (errorEl) {
          errorEl.textContent = '';
          errorEl.classList.remove('form__error--visible');
        }
        input.classList.remove('form__input--error');
      }
    });
  });
}

/**
 * 日付入力の初期化（月曜日のみ選択可能にする）
 */
function initDateInput() {
  const dateInput = document.getElementById('preferred-date');
  if (!dateInput) return;

  // 最小日付を今日に設定
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  dateInput.min = `${yyyy}-${mm}-${dd}`;

  // 月曜日以外が選択されたら警告
  dateInput.addEventListener('change', (e) => {
    const selectedDate = new Date(e.target.value);
    const errorEl = document.getElementById('preferred-date-error');

    if (selectedDate.getDay() !== 1) {
      e.target.setCustomValidity('月曜日を選択してください');
      if (errorEl) {
        errorEl.textContent = '見学は月曜日のみ受け付けています';
        errorEl.classList.add('form__error--visible');
      }
      e.target.classList.add('form__input--error');
    } else {
      e.target.setCustomValidity('');
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.remove('form__error--visible');
      }
      e.target.classList.remove('form__input--error');
    }
  });
}

/**
 * フォーム送信ハンドラ
 * @param {Event} e - 送信イベント
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const formData = FormHandler.getFormData(form);

  // バリデーション
  const { isValid, errors } = FormHandler.validateForm(formData);
  FormHandler.displayErrors(errors);

  if (!isValid) {
    // 最初のエラーフィールドにフォーカス
    const firstErrorField = Object.keys(errors)[0];
    const fieldEl = document.getElementById(firstErrorField) ||
      document.getElementById(firstErrorField.replace(/([A-Z])/g, '-$1').toLowerCase());
    if (fieldEl) {
      fieldEl.focus();
    }
    return;
  }

  // 送信処理
  FormHandler.setButtonLoading(true);

  try {
    const success = await FormHandler.sendToDiscord(formData);
    FormHandler.showResult(success);

    if (success) {
      // フォームをリセット
      form.reset();
      // エラー表示もクリア
      FormHandler.displayErrors({});
    }
  } catch (error) {
    console.error('フォーム送信エラー:', error);
    FormHandler.showResult(false);
  } finally {
    FormHandler.setButtonLoading(false);
  }
}

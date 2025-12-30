// =============================================
// メイン初期化スクリプト（予約変更・キャンセル対応）
// =============================================

document.addEventListener('DOMContentLoaded', () => {
  initDiscordLink();
  initForms();
  initDateInputs();
  initFooterYear();
  initTabs();
  initParticles();
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

  if (CONFIG.DISCORD_INVITE_URL && CONFIG.DISCORD_INVITE_URL !== 'YOUR_DISCORD_INVITE_LINK') {
    discordLink.href = CONFIG.DISCORD_INVITE_URL;
  } else {
    discordLink.style.display = 'none';
  }
}

/**
 * 全フォームの初期化
 */
function initForms() {
  // 新規申し込みフォーム
  const visitForm = document.getElementById(CONFIG.FORM.formId);
  if (visitForm) {
    visitForm.addEventListener('submit', handleVisitFormSubmit);
    initFormValidation(visitForm);
  }

  // 予約変更フォーム
  const modifyForm = document.getElementById(CONFIG.FORM.modifyFormId);
  if (modifyForm) {
    modifyForm.addEventListener('submit', handleModifyFormSubmit);
  }

  // キャンセルフォーム
  const cancelForm = document.getElementById(CONFIG.FORM.cancelFormId);
  if (cancelForm) {
    cancelForm.addEventListener('submit', handleCancelFormSubmit);
  }
}

/**
 * フォームのリアルタイムバリデーション設定
 */
function initFormValidation(form) {
  const inputs = form.querySelectorAll('.form__input');
  inputs.forEach((input) => {
    input.addEventListener('blur', () => {
      const formData = FormHandler.getFormData(form);
      const { errors } = FormHandler.validateForm(formData);

      const fieldName = input.name;
      const errorEl = document.getElementById(`${fieldName}-error`) ||
        document.getElementById(`${fieldName.replace(/([A-Z])/g, '-$1').toLowerCase()}-error`);

      if (errors[fieldName]) {
        if (errorEl) {
          errorEl.textContent = errors[fieldName];
          errorEl.classList.add('form__error--visible');
        }
        input.classList.add('form__input--error');
      } else {
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
 * 日付入力の初期化（月曜日のみ選択可能）
 */
function initDateInputs() {
  const dateInputs = document.querySelectorAll('input[type="date"]');

  dateInputs.forEach(dateInput => {
    // 最小日付を今日に設定
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.min = `${yyyy}-${mm}-${dd}`;

    // 月曜日以外が選択されたら警告
    dateInput.addEventListener('change', (e) => {
      const selectedDate = new Date(e.target.value);
      const errorId = e.target.id + '-error';
      const errorEl = document.getElementById(errorId);

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
  });
}

/**
 * タブ切り替え機能
 */
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.tab;

      // タブボタンのアクティブ状態を更新
      tabBtns.forEach(b => b.classList.remove('tab-btn--active'));
      btn.classList.add('tab-btn--active');

      // タブパネルの表示/非表示を切り替え
      tabPanels.forEach(panel => {
        if (panel.id === targetId) {
          panel.classList.add('tab-panel--active');
        } else {
          panel.classList.remove('tab-panel--active');
        }
      });
    });
  });
}

/**
 * パーティクル背景の初期化
 */
function initParticles() {
  const particlesContainer = document.getElementById('particles');
  if (!particlesContainer) return;

  // パーティクルを生成
  for (let i = 0; i < 50; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 5 + 's';
    particle.style.animationDuration = (5 + Math.random() * 10) + 's';
    particlesContainer.appendChild(particle);
  }
}

// =============================================
// フォーム送信ハンドラ
// =============================================

/**
 * 新規申し込みフォーム送信
 */
async function handleVisitFormSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const formData = FormHandler.getFormData(form);
  const resultEl = document.getElementById('form-result');
  const submitBtn = document.getElementById('submit-btn');

  // バリデーション
  const { isValid, errors } = FormHandler.validateForm(formData);
  FormHandler.displayErrors(errors);

  if (!isValid) {
    const firstErrorField = Object.keys(errors)[0];
    const fieldEl = document.getElementById(firstErrorField);
    if (fieldEl) fieldEl.focus();
    return;
  }

  // 送信処理
  FormHandler.setButtonLoading(submitBtn, true);

  try {
    const result = await FormHandler.submitReservation(formData);

    if (result.success) {
      let message = 'お申し込みありがとうございます。<br>担当者より追ってご連絡いたします。';
      if (result.reservationId) {
        message += `<br><br><strong>予約ID: ${result.reservationId}</strong><br><small>変更・キャンセル時に必要です。大切に保管してください。</small>`;
      }
      FormHandler.showResult(resultEl, true, message);
      form.reset();
      FormHandler.displayErrors({});
    } else {
      FormHandler.showResult(resultEl, false, result.message);
    }
  } catch (error) {
    console.error('フォーム送信エラー:', error);
    FormHandler.showResult(resultEl, false);
  } finally {
    FormHandler.setButtonLoading(submitBtn, false);
  }
}

/**
 * 予約変更フォーム送信
 */
async function handleModifyFormSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const formData = FormHandler.getFormData(form);
  const resultEl = document.getElementById('modify-result');
  const submitBtn = form.querySelector('button[type="submit"]');

  // バリデーション
  const { isValid, errors } = FormHandler.validateModifyForm(formData);
  FormHandler.displayErrors(errors);

  if (!isValid) {
    const firstErrorField = Object.keys(errors)[0];
    const fieldEl = document.getElementById(firstErrorField);
    if (fieldEl) fieldEl.focus();
    return;
  }

  // 送信処理
  FormHandler.setButtonLoading(submitBtn, true);

  try {
    const result = await FormHandler.modifyReservation(formData);
    FormHandler.showResult(resultEl, result.success, result.message || '予約を変更しました。');

    if (result.success) {
      form.reset();
    }
  } catch (error) {
    console.error('予約変更エラー:', error);
    FormHandler.showResult(resultEl, false, '変更に失敗しました。入力内容を確認してください。');
  } finally {
    FormHandler.setButtonLoading(submitBtn, false);
  }
}

/**
 * キャンセルフォーム送信
 */
async function handleCancelFormSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const formData = FormHandler.getFormData(form);
  const resultEl = document.getElementById('cancel-result');
  const submitBtn = form.querySelector('button[type="submit"]');

  // バリデーション
  const { isValid, errors } = FormHandler.validateCancelForm(formData);
  FormHandler.displayErrors(errors);

  if (!isValid) {
    const firstErrorField = Object.keys(errors)[0];
    const fieldEl = document.getElementById(firstErrorField);
    if (fieldEl) fieldEl.focus();
    return;
  }

  // 確認ダイアログ
  if (!confirm('本当に予約をキャンセルしますか？この操作は取り消せません。')) {
    return;
  }

  // 送信処理
  FormHandler.setButtonLoading(submitBtn, true);

  try {
    const result = await FormHandler.cancelReservation(formData);
    FormHandler.showResult(resultEl, result.success, result.message || '予約をキャンセルしました。');

    if (result.success) {
      form.reset();
    }
  } catch (error) {
    console.error('キャンセルエラー:', error);
    FormHandler.showResult(resultEl, false, 'キャンセルに失敗しました。入力内容を確認してください。');
  } finally {
    FormHandler.setButtonLoading(submitBtn, false);
  }
}

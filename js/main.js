// =============================================
// メイン初期化スクリプト（予約変更・キャンセル対応）
// =============================================

document.addEventListener('DOMContentLoaded', () => {
  initDiscordLink();
  initForms();
  initCalendars();
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
 * カレンダーの初期化（月曜日のみ選択可能）
 */
function initCalendars() {
  // 新規申し込みカレンダー
  if (document.getElementById('calendar-new')) {
    window.calendarNew = new MondayCalendar('calendar-new', 'preferredDate', {
      monthsToShow: 3,
      timeSlot: { start: '16:45', end: '18:15' },
      onSelect: (date) => {
        const infoEl = document.getElementById('selected-date-info');
        const textEl = document.getElementById('selected-date-text');
        if (infoEl && textEl) {
          infoEl.style.display = 'block';
          textEl.textContent = date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          });
        }
      }
    });
  }

  // 予約変更カレンダー
  if (document.getElementById('calendar-modify')) {
    window.calendarModify = new MondayCalendar('calendar-modify', 'modifyNewDate', {
      monthsToShow: 3,
      timeSlot: { start: '16:45', end: '18:15' },
      onSelect: (date) => {
        const infoEl = document.getElementById('modify-selected-date-info');
        const textEl = document.getElementById('modify-selected-date-text');
        if (infoEl && textEl) {
          infoEl.style.display = 'block';
          textEl.textContent = date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          });
        }
      }
    });
  }
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

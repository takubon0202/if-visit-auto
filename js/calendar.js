// =============================================
// 月曜日専用カレンダーコンポーネント
// =============================================

/**
 * カレンダークラス
 */
class MondayCalendar {
  constructor(containerId, inputId, options = {}) {
    this.container = document.getElementById(containerId);
    this.input = document.getElementById(inputId);
    this.options = {
      monthsToShow: 3,
      timeSlot: { start: '16:45', end: '18:15' },
      ...options
    };

    this.currentMonth = new Date();
    this.currentMonth.setDate(1);
    this.selectedDate = null;

    if (this.container) {
      this.render();
    }
  }

  /**
   * カレンダーをレンダリング
   */
  render() {
    this.container.innerHTML = '';
    this.container.className = 'calendar';

    // ヘッダー（月ナビゲーション）
    const header = this.createHeader();
    this.container.appendChild(header);

    // カレンダーグリッド
    const grid = this.createGrid();
    this.container.appendChild(grid);

    // 凡例
    const legend = this.createLegend();
    this.container.appendChild(legend);
  }

  /**
   * ヘッダーを作成
   */
  createHeader() {
    const header = document.createElement('div');
    header.className = 'calendar__header';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'calendar__nav-btn';
    prevBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>';
    prevBtn.addEventListener('click', () => this.prevMonth());

    const title = document.createElement('span');
    title.className = 'calendar__title';
    title.textContent = this.formatMonthYear(this.currentMonth);
    this.titleElement = title;

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'calendar__nav-btn';
    nextBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>';
    nextBtn.addEventListener('click', () => this.nextMonth());

    header.appendChild(prevBtn);
    header.appendChild(title);
    header.appendChild(nextBtn);

    return header;
  }

  /**
   * カレンダーグリッドを作成
   */
  createGrid() {
    const grid = document.createElement('div');
    grid.className = 'calendar__grid';

    // 曜日ヘッダー
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    weekdays.forEach((day, index) => {
      const dayHeader = document.createElement('div');
      dayHeader.className = 'calendar__weekday';
      if (index === 1) dayHeader.classList.add('calendar__weekday--monday');
      dayHeader.textContent = day;
      grid.appendChild(dayHeader);
    });

    // 日付セル
    const days = this.getDaysInMonth();
    days.forEach(day => {
      const cell = this.createDayCell(day);
      grid.appendChild(cell);
    });

    this.gridElement = grid;
    return grid;
  }

  /**
   * 日付セルを作成
   */
  createDayCell(day) {
    const cell = document.createElement('div');
    cell.className = 'calendar__day';

    if (!day) {
      cell.classList.add('calendar__day--empty');
      return cell;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isMonday = day.getDay() === 1;
    const isPast = day < today;
    const isSelected = this.selectedDate &&
      day.toDateString() === this.selectedDate.toDateString();

    cell.textContent = day.getDate();

    if (isPast) {
      cell.classList.add('calendar__day--past');
    } else if (isMonday) {
      cell.classList.add('calendar__day--monday');
      cell.classList.add('calendar__day--available');

      // 時間スロット表示
      const slot = document.createElement('div');
      slot.className = 'calendar__slot';
      slot.textContent = `${this.options.timeSlot.start}`;
      cell.appendChild(slot);

      if (!isPast) {
        cell.addEventListener('click', () => this.selectDate(day));
      }
    } else {
      cell.classList.add('calendar__day--disabled');
    }

    if (isSelected) {
      cell.classList.add('calendar__day--selected');
    }

    // 今日マーク
    if (day.toDateString() === today.toDateString()) {
      cell.classList.add('calendar__day--today');
    }

    return cell;
  }

  /**
   * 凡例を作成
   */
  createLegend() {
    const legend = document.createElement('div');
    legend.className = 'calendar__legend';

    const items = [
      { class: 'available', label: '予約可能（月曜日）' },
      { class: 'selected', label: '選択中' },
      { class: 'past', label: '予約不可' }
    ];

    items.forEach(item => {
      const legendItem = document.createElement('div');
      legendItem.className = 'calendar__legend-item';

      const dot = document.createElement('span');
      dot.className = `calendar__legend-dot calendar__legend-dot--${item.class}`;

      const label = document.createElement('span');
      label.textContent = item.label;

      legendItem.appendChild(dot);
      legendItem.appendChild(label);
      legend.appendChild(legendItem);
    });

    return legend;
  }

  /**
   * 月内の日付配列を取得
   */
  getDaysInMonth() {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];

    // 月初めの空白
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // 日付
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }

  /**
   * 前月へ
   */
  prevMonth() {
    const today = new Date();
    const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const prevMonth = new Date(this.currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);

    if (prevMonth >= minMonth) {
      this.currentMonth = prevMonth;
      this.updateGrid();
    }
  }

  /**
   * 次月へ
   */
  nextMonth() {
    const maxMonth = new Date();
    maxMonth.setMonth(maxMonth.getMonth() + this.options.monthsToShow);

    const nextMonth = new Date(this.currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    if (nextMonth <= maxMonth) {
      this.currentMonth = nextMonth;
      this.updateGrid();
    }
  }

  /**
   * グリッドを更新
   */
  updateGrid() {
    this.titleElement.textContent = this.formatMonthYear(this.currentMonth);

    // 古いグリッドを削除して新しいグリッドを作成
    const oldGrid = this.container.querySelector('.calendar__grid');
    const newGrid = this.createGrid();
    this.container.replaceChild(newGrid, oldGrid);
  }

  /**
   * 日付を選択
   */
  selectDate(date) {
    this.selectedDate = date;

    // 入力フィールドを更新
    if (this.input) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      this.input.value = `${year}-${month}-${day}`;

      // changeイベントを発火
      this.input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // UIを更新
    this.updateGrid();

    // コールバック
    if (this.options.onSelect) {
      this.options.onSelect(date);
    }
  }

  /**
   * 月年をフォーマット
   */
  formatMonthYear(date) {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long'
    });
  }

  /**
   * 選択された日付を取得
   */
  getSelectedDate() {
    return this.selectedDate;
  }

  /**
   * 日付をクリア
   */
  clearSelection() {
    this.selectedDate = null;
    if (this.input) {
      this.input.value = '';
    }
    this.updateGrid();
  }
}

// グローバルに公開
window.MondayCalendar = MondayCalendar;

import { Controller } from '@hotwired/stimulus';

const STATE_CLOSED = 'closed';
const STATE_COLLAPSED = 'collapsed';
const STATE_EXPANDED = 'expanded';
const SWIPE_THRESHOLD_PX = 60;

const MONTH_NAMES = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

const ITEM_HEIGHT = 40;
const MINUTE_STEP = 5;
const SCROLL_SETTLE_MS = 120;

export default class extends Controller {
    static targets = ['backdrop', 'sheet', 'monthLabel', 'grid', 'hourWheel', 'minuteWheel'];

    connect() {
        this.state = STATE_CLOSED;
        this.dragStartY = null;
        this.dragCurrentY = null;

        this.onRequest = (event) => this.open(event.detail);
        document.addEventListener('datetime-picker:request', this.onRequest);

        this.hourWheelTarget.addEventListener('scroll', () => this.onWheelScroll('hour'));
        this.minuteWheelTarget.addEventListener('scroll', () => this.onWheelScroll('minute'));
    }

    disconnect() {
        document.removeEventListener('datetime-picker:request', this.onRequest);
    }

    open({ which, current, min }) {
        this.which = which;
        this.min = min ? new Date(min) : null;

        const base = current ? new Date(current) : this.roundToStep(new Date());
        this.selected = this.min && base < this.min ? new Date(this.min) : base;
        this.year = this.selected.getFullYear();
        this.month = this.selected.getMonth();

        this.renderCalendar();

        this.backdropTarget.hidden = false;
        this.sheetTarget.hidden = false;
        requestAnimationFrame(() => {
            this.setState(STATE_COLLAPSED);
            this.presetWheels();
        });
    }

    close() {
        this.setState(STATE_CLOSED);
        window.setTimeout(() => {
            this.sheetTarget.hidden = true;
            this.backdropTarget.hidden = true;
        }, 250);
    }

    confirm() {
        document.dispatchEvent(new CustomEvent('datetime-picker:selected', {
            detail: { which: this.which, value: this.selected },
        }));
        this.close();
    }

    roundToStep(date) {
        const rounded = new Date(date);
        rounded.setSeconds(0, 0);
        rounded.setMinutes(Math.ceil(rounded.getMinutes() / MINUTE_STEP) * MINUTE_STEP);
        return rounded;
    }

    prevMonth() {
        this.month -= 1;
        if (this.month < 0) { this.month = 11; this.year -= 1; }
        this.renderCalendar();
    }

    nextMonth() {
        this.month += 1;
        if (this.month > 11) { this.month = 0; this.year += 1; }
        this.renderCalendar();
    }

    renderCalendar() {
        this.monthLabelTarget.textContent = `${MONTH_NAMES[this.month]} ${this.year}`;

        const firstOfMonth = new Date(this.year, this.month, 1);
        const mondayIndex = (firstOfMonth.getDay() + 6) % 7;
        const start = new Date(firstOfMonth);
        start.setDate(start.getDate() - mondayIndex);

        const today = new Date();
        this.gridTarget.innerHTML = '';

        const cursor = new Date(start);
        for (let row = 0; row < 6; row += 1) {
            const tr = document.createElement('tr');

            for (let col = 0; col < 7; col += 1) {
                const date = new Date(cursor);
                const isCurrentMonth = date.getMonth() === this.month;
                const isWeekend = col >= 5;
                const isToday = this.sameDay(date, today);
                const isSelected = this.sameDay(date, this.selected);
                const isDisabled = this.min && date < this.stripTime(this.min);

                const td = document.createElement('td');
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'calendar__day';
                if (!isCurrentMonth) button.classList.add('is-outside');
                if (isWeekend) button.classList.add('is-weekend');
                if (isToday) button.classList.add('is-today');
                if (isSelected) button.classList.add('is-selected');

                if (isDisabled) {
                    button.disabled = true;
                    button.style.opacity = '0.25';
                } else {
                    button.dataset.action = 'datetime-picker#selectDay';
                }
                button.dataset.date = date.toISOString();

                const number = document.createElement('span');
                number.className = 'calendar__day-number';
                number.textContent = String(date.getDate());
                button.appendChild(number);

                td.appendChild(button);
                tr.appendChild(td);
                cursor.setDate(cursor.getDate() + 1);
            }

            this.gridTarget.appendChild(tr);
        }
    }

    selectDay(event) {
        const date = new Date(event.currentTarget.dataset.date);
        this.selected.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
        this.renderCalendar();
    }

    sameDay(a, b) {
        return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    }

    stripTime(date) {
        const stripped = new Date(date);
        stripped.setHours(0, 0, 0, 0);
        return stripped;
    }

    presetWheels() {
        const hourIndex = this.selected.getHours();
        const minuteIndex = Math.round(this.selected.getMinutes() / MINUTE_STEP) % (60 / MINUTE_STEP);
        this.hourWheelTarget.scrollTop = hourIndex * ITEM_HEIGHT;
        this.minuteWheelTarget.scrollTop = minuteIndex * ITEM_HEIGHT;
        this.highlightWheelItem(this.hourWheelTarget, hourIndex);
        this.highlightWheelItem(this.minuteWheelTarget, minuteIndex);
    }

    onWheelScroll(which) {
        const wheel = which === 'hour' ? this.hourWheelTarget : this.minuteWheelTarget;
        clearTimeout(wheel._settleTimer);
        wheel._settleTimer = window.setTimeout(() => {
            const index = Math.round(wheel.scrollTop / ITEM_HEIGHT);
            this.highlightWheelItem(wheel, index);
            if (which === 'hour') {
                this.selected.setHours(index);
            } else {
                this.selected.setMinutes(index * MINUTE_STEP);
            }
        }, SCROLL_SETTLE_MS);
    }

    highlightWheelItem(wheel, index) {
        wheel.querySelectorAll('.time-wheel__item').forEach((item, itemIndex) => {
            item.classList.toggle('is-selected', itemIndex === index);
        });
    }

    setState(state) {
        this.state = state;
        this.sheetTarget.classList.remove('is-collapsed', 'is-expanded', 'is-closed');
        this.sheetTarget.classList.add(`is-${state}`);
        this.sheetTarget.style.transform = '';
        this.backdropTarget.classList.toggle('is-visible', state !== STATE_CLOSED);
    }

    touchStart(event) {
        this.dragStartY = event.touches[0].clientY;
        this.dragCurrentY = this.dragStartY;
        this.sheetTarget.classList.add('is-dragging');
    }

    touchMove(event) {
        if (this.dragStartY === null) return;
        this.dragCurrentY = event.touches[0].clientY;
        const delta = this.dragCurrentY - this.dragStartY;
        this.sheetTarget.style.transform = `translateY(${Math.max(delta, -window.innerHeight)}px)`;
    }

    touchEnd() {
        if (this.dragStartY === null) return;
        const delta = this.dragCurrentY - this.dragStartY;
        this.sheetTarget.classList.remove('is-dragging');
        this.sheetTarget.style.transform = '';

        if (delta > SWIPE_THRESHOLD_PX) {
            if (this.state === STATE_EXPANDED) {
                this.setState(STATE_COLLAPSED);
            } else {
                this.close();
            }
        } else if (delta < -SWIPE_THRESHOLD_PX) {
            this.setState(STATE_EXPANDED);
        } else {
            this.setState(this.state === STATE_CLOSED ? STATE_COLLAPSED : this.state);
        }

        this.dragStartY = null;
        this.dragCurrentY = null;
    }
}

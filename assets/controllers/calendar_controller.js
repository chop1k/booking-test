import { Controller } from '@hotwired/stimulus';

const MONTH_NAMES = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

/**
 * Виджет-календарь расписания бронирований (таблица 7x7, переключение месяцев).
 * При клике на день диспатчит на document событие "calendar:day-selected"
 * с датой и списком бронирований этого дня — слушает его day_schedule_controller.
 */
export default class extends Controller {
    static targets = ['monthLabel', 'grid'];
    static values = { bookingsUrl: String };

    connect() {
        const today = new Date();
        this.today = today;
        this.year = today.getFullYear();
        this.month = today.getMonth();
        this.firstLoad = true;
        this.render();
    }

    prevMonth() {
        this.month -= 1;
        if (this.month < 0) {
            this.month = 11;
            this.year -= 1;
        }
        this.render();
    }

    nextMonth() {
        this.month += 1;
        if (this.month > 11) {
            this.month = 0;
            this.year += 1;
        }
        this.render();
    }

    gridStart() {
        const firstOfMonth = new Date(this.year, this.month, 1);
        const mondayIndex = (firstOfMonth.getDay() + 6) % 7; // 0 = понедельник
        const start = new Date(firstOfMonth);
        start.setDate(start.getDate() - mondayIndex);
        return start;
    }

    async render() {
        this.monthLabelTarget.textContent = `${MONTH_NAMES[this.month]} ${this.year}`;

        const start = this.gridStart();
        const cells = [];
        const cursor = new Date(start);
        for (let index = 0; index < 42; index += 1) {
            cells.push(new Date(cursor));
            cursor.setDate(cursor.getDate() + 1);
        }
        const end = cells[cells.length - 1];

        try {
            this.bookingsByDate = await this.fetchBookings(start, end);
        } catch (error) {
            console.error(error);
            this.bookingsByDate = {};
        }

        this.renderGrid(cells);

        if (this.firstLoad) {
            this.firstLoad = false;
            document.dispatchEvent(new CustomEvent('calendar:ready'));
        }
    }

    async fetchBookings(start, end) {
        const url = new URL(this.bookingsUrlValue, window.location.origin);
        // ВАЖНО: спецификация не фиксирует единицы измерения from/to (type: number).
        // Предполагаем unix-время в секундах — если бекенд ждёт миллисекунды, поменять здесь.
        url.searchParams.set('from', Math.floor(start.getTime() / 1000));
        url.searchParams.set('to', Math.floor(end.getTime() / 1000));

        const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
        if (!response.ok) {
            throw new Error(`Не удалось загрузить бронирования: ${response.status}`);
        }

        const bookings = await response.json();
        const byDate = {};

        bookings.forEach((booking) => {
            const key = this.dateKey(new Date(booking.starts_at));
            if (!byDate[key]) {
                byDate[key] = [];
            }
            byDate[key].push(booking);
        });

        return byDate;
    }

    dateKey(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    densityLevel(count) {
        if (!count) return 'none';
        if (count <= 2) return 'low';
        if (count <= 5) return 'medium';
        return 'high';
    }

    renderGrid(cells) {
        this.gridTarget.innerHTML = '';

        for (let row = 0; row < 6; row += 1) {
            const tr = document.createElement('tr');

            for (let col = 0; col < 7; col += 1) {
                const date = cells[row * 7 + col];
                const key = this.dateKey(date);
                const bookings = this.bookingsByDate[key] || [];
                const isCurrentMonth = date.getMonth() === this.month;
                const isWeekend = col >= 5;
                const isToday = key === this.dateKey(this.today);

                const td = document.createElement('td');
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'calendar__day';
                if (!isCurrentMonth) button.classList.add('is-outside');
                if (isWeekend) button.classList.add('is-weekend');
                if (isToday) button.classList.add('is-today');

                button.dataset.action = 'calendar#openDay';
                button.dataset.date = key;
                button.setAttribute(
                    'aria-label',
                    `${date.getDate()} ${MONTH_NAMES[date.getMonth()]}, бронирований: ${bookings.length}`
                );

                const number = document.createElement('span');
                number.className = 'calendar__day-number';
                number.textContent = String(date.getDate());
                button.appendChild(number);

                const density = document.createElement('span');
                density.className = `calendar__density calendar__density--${this.densityLevel(bookings.length)}`;
                button.appendChild(density);

                td.appendChild(button);
                tr.appendChild(td);
            }

            this.gridTarget.appendChild(tr);
        }
    }

    openDay(event) {
        const { date } = event.currentTarget.dataset;
        const bookings = this.bookingsByDate[date] || [];
        document.dispatchEvent(new CustomEvent('calendar:day-selected', {
            detail: { date, bookings },
        }));
    }
}
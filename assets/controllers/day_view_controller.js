import { Controller } from '@hotwired/stimulus';
import { authorizedFetch, setAuthorizedImageSrc } from '../api.js';
import { renderScheduleEmptyState } from '../ui.js';

export default class extends Controller {
    static targets = ['dateLabel', 'list', 'empty'];
    static values = { date: String, bookingsUrl: String, roomsUrl: String };

    connect() {
        this.date = this.parseDate(this.dateValue);
        this.dateLabelTarget.textContent = this.formatDate(this.date);
        this.roomsById = new Map();
        this.load();
    }

    parseDate(value) {
        if (value) {
            const parsed = new Date(`${value}T00:00:00`);
            if (!Number.isNaN(parsed.getTime())) return parsed;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    }

    async load() {
        try {
            const [rooms, bookings] = await Promise.all([this.fetchRooms(), this.fetchBookings()]);
            rooms.forEach((room) => this.roomsById.set(String(room.id), room.name));
            this.renderList(bookings);
        } catch (error) {
            console.error(error);
            this.emptyTarget.textContent = 'Не удалось загрузить расписание';
            this.emptyTarget.hidden = false;
        } finally {
            document.dispatchEvent(new CustomEvent('app:content-ready'));
        }
    }

    async fetchRooms() {
        const response = await authorizedFetch(this.roomsUrlValue);
        if (!response.ok) throw new Error(`Не удалось загрузить комнаты: ${response.status}`);
        return response.json();
    }

    async fetchBookings() {
        const start = new Date(this.date);
        const end = new Date(this.date);
        end.setDate(end.getDate() + 1);

        const url = new URL(this.bookingsUrlValue, window.location.origin);
        url.searchParams.set('from', Math.floor(start.getTime() / 1000));
        url.searchParams.set('to', Math.floor(end.getTime() / 1000));

        const response = await authorizedFetch(url.toString());
        if (!response.ok) throw new Error(`Не удалось загрузить бронирования: ${response.status}`);

        return response.json();
    }

    renderList(bookings) {
        this.listTarget.innerHTML = '';

        if (!bookings.length) {
            renderScheduleEmptyState(this.listTarget, 'На этот день пока нет бронирований');
            return;
        }

        const byHour = new Map();
        bookings.forEach((booking) => {
            const hour = new Date(booking.starts_at).getHours();
            if (!byHour.has(hour)) byHour.set(hour, []);
            byHour.get(hour).push(booking);
        });

        [...byHour.keys()]
            .sort((a, b) => a - b)
            .forEach((hour) => {
                const hourBookings = byHour
                    .get(hour)
                    .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
                this.listTarget.appendChild(this.renderHourItem(hour, hourBookings));
            });
    }

    renderHourItem(hour, bookings) {
        const item = document.createElement('div');
        item.className = 'hour-item';

        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'hour-item__row';
        row.dataset.action = 'day-view#toggleHour';

        const time = document.createElement('span');
        time.className = 'hour-item__time';
        time.textContent = `${String(hour).padStart(2, '0')}:00 – ${String((hour + 1) % 24).padStart(2, '0')}:00`;
        row.appendChild(time);
        row.appendChild(this.renderRoomLabel(bookings));
        row.appendChild(this.renderAvatars(bookings));
        item.appendChild(row);

        const details = document.createElement('div');
        details.className = 'hour-item__details';
        bookings.forEach((booking) => details.appendChild(this.renderMinuteItem(booking)));
        item.appendChild(details);

        return item;
    }

    renderMinuteItem(booking) {
        const row = document.createElement('div');
        row.className = 'minute-item';

        const time = document.createElement('span');
        time.className = 'minute-item__time';
        time.textContent = `${this.formatTime(booking.starts_at)} – ${this.formatTime(booking.ends_at)}`;
        row.appendChild(time);
        row.appendChild(this.renderRoomLabel([booking]));
        row.appendChild(this.renderAvatars([booking]));

        return row;
    }

    renderRoomLabel(bookings) {
        const label = document.createElement('span');
        label.className = 'schedule-item__room';

        const roomIds = new Set(bookings.map((booking) => booking.room_id));
        label.textContent = roomIds.size === 1
            ? this.roomsById.get(String(bookings[0].room_id)) || ''
            : 'Несколько комнат';

        return label;
    }

    renderAvatars(bookings) {
        const wrap = document.createElement('span');
        wrap.className = 'avatars';

        const visible = bookings.slice(0, 3);
        const overflow = bookings.length - visible.length;

        visible.forEach((booking) => {
            const avatar = document.createElement('span');
            avatar.className = 'avatar';
            if (booking.user_id) {
                const img = document.createElement('img');
                img.alt = '';
                img.loading = 'lazy';
                setAuthorizedImageSrc(img, window.appUrls.userAvatar.replace('__ID__', booking.user_id));
                avatar.appendChild(img);
            } else {
                avatar.classList.add('avatar--placeholder');
            }
            wrap.appendChild(avatar);
        });

        if (overflow > 0) {
            const more = document.createElement('span');
            more.className = 'avatar avatar--more';
            more.textContent = `+${overflow}`;
            wrap.appendChild(more);
        }

        return wrap;
    }

    toggleHour(event) {
        event.currentTarget.closest('.hour-item').classList.toggle('is-open');
    }

    formatDate(date) {
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' });
    }

    formatTime(iso) {
        return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
}

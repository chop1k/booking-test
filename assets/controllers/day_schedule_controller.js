import { Controller } from '@hotwired/stimulus';
import { authorizedFetch, setAuthorizedImageSrc } from '../api.js';
import { renderScheduleEmptyState } from '../ui.js';

const STATE_CLOSED = 'closed';
const STATE_COLLAPSED = 'collapsed';
const STATE_EXPANDED = 'expanded';
const SWIPE_THRESHOLD_PX = 60;

export default class extends Controller {
    static targets = ['backdrop', 'sheet', 'dateLabel', 'list'];
    static values = { roomsUrl: String };

    connect() {
        this.state = STATE_CLOSED;
        this.dragStartY = null;
        this.dragCurrentY = null;
        this.roomsById = new Map();
        this.loadRooms();

        this.onDaySelected = (event) => this.open(event.detail);
        document.addEventListener('calendar:day-selected', this.onDaySelected);
    }

    disconnect() {
        document.removeEventListener('calendar:day-selected', this.onDaySelected);
    }

    async loadRooms() {
        try {
            const response = await authorizedFetch(this.roomsUrlValue);
            if (!response.ok) throw new Error(`Не удалось загрузить комнаты: ${response.status}`);
            (await response.json()).forEach((room) => this.roomsById.set(String(room.id), room.name));
        } catch (error) {
            console.error(error);
        }
    }

    open({ date, bookings }) {
        this.dateLabelTarget.textContent = this.formatDate(date);
        this.renderList(bookings);

        this.backdropTarget.hidden = false;
        this.sheetTarget.hidden = false;
        requestAnimationFrame(() => this.setState(STATE_COLLAPSED));
    }

    close() {
        this.setState(STATE_CLOSED);
        window.setTimeout(() => {
            this.sheetTarget.hidden = true;
            this.backdropTarget.hidden = true;
        }, 250);
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
        row.dataset.action = 'day-schedule#toggleHour';

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

    formatDate(dateKey) {
        const date = new Date(`${dateKey}T00:00:00`);
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' });
    }

    formatTime(iso) {
        return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
}

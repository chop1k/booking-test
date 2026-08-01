import { Controller } from '@hotwired/stimulus';
import { authorizedFetch } from '../api.js';

export default class extends Controller {
    static targets = ['collage'];
    static values = { roomsUrl: String };

    connect() {
        this.roomsReady = false;
        this.calendarReady = false;

        this.onCalendarReady = () => {
            this.calendarReady = true;
            this.maybeAnnounceReady();
        };
        document.addEventListener('calendar:ready', this.onCalendarReady);

        this.loadRooms();
    }

    disconnect() {
        document.removeEventListener('calendar:ready', this.onCalendarReady);
    }

    async loadRooms() {
        try {
            const response = await authorizedFetch(this.roomsUrlValue);
            if (!response.ok) throw new Error(`Не удалось загрузить комнаты: ${response.status}`);
            const rooms = await response.json();
            // Решение: если комнат не ровно 3 — всегда берём первые 3 по порядку ответа API.
            this.renderCollage(rooms.slice(0, 3));
        } catch (error) {
            console.error(error);
            this.collageTarget.innerHTML = '<div class="collage__error">Не удалось загрузить комнаты</div>';
        } finally {
            this.roomsReady = true;
            this.maybeAnnounceReady();
        }
    }

    renderCollage(rooms) {
        this.collageTarget.innerHTML = '';
        const slotClasses = ['collage__slot--main', 'collage__slot--top', 'collage__slot--bottom'];

        for (let index = 0; index < 3; index += 1) {
            const room = rooms[index];
            const slot = document.createElement('div');
            slot.className = `collage__slot ${slotClasses[index]}`;

            const attachment = room && room.attachments && room.attachments[0];

            if (attachment) {
                const img = document.createElement('img');
                img.src = attachment;
                img.alt = room.name || '';
                img.loading = 'lazy';
                slot.appendChild(img);
            } else {
                slot.classList.add('collage__slot--placeholder');
                slot.textContent = room ? (room.name || '?').charAt(0).toUpperCase() : '—';
            }

            this.collageTarget.appendChild(slot);
        }
    }

    maybeAnnounceReady() {
        if (this.roomsReady && this.calendarReady) {
            document.dispatchEvent(new CustomEvent('app:content-ready'));
        }
    }
}

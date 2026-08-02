import { Controller } from '@hotwired/stimulus';
import { authorizedFetch } from '../api.js';

export default class extends Controller {
    static targets = ['list', 'empty', 'itemTemplate'];
    static values = { roomsUrl: String };

    connect() {
        this.roomsById = new Map();
        this.loadRooms();
    }

    toggle(event) {
        const collapsed = this.element.classList.toggle('is-collapsed');
        event.currentTarget.setAttribute('aria-expanded', String(!collapsed));
    }

    async loadRooms() {
        try {
            const response = await authorizedFetch(this.roomsUrlValue);
            if (!response.ok) throw new Error(`Не удалось загрузить комнаты: ${response.status}`);
            this.renderRooms(await response.json());
        } catch (error) {
            console.error(error);
            this.emptyTarget.textContent = 'Не удалось загрузить список комнат';
            this.emptyTarget.hidden = false;
        } finally {
            document.dispatchEvent(new CustomEvent('quick-booking:ready'));
        }
    }

    renderRooms(rooms) {
        if (!rooms.length) {
            this.emptyTarget.textContent = 'Пока нет доступных для бронирования комнат';
            this.emptyTarget.hidden = false;
            return;
        }

        this.emptyTarget.hidden = true;

        rooms.forEach((room) => {
            const roomId = String(room.id);
            this.roomsById.set(roomId, room);

            const fragment = this.itemTemplateTarget.content.cloneNode(true);
            const button = fragment.querySelector('[data-quick-booking-target="itemButton"]');
            const name = fragment.querySelector('[data-quick-booking-target="itemName"]');
            const seatsValue = fragment.querySelector('[data-quick-booking-target="itemSeatsValue"]');

            button.dataset.roomId = roomId;
            name.textContent = room.name || '';

            const seats = (room.attributes || []).find((attribute) => attribute && attribute.type === 'seats');
            seatsValue.textContent = seats ? String(seats.capacity ?? seats.count ?? 0) : '0';

            this.listTarget.appendChild(fragment);
        });
    }

    openRoom(event) {
        const { roomId } = event.currentTarget.dataset;
        const room = this.roomsById.get(roomId);
        if (!room) return;

        document.dispatchEvent(new CustomEvent('quick-booking:room-chosen', {
            detail: { room },
        }));
    }
}

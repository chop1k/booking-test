import { Controller } from '@hotwired/stimulus';

const EQUIPMENT_TYPES = ['displays', 'boards', 'air-conditioners', 'office-attributes', 'tables'];

export default class extends Controller {
    static targets = ['list', 'empty', 'cardTemplate'];
    static values = { roomsUrl: String };

    connect() {
        this.roomsById = new Map();
        this.loadRooms();
    }

    async loadRooms() {
        try {
            const response = await fetch(this.roomsUrlValue, { headers: { Accept: 'application/json' } });
            if (!response.ok) {
                throw new Error(`Не удалось загрузить комнаты: ${response.status}`);
            }
            const rooms = await response.json();
            this.renderRooms(rooms);
        } catch (error) {
            console.error(error);
            this.emptyTarget.textContent = 'Не удалось загрузить список комнат';
            this.emptyTarget.hidden = false;
        } finally {
            document.dispatchEvent(new CustomEvent('app:content-ready'));
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

            const fragment = this.cardTemplateTarget.content.cloneNode(true);
            const link = fragment.querySelector('[data-room-selection-target="cardLink"]');
            const photo = fragment.querySelector('[data-room-selection-target="cardPhoto"]');
            const name = fragment.querySelector('[data-room-selection-target="cardName"]');
            const description = fragment.querySelector('[data-room-selection-target="cardDescription"]');
            const seatsValue = fragment.querySelector('[data-room-selection-target="cardSeatsValue"]');
            const equipment = fragment.querySelector('[data-room-selection-target="cardEquipment"]');

            link.dataset.roomId = roomId;

            name.textContent = room.name || '';
            description.textContent = room.description || '';

            const attachment = room.attachments && room.attachments[0];
            if (attachment) {
                photo.src = `/system/storage/files/${attachment.id}/content`;
                photo.alt = room.name || '';
            } else {
                photo.remove();
            }

            const attributesByType = this.groupAttributesByType(room.attributes || []);

            const seats = attributesByType.get('seats');
            seatsValue.textContent = seats
                ? String(seats.capacity ?? seats.count ?? 0)
                : '0';

            EQUIPMENT_TYPES.forEach((type) => {
                const attribute = attributesByType.get(type);
                const isPresent = Boolean(attribute && attribute.count > 0);

                const icon = document.createElement('span');
                icon.className = `equip-icon${isPresent ? ' equip-icon--present' : ''}`;
                icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><use href="#icon-${type}"></use></svg>`;
                equipment.appendChild(icon);
            });

            this.listTarget.appendChild(fragment);
        });
    }

    groupAttributesByType(attributes) {
        const byType = new Map();
        attributes.forEach((attribute) => {
            if (attribute && attribute.type) {
                byType.set(attribute.type, attribute);
            }
        });
        return byType;
    }

    openRoom(event) {
        const { roomId } = event.currentTarget.dataset;
        const room = this.roomsById.get(roomId);
        if (!room) return;

        document.dispatchEvent(new CustomEvent('room-selection:room-chosen', {
            detail: { room },
        }));
    }
}
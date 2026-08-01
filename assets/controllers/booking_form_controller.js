import { Controller } from '@hotwired/stimulus';
import { authorizedFetch } from '../api.js';

const STATE_CLOSED = 'closed';
const STATE_COLLAPSED = 'collapsed';
const STATE_EXPANDED = 'expanded';
const SWIPE_THRESHOLD_PX = 60;

const EQUIPMENT_LABELS = {
    displays: 'Проектор / экран',
    boards: 'Доска для рисования',
    'air-conditioners': 'Кондиционер',
    'office-attributes': 'Канцелярский набор',
    tables: 'Столы',
    'power-outlets': 'Розетки',
};
const EQUIPMENT_ORDER = Object.keys(EQUIPMENT_LABELS);

export default class extends Controller {
    static targets = [
        'backdrop', 'sheet', 'roomName', 'form', 'alert',
        'startField', 'startValue', 'endField', 'endValue',
        'peopleInput', 'equipmentList', 'counterTemplate',
        'submit', 'submitText', 'spinner',
    ];
    static values = { bookUrl: String };

    connect() {
        this.state = STATE_CLOSED;
        this.dragStartY = null;
        this.dragCurrentY = null;

        this.startInput = this.createHiddenDateTimeInput((value) => this.onStartChanged(value));
        this.endInput = this.createHiddenDateTimeInput((value) => this.onEndChanged(value));

        this.onRoomChosen = (event) => this.open(event.detail.room);
        document.addEventListener('room-selection:room-chosen', this.onRoomChosen);
    }

    disconnect() {
        document.removeEventListener('room-selection:room-chosen', this.onRoomChosen);
        this.startInput.remove();
        this.endInput.remove();
    }

    open(room) {
        this.room = room;
        this.reset();
        this.roomNameTarget.textContent = room.name || '';
        this.renderEquipmentCounters(room.attributes || []);

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

    reset() {
        this.startsAt = null;
        this.endsAt = null;
        this.startInput.value = '';
        this.endInput.value = '';
        this.startValueTarget.textContent = 'Выбрать дату и время';
        this.endValueTarget.textContent = 'Выбрать дату и время';
        this.startFieldTarget.classList.remove('is-valid', 'is-invalid');
        this.endFieldTarget.classList.remove('is-valid', 'is-invalid');
        this.peopleInputTarget.value = '';
        this.equipmentListTarget.innerHTML = '';
        this.hideAlert();
        this.setSubmitting(false);
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

    createHiddenDateTimeInput(onChange) {
        const input = document.createElement('input');
        input.type = 'datetime-local';
        input.style.position = 'fixed';
        input.style.left = '-9999px';
        input.style.width = '1px';
        input.style.height = '1px';
        input.style.opacity = '0';
        input.tabIndex = -1;
        input.addEventListener('change', () => onChange(input.value));
        this.element.appendChild(input);
        return input;
    }

    openDateTimePicker(input) {
        if (typeof input.showPicker === 'function') {
            input.showPicker();
        } else {
            input.focus();
            input.click();
        }
    }

    pickStart() {
        this.openDateTimePicker(this.startInput);
    }

    pickEnd() {
        this.openDateTimePicker(this.endInput);
    }

    onStartChanged(value) {
        this.startsAt = value ? new Date(value) : null;
        this.startValueTarget.textContent = this.startsAt ? this.formatDateTime(this.startsAt) : 'Выбрать дату и время';
        this.startFieldTarget.classList.remove('is-invalid');
    }

    onEndChanged(value) {
        this.endsAt = value ? new Date(value) : null;
        this.endValueTarget.textContent = this.endsAt ? this.formatDateTime(this.endsAt) : 'Выбрать дату и время';
        this.endFieldTarget.classList.remove('is-invalid');
    }

    formatDateTime(date) {
        return date.toLocaleString('ru-RU', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
        });
    }

    renderEquipmentCounters(attributes) {
        const byType = new Map();
        attributes.forEach((attribute) => {
            if (attribute && attribute.type) byType.set(attribute.type, attribute);
        });

        EQUIPMENT_ORDER.forEach((type) => {
            const attribute = byType.get(type);
            const max = attribute ? Number(attribute.count) || 0 : 0;
            if (max <= 0) return;

            const fragment = this.counterTemplateTarget.content.cloneNode(true);
            const row = fragment.querySelector('.counter-field');
            const icon = fragment.querySelector('[data-booking-form-target="counterIcon"]');
            const label = fragment.querySelector('[data-booking-form-target="counterLabel"]');
            const value = fragment.querySelector('[data-booking-form-target="counterValue"]');

            row.dataset.equipmentType = type;
            row.dataset.max = String(max);
            icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><use href="#icon-${type}"></use></svg>`;
            label.textContent = `${EQUIPMENT_LABELS[type] || type} (максимум ${max})`;
            value.textContent = '0';

            this.updateCounterButtons(row, 0, max);
            this.equipmentListTarget.appendChild(fragment);
        });
    }

    increment(event) {
        const row = event.currentTarget.closest('.counter-field');
        const max = Number(row.dataset.max);
        const valueEl = row.querySelector('[data-booking-form-target="counterValue"]');
        const next = Math.min(Number(valueEl.textContent) + 1, max);
        valueEl.textContent = String(next);
        this.updateCounterButtons(row, next, max);
    }

    decrement(event) {
        const row = event.currentTarget.closest('.counter-field');
        const max = Number(row.dataset.max);
        const valueEl = row.querySelector('[data-booking-form-target="counterValue"]');
        const next = Math.max(Number(valueEl.textContent) - 1, 0);
        valueEl.textContent = String(next);
        this.updateCounterButtons(row, next, max);
    }

    updateCounterButtons(row, value, max) {
        const [decrementBtn, incrementBtn] = row.querySelectorAll('.counter-field__btn');
        decrementBtn.disabled = value <= 0;
        incrementBtn.disabled = value >= max;
    }

    collectEquipmentCounters() {
        return [...this.equipmentListTarget.querySelectorAll('.counter-field')]
            .map((row) => ({
                type: row.dataset.equipmentType,
                count: Number(row.querySelector('[data-booking-form-target="counterValue"]').textContent),
            }))
            .filter((item) => item.count > 0);
    }

    async submit(event) {
        event.preventDefault();
        if (!this.validateBeforeSubmit()) return;

        this.hideAlert();
        this.setSubmitting(true);

        const payload = {
            room_id: Number(this.room.id),
            starts_at: this.startsAt.toISOString(),
            ends_at: this.endsAt.toISOString(),
            attributes: this.collectEquipmentCounters(),
        };

        try {
            const response = await authorizedFetch(this.bookUrlValue, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                this.close();
                return;
            }

            if (response.status === 400) {
                this.handleValidationError(await response.json().catch(() => null));
                return;
            }

            this.showAlert('Произошла серверная ошибка. Попробуйте ещё раз позже.');
        } catch (error) {
            console.error(error);
            this.showAlert('Не удалось отправить бронирование. Проверьте соединение и попробуйте снова.');
        } finally {
            this.setSubmitting(false);
        }
    }

    validateBeforeSubmit() {
        let valid = true;

        if (!this.startsAt) {
            this.startFieldTarget.classList.add('is-invalid');
            valid = false;
        }
        if (!this.endsAt) {
            this.endFieldTarget.classList.add('is-invalid');
            valid = false;
        }
        if (this.startsAt && this.endsAt && this.endsAt <= this.startsAt) {
            this.startFieldTarget.classList.add('is-invalid');
            this.endFieldTarget.classList.add('is-invalid');
            this.showAlert('Время окончания должно быть позже времени начала.');
            valid = false;
        }

        return valid;
    }

    handleValidationError(body) {
        const errors = (body && body.errors) || [];
        const fieldByName = {
            starts_at: this.startFieldTarget,
            ends_at: this.endFieldTarget,
        };

        Object.entries(fieldByName).forEach(([field, element]) => {
            const hasError = errors.some((error) => error.field === field);
            element.classList.toggle('is-invalid', hasError);
            element.classList.toggle('is-valid', !hasError);
        });

        const message = errors.length
            ? errors.map((error) => error.message).filter(Boolean).join(' ')
            : (body && (body.detail || body.title)) || 'Проверьте правильность заполнения формы.';

        this.showAlert(message);
    }

    setSubmitting(isSubmitting) {
        this.submitTarget.disabled = isSubmitting;
        this.submitTextTarget.hidden = isSubmitting;
        this.spinnerTarget.hidden = !isSubmitting;
    }

    showAlert(message) {
        this.alertTarget.textContent = message;
        this.alertTarget.hidden = false;
    }

    hideAlert() {
        this.alertTarget.hidden = true;
        this.alertTarget.textContent = '';
    }
}

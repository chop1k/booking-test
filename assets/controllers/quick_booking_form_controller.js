import { Controller } from '@hotwired/stimulus';
import { authorizedFetch } from '../api.js';

const STATE_CLOSED = 'closed';
const STATE_COLLAPSED = 'collapsed';
const STATE_EXPANDED = 'expanded';
const SWIPE_THRESHOLD_PX = 60;

export default class extends Controller {
    static targets = [
        'backdrop', 'sheet', 'roomName', 'alert',
        'durationOptions', 'startOptions',
        'submit', 'submitText', 'spinner',
    ];
    static values = { bookUrl: String };

    connect() {
        this.state = STATE_CLOSED;
        this.dragStartY = null;
        this.dragCurrentY = null;

        this.onRoomChosen = (event) => this.open(event.detail.room);
        document.addEventListener('quick-booking:room-chosen', this.onRoomChosen);
    }

    disconnect() {
        document.removeEventListener('quick-booking:room-chosen', this.onRoomChosen);
    }

    open(room) {
        this.room = room;
        this.duration = null;
        this.startOffset = null;
        this.roomNameTarget.textContent = room.name || '';
        this.clearSelection(this.durationOptionsTarget);
        this.clearSelection(this.startOptionsTarget);
        this.hideAlert();
        this.setSubmitting(false);
        this.updateSubmitState();

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

    clearSelection(container) {
        container.querySelectorAll('.quick-booking-form__option').forEach((option) => {
            option.classList.remove('is-selected');
        });
    }

    selectDuration(event) {
        this.duration = Number(event.currentTarget.dataset.value);
        this.clearSelection(this.durationOptionsTarget);
        event.currentTarget.classList.add('is-selected');
        this.updateSubmitState();
    }

    selectStart(event) {
        this.startOffset = Number(event.currentTarget.dataset.value);
        this.clearSelection(this.startOptionsTarget);
        event.currentTarget.classList.add('is-selected');
        this.updateSubmitState();
    }

    updateSubmitState() {
        this.submitTarget.disabled = this.duration === null || this.startOffset === null;
    }

    async submit() {
        if (this.duration === null || this.startOffset === null) return;

        this.hideAlert();
        this.setSubmitting(true);

        const startsAt = new Date(Date.now() + this.startOffset * 60000);
        const endsAt = new Date(startsAt.getTime() + this.duration * 60000);

        try {
            const response = await authorizedFetch(this.bookUrlValue, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_id: Number(this.room.id),
                    starts_at: startsAt.toISOString(),
                    ends_at: endsAt.toISOString(),
                    attributes: [],
                }),
            });

            if (response.ok) {
                document.dispatchEvent(new CustomEvent('bookings:changed'));
                this.close();
                return;
            }

            if (response.status === 400) {
                const body = await response.json().catch(() => null);
                const message = (body && body.errors && body.errors.map((error) => error.message).filter(Boolean).join(' '))
                    || (body && (body.detail || body.title))
                    || 'Проверьте правильность заполнения формы.';
                this.showAlert(message);
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

    setSubmitting(isSubmitting) {
        this.submitTarget.disabled = isSubmitting || this.duration === null || this.startOffset === null;
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

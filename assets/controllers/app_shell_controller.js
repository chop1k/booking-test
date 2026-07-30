import { Controller } from '@hotwired/stimulus';

/**
 * Корневой контроллер главной страницы.
 *
 * Отвечает за:
 *  - применение цветовой темы и цветовой схемы Telegram (light/dark) через CSS-переменные;
 *  - адаптацию высоты страницы под viewport Telegram WebApp;
 *  - загрузку списка комнат и отрисовку коллажа карточки "Забронировать комнату";
 *  - момент вызова Telegram.WebApp.ready()/.expand() — намеренно откладываем его,
 *    пока не отрисован и коллаж, и первый месяц календаря (см. calendar#ready событие),
 *    чтобы пользователь не увидел пустую/недогруженную страницу из-под нативного лоадера Telegram.
 */
export default class extends Controller {
    static targets = ['collage'];
    static values = {
        roomsUrl: String,
        roomSelectionUrl: String,
    };

    connect() {
        this.roomsReady = false;
        this.calendarReady = false;
        this.tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;

        this.onCalendarReady = () => {
            this.calendarReady = true;
            this.maybeFinishLoading();
        };
        document.addEventListener('calendar:ready', this.onCalendarReady);

        this.applyTelegramTheme();
        this.loadRooms();
    }

    disconnect() {
        document.removeEventListener('calendar:ready', this.onCalendarReady);
    }

    // --- Тема и вьюпорт Telegram -------------------------------------------------

    applyTelegramTheme() {
        const root = document.documentElement;

        if (!this.tg) {
            // Работаем вне Telegram (например, локальная разработка) — оставляем CSS-фолбэки.
            root.dataset.tgScheme = 'light';
            return;
        }

        const paramToCssVar = {
            bg_color: '--tg-bg-color',
            text_color: '--tg-text-color',
            hint_color: '--tg-hint-color',
            link_color: '--tg-link-color',
            button_color: '--tg-button-color',
            button_text_color: '--tg-button-text-color',
            secondary_bg_color: '--tg-secondary-bg-color',
            header_bg_color: '--tg-header-bg-color',
            accent_text_color: '--tg-accent-text-color',
            section_bg_color: '--tg-section-bg-color',
            section_header_text_color: '--tg-section-header-text-color',
            subtitle_text_color: '--tg-subtitle-text-color',
            destructive_text_color: '--tg-destructive-text-color',
        };

        const applyParams = (params) => {
            Object.entries(paramToCssVar).forEach(([key, cssVar]) => {
                if (params && params[key]) {
                    root.style.setProperty(cssVar, params[key]);
                }
            });
        };

        const applyViewport = () => {
            root.style.setProperty('--tg-viewport-height', `${this.tg.viewportHeight}px`);
            root.style.setProperty('--tg-viewport-stable-height', `${this.tg.viewportStableHeight}px`);
        };

        root.dataset.tgScheme = this.tg.colorScheme || 'light';
        applyParams(this.tg.themeParams);
        applyViewport();

        this.tg.onEvent('themeChanged', () => {
            root.dataset.tgScheme = this.tg.colorScheme || 'light';
            applyParams(this.tg.themeParams);
        });
        this.tg.onEvent('viewportChanged', applyViewport);
    }

    // --- Комнаты и коллаж ---------------------------------------------------------

    async loadRooms() {
        try {
            const response = await fetch(this.roomsUrlValue, { headers: { Accept: 'application/json' } });
            if (!response.ok) {
                throw new Error(`Не удалось загрузить комнаты: ${response.status}`);
            }
            const rooms = await response.json();
            // По решению: если комнат не ровно 3 — всегда берём первые 3 по порядку ответа API.
            this.renderCollage(rooms.slice(0, 3));
        } catch (error) {
            console.error(error);
            this.collageTarget.innerHTML = '<div class="collage__error">Не удалось загрузить комнаты</div>';
        } finally {
            this.roomsReady = true;
            this.maybeFinishLoading();
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
                img.src = `/system/storage/files/${attachment.id}/content`;
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

    // --- Готовность страницы -------------------------------------------------------

    maybeFinishLoading() {
        if (!this.roomsReady || !this.calendarReady) {
            return;
        }

        document.body.classList.add('is-ready');

        if (this.tg) {
            this.tg.ready();
            this.tg.expand();
        }
    }
}
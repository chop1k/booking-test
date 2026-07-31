import { Controller } from '@hotwired/stimulus';

let readyCalledOnce = false;

export default class extends Controller {
    connect() {
        this.tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;

        this.applyTheme();

        this.onContentReady = () => this.markReady();
        document.addEventListener('app:content-ready', this.onContentReady);

        if (this.element.dataset.awaitsContentReady !== 'true') {
            this.markReady();
        }
    }

    disconnect() {
        document.removeEventListener('app:content-ready', this.onContentReady);
        if (this.tg) {
            this.tg.offEvent('themeChanged', this.onThemeChanged);
            this.tg.offEvent('viewportChanged', this.onViewportChanged);
        }
    }

    applyTheme() {
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

        this.onThemeChanged = () => {
            root.dataset.tgScheme = this.tg.colorScheme || 'light';
            applyParams(this.tg.themeParams);
        };
        this.onViewportChanged = applyViewport;

        this.tg.onEvent('themeChanged', this.onThemeChanged);
        this.tg.onEvent('viewportChanged', this.onViewportChanged);
    }

    markReady() {
        document.body.classList.add('is-ready');

        if (!this.tg) {
            return;
        }

        if (!readyCalledOnce) {
            readyCalledOnce = true;
            this.tg.ready();
        }
        this.tg.expand();
    }
}
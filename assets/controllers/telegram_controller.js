import { Controller } from '@hotwired/stimulus';

// Turbo подменяет только <body>, поэтому window.Telegram.WebApp не пересоздаётся между
// переходами — ready() имеет смысл вызвать один раз за сессию.
let readyCalledOnce = false;
// Прятать body в ожидании данных имеет смысл только на самом первом запуске: в этот момент
// содержимое всё равно скрыто под нативным лоадером Telegram. На последующих Turbo-переходах
// такого лоадера уже нет, и прятать body — значит показывать пустой "мигающий" экран между
// страницами. Поэтому начиная со второго перехода body показываем сразу.
let firstNavigationHandled = false;

export default class extends Controller {
    connect() {
        this.tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
        this.applyTheme();

        const isFirstNavigation = !firstNavigationHandled;
        firstNavigationHandled = true;

        this.onContentReady = () => this.markReady();
        document.addEventListener('app:content-ready', this.onContentReady);

        if (!isFirstNavigation) {
            document.body.classList.add('is-ready');
            if (this.tg) this.tg.expand();
            return;
        }

        // Страницы без асинхронной загрузки данных не помечены data-awaits-content-ready —
        // для них готовность засчитывается сразу.
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

        if (!this.tg) return;

        if (!readyCalledOnce) {
            readyCalledOnce = true;
            this.tg.ready();
        }
        this.tg.expand();
    }
}

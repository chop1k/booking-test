// Календарь с галочкой — свободный день, бронирований нет.
const EMPTY_ICON = `
    <svg class="schedule-empty__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="5" width="18" height="16" rx="3"/>
        <path d="M3 10h18M8 3v4M16 3v4" stroke-linecap="round"/>
        <path d="M9 15l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
`;

export function renderScheduleEmptyState(container, message) {
    container.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'schedule-empty';
    wrap.innerHTML = `${EMPTY_ICON}<p class="schedule-empty__text">${message}</p>`;
    container.appendChild(wrap);
}

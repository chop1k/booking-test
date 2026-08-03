// initData доступен только внутри Telegram — вне него запросы уходят без Authorization
// (бэкенд ответит 401, это ожидаемо для локальной разработки вне Telegram).
function authHeader() {
    const tg = window.Telegram && window.Telegram.WebApp;
    return tg && tg.initData ? `Bearer ${tg.initData}` : null;
}

export function authorizedFetch(url, options = {}) {
    const headers = new Headers(options.headers || {});
    if (!headers.has('Accept')) headers.set('Accept', 'application/json');
    const auth = authHeader();
    if (auth) headers.set('Authorization', auth);
    return fetch(url, { ...options, headers });
}

// <img src="..."> не может послать Authorization-заголовок, поэтому для защищённых
// картинок (фото комнат, аватарки) грузим их через fetch и подставляем blob-URL.
export async function setAuthorizedImageSrc(img, url) {
    try {
        const response = await authorizedFetch(url);
        if (!response.ok) throw new Error(`Не удалось загрузить изображение: ${response.status}`);
        img.src = URL.createObjectURL(await response.blob());
    } catch (error) {
        console.error(error);
    }
}

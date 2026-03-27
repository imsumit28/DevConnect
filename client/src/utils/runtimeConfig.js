const normalize = (value = '') => String(value).trim().replace(/\/+$/, '');

const rawApiUrl = normalize(import.meta.env.VITE_API_URL || '');
const rawSocketUrl = normalize(import.meta.env.VITE_SOCKET_URL || '');

const apiBaseUrl = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`)
  : 'http://localhost:5000/api';

const apiOrigin = apiBaseUrl.replace(/\/api$/, '');
const socketUrl = rawSocketUrl || apiOrigin;

export { apiBaseUrl, apiOrigin, socketUrl };


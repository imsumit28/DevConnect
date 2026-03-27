import { apiOrigin } from './runtimeConfig';

const FALLBACK_PREFIX = '/uploads/';

export const resolveMediaUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl || '';

  const url = rawUrl.trim();
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;

  if (url.startsWith(FALLBACK_PREFIX)) {
    return `${apiOrigin}${url}`;
  }

  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith(FALLBACK_PREFIX)) {
      return `${apiOrigin}${parsed.pathname}`;
    }
    return url;
  } catch {
    return url;
  }
};


import { apiOrigin } from './runtimeConfig';

const FALLBACK_PREFIX = '/uploads/';

const normalizeSlashes = (value = '') => String(value).replace(/\\/g, '/');

const toUploadsPath = (value = '') => {
  const normalized = normalizeSlashes(value).trim();
  if (!normalized) return '';

  if (normalized.startsWith(FALLBACK_PREFIX)) return normalized;
  if (normalized.startsWith('uploads/')) return `/${normalized}`;

  const uploadsIndex = normalized.indexOf('/uploads/');
  if (uploadsIndex >= 0) return normalized.slice(uploadsIndex);

  const apiUploadsIndex = normalized.indexOf('/api/uploads/');
  if (apiUploadsIndex >= 0) return normalized.slice(apiUploadsIndex + 4); // remove "/api"

  return '';
};

export const resolveMediaUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl || '';

  const url = normalizeSlashes(rawUrl).trim();
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;

  const relativeUploadsPath = toUploadsPath(url);
  if (relativeUploadsPath) {
    return `${apiOrigin}${relativeUploadsPath}`;
  }

  try {
    const parsed = new URL(url);
    const pathFromAbsolute = toUploadsPath(parsed.pathname);
    if (pathFromAbsolute) {
      return `${apiOrigin}${pathFromAbsolute}`;
    }
    return url;
  } catch {
    return relativeUploadsPath ? `${apiOrigin}${relativeUploadsPath}` : url;
  }
};

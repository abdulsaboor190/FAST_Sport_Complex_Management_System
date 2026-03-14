export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : '');
export const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL || `${API_BASE_URL.replace(/\/api$/, '')}/uploads`;

/**
 * Resolves an image URL. If it's a relative path starting with /uploads,
 * it prepends the backend URL.
 */
export const resolveImageUrl = (path: string | null | undefined): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/uploads')) {
    return `${UPLOADS_URL}${path.replace('/uploads', '')}`;
  }
  return path;
};

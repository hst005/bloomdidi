const API_ORIGIN =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/api\/v1\/?$/, '') ||
  'http://localhost:3000';

/** Resolve /demo/* paths via the API static file server */
export function resolveImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  if (path.startsWith('/demo/')) return `${API_ORIGIN}${path}`;
  return path;
}

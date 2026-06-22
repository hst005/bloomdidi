const API = '/api/v1';
const TOKEN_KEY = 'bloomdidi_admin_token';

let onUnauthorized: (() => void) | null = null;

/** Wire session expiry → redirect to login (call once from app root) */
export function configureAdminApi(opts: { onUnauthorized: () => void }) {
  onUnauthorized = opts.onUnauthorized;
}

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export const api = {
  get token() {
    return getToken();
  },

  setToken(t: string | null) {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new CustomEvent('admin-auth-change'));
  },

  logout() {
    this.setToken(null);
    onUnauthorized?.();
  },

  async fetch<T>(path: string, init?: RequestInit): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    let res: Response;
    try {
      res = await fetch(`${API}${path}`, { ...init, headers });
    } catch {
      throw new Error(
        'Cannot reach the API. From the bloomdidi folder run: npm run dev:api (port 3000), then refresh.',
      );
    }

    if (res.status === 401 || res.status === 403) {
      if (path !== '/auth/admin/login') {
        localStorage.removeItem(TOKEN_KEY);
        onUnauthorized?.();
      }
      const err = await res.json().catch(() => ({}));
      const apiMessage =
        typeof err.message === 'string'
          ? err.message
          : Array.isArray(err.message)
            ? err.message.join(', ')
            : '';
      if (res.status === 401) {
        throw new Error(apiMessage || 'Session expired — please sign in again.');
      }
      throw new Error(apiMessage || 'Insufficient permissions');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const apiMessage =
        typeof err.message === 'string'
          ? err.message
          : Array.isArray(err.message)
            ? err.message.join(', ')
            : '';
      const message =
        apiMessage ||
        (res.status >= 500
          ? 'Cannot reach the API. From the project folder run: npm run dev:api'
          : res.statusText);
      throw new Error(message);
    }
    return res.json();
  },
};

export const fmt = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

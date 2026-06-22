const API = '/api/v1';

export const api = {
  token: localStorage.getItem('bloomdidi_admin_token'),

  setToken(t: string | null) {
    this.token = t;
    if (t) localStorage.setItem('bloomdidi_admin_token', t);
    else localStorage.removeItem('bloomdidi_admin_token');
  },

  async fetch<T>(path: string, init?: RequestInit): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    const res = await fetch(`${API}${path}`, { ...init, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const message =
        typeof err.message === 'string'
          ? err.message
          : Array.isArray(err.message)
            ? err.message.join(', ')
            : res.statusText;
      throw new Error(message);
    }
    return res.json();
  },
};

export const fmt = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

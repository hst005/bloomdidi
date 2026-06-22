const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

class ApiClient {
  private token: string | null = localStorage.getItem('bloomdidi_vendor_token');

  setToken(token: string | null) {
    this.token = token;
    if (token) localStorage.setItem('bloomdidi_vendor_token', token);
    else localStorage.removeItem('bloomdidi_vendor_token');
  }

  getToken() {
    return this.token;
  }

  async fetch<T>(path: string, init?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string>),
    };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message ?? 'Request failed');
    }
    return res.json();
  }
}

export const api = new ApiClient();

export function formatPrice(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

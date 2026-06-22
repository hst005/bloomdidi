const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

class ApiClient {
  private token: string | null = localStorage.getItem('bloomdidi_vendor_token');

  setToken(token: string | null) {
    this.token = token;
    if (token) localStorage.setItem('bloomdidi_vendor_token', token);
    else localStorage.removeItem('bloomdidi_vendor_token');
  }

  getToken() {
    return this.token ?? localStorage.getItem('bloomdidi_vendor_token');
  }

  async fetch<T>(path: string, init?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string>),
    };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    let res: Response;
    try {
      res = await fetch(`${API_BASE}${path}`, { ...init, headers });
    } catch {
      throw new Error(
        'Cannot reach the API. From the bloomdidi folder run: npm run dev:api (port 3000), then refresh.',
      );
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const apiMessage =
        typeof err.message === 'string'
          ? err.message
          : Array.isArray(err.message)
            ? err.message.join(', ')
            : '';
      if (res.status === 500 && (apiMessage === 'Internal server error' || !apiMessage)) {
        throw new Error(
          'API unavailable (proxy error). Start the backend: npm run dev:api — then refresh this page.',
        );
      }
      throw new Error(apiMessage || res.statusText || 'Request failed');
    }
    return res.json();
  }
}

export const api = new ApiClient();

export function formatPrice(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

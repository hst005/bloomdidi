import { createAuthClient } from 'better-auth/react';
import { phoneNumberClient } from 'better-auth/client/plugins';

const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN ??
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173');

export const authClient = createAuthClient({
  baseURL: API_ORIGIN,
  plugins: [phoneNumberClient()],
  fetchOptions: {
    credentials: 'include',
    auth: {
      type: 'Bearer',
      token: () => localStorage.getItem('bloomdidi_token') ?? '',
    },
    onSuccess: (ctx) => {
      const token = ctx.response.headers.get('set-auth-token');
      if (token) {
        localStorage.setItem('bloomdidi_token', token);
      }
    },
  },
});

export function clearAuthToken() {
  localStorage.removeItem('bloomdidi_token');
}

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem('bloomdidi_token', token);
  else localStorage.removeItem('bloomdidi_token');
}

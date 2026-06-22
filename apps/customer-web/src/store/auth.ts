import { create } from 'zustand';
import { api } from '../lib/api';
import { authClient, clearAuthToken, setAuthToken } from '../lib/auth-client';

interface AuthState {
  isAuthenticated: boolean;
  phone: string | null;
  name: string | null;
  login: (phone: string, otp: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!localStorage.getItem('bloomdidi_token'),
  phone: localStorage.getItem('bloomdidi_phone'),
  name: localStorage.getItem('bloomdidi_name'),

  hydrate: () => {
    set({
      isAuthenticated: !!localStorage.getItem('bloomdidi_token'),
      phone: localStorage.getItem('bloomdidi_phone'),
      name: localStorage.getItem('bloomdidi_name'),
    });
  },

  login: async (phone, otp, name = 'Customer') => {
    const { data, error } = await authClient.phoneNumber.verify({
      phoneNumber: phone,
      code: otp,
    });
    if (error) throw new Error(error.message ?? 'Invalid OTP');

    const token = localStorage.getItem('bloomdidi_token');
    if (token) api.setToken(token);

    if (name && data?.user?.id) {
      await authClient.updateUser({ name }).catch(() => undefined);
    }

    localStorage.setItem('bloomdidi_phone', phone);
    localStorage.setItem('bloomdidi_name', name);
    set({
      isAuthenticated: true,
      phone,
      name,
    });
  },

  logout: async () => {
    try {
      await authClient.signOut();
    } catch {
      // ignore — token may already be invalid
    }
    clearAuthToken();
    api.setToken(null);
    localStorage.removeItem('bloomdidi_phone');
    localStorage.removeItem('bloomdidi_name');
    set({ isAuthenticated: false, phone: null, name: null });
  },
}));

/** Sync bearer token into the legacy api client after page load. */
export function syncApiTokenFromStorage() {
  const token = localStorage.getItem('bloomdidi_token');
  api.setToken(token);
}

export { setAuthToken };

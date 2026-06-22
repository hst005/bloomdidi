import { create } from 'zustand';
import { api } from '../lib/api';

interface AuthState {
  isAuthenticated: boolean;
  phone: string | null;
  name: string | null;
  login: (phone: string, otp: string, name?: string) => Promise<void>;
  logout: () => void;
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
    await api.fetch('/auth/otp/send', { method: 'POST', body: JSON.stringify({ phone }) });
    const res = await api.fetch<{
      accessToken: string;
      user: { phone: string; name: string | null };
    }>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, name, role: 'CUSTOMER' }),
    });
    api.setToken(res.accessToken);
    localStorage.setItem('bloomdidi_phone', res.user.phone);
    if (res.user.name) localStorage.setItem('bloomdidi_name', res.user.name);
    set({
      isAuthenticated: true,
      phone: res.user.phone,
      name: res.user.name,
    });
  },

  logout: () => {
    api.setToken(null);
    localStorage.removeItem('bloomdidi_phone');
    localStorage.removeItem('bloomdidi_name');
    set({ isAuthenticated: false, phone: null, name: null });
  },
}));

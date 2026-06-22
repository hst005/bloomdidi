import { create } from 'zustand';
import { api } from '../lib/api';

interface AuthState {
  isAuthenticated: boolean;
  phone: string | null;
  checkAuth: () => boolean;
  login: (phone: string, otp: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!api.getToken(),
  phone: null,
  checkAuth: () => !!api.getToken(),
  login: async (phone, otp) => {
    await api.fetch('/auth/otp/send', { method: 'POST', body: JSON.stringify({ phone }) });
    const res = await api.fetch<{ accessToken: string }>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, role: 'VENDOR' }),
    });
    api.setToken(res.accessToken);
    set({ isAuthenticated: true, phone });
  },
  logout: () => {
    api.setToken(null);
    set({ isAuthenticated: false, phone: null });
  },
}));

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

interface User { id: string; name: string; email: string; role: string; }
interface AuthStore {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
}

const API = process.env.NEXT_PUBLIC_API_URL;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      login: async (email, password) => {
        const { data } = await axios.post(`${API}/auth/login`, { email, password });
        set({ user: data.user, token: data.token });
      },
      register: async (name, email, password) => {
        const { data } = await axios.post(`${API}/auth/register`, { name, email, password });
        set({ user: data.user, token: data.token });
      },
      logout: () => set({ user: null, token: null }),
      isAdmin: () => get().user?.role === 'ADMIN',
    }),
    { name: 'primeshop-auth' }
  )
);
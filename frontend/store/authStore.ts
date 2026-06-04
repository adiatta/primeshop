import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import toast from 'react-hot-toast';

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

console.log("NEXT_PUBLIC_API_URL =", API);


export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      login: async (email, password) => {
        const loadingToast = toast.loading('Connexion en cours...');
        try {
          const { data } = await axios.post(`${API}/auth/login`, { email, password });
          set({ user: data.user, token: data.token });
          toast.success(`Bienvenue, ${data.user.name} 👋`, { id: loadingToast });
        } catch (err: any) {
          const msg = err?.response?.data?.error || 'Email ou mot de passe incorrect';
          toast.error(msg, { id: loadingToast });
          throw err;
        }
      },

      register: async (name, email, password) => {
        const loadingToast = toast.loading('Création du compte...');
        try {
          const { data } = await axios.post(`${API}/auth/register`, { name, email, password });
          set({ user: data.user, token: data.token });
          toast.success(`Compte créé ! Bienvenue ${data.user.name} 🎉`, { id: loadingToast });
        } catch (err: any) {
          const msg = err?.response?.data?.error || 'Erreur lors de la création du compte';
          toast.error(msg, { id: loadingToast });
          throw err;
        }
      },

      logout: () => {
        set({ user: null, token: null });
        toast.success('Déconnecté avec succès');
      },

      isAdmin: () => get().user?.role === 'ADMIN',
    }),
    { name: 'primeshop-auth' }
  )
);
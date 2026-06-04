import { create } from 'zustand';

interface UIStore {
  authOpen:    boolean;
  authMode:    'login' | 'register';
  cartOpen:    boolean;
  openAuth:    (mode?: 'login' | 'register') => void;
  closeAuth:   () => void;
  setAuthMode: (mode: 'login' | 'register') => void;
  openCart:    () => void;
  closeCart:   () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  authOpen:  false,
  authMode:  'login',
  cartOpen:  false,
  openAuth:  (mode = 'login') => set({ authOpen: true, authMode: mode }),
  closeAuth: () => set({ authOpen: false }),
  setAuthMode: (mode) => set({ authMode: mode }),
  openCart:  () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
}));
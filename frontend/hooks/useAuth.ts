import { useAuthStore } from '@/store/authStore';
import { useUIStore }   from '@/store/uiStore';
import { useEffect, useState } from 'react';

export function useAuth() {
  const [hydrated, setHydrated] = useState(false);
  const user   = useAuthStore(s => s.user);
  const token  = useAuthStore(s => s.token);
  const logout = useAuthStore(s => s.logout);
  const { openAuth } = useUIStore();

  // Évite les problèmes d'hydratation SSR avec Zustand persist
  useEffect(() => { setHydrated(true); }, []);

  return {
    user:            hydrated ? user : null,
    token:           hydrated ? token : null,
    isAuthenticated: hydrated && !!user,
    isAdmin:         hydrated && user?.role === 'ADMIN',
    isHydrated:      hydrated,
    logout,
    openLogin:  ()  => openAuth('login'),
    openRegister: () => openAuth('register'),
  };
}
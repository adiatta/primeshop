'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Suspense } from 'react';
import AuthCallbackClient from './AuthCallbackClient';
import toast from 'react-hot-toast';

export default function AuthCallbackPage() {
  const router       = useRouter();
  const params       = useSearchParams();
  const setUserToken = useAuthStore.setState;

  useEffect(() => {
    const token = params.get('token');
    const user  = params.get('user');

    if (token && user) {
      try {
        const parsed = JSON.parse(decodeURIComponent(user));
        // Injecter dans le store Zustand
        useAuthStore.setState({ user: parsed, token });
        toast.success(`Bienvenue, ${parsed.name} ! 👋`);
        router.replace('/');
      } catch {
        toast.error('Erreur de connexion Google');
        router.replace('/');
      }
    } else {
      toast.error('Connexion Google annulée');
      router.replace('/');
    }
  }, []);

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#1e2433] border-t-blue-500 rounded-full animate-spin" />
      </div>
    }>
      <AuthCallbackClient />
    </Suspense>
  );
}
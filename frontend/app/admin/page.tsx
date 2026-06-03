'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/store/authStore';

const AdminPanel = dynamic(
  () => import('@/components/admin/AdminPanel'),
  { ssr: false }
);

export default function AdminPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [user, router]);

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-xl font-bold mb-2">Accès réservé</h1>
          <p className="text-[#8b96b0] text-sm">
            Vous navez pas les droits pour accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  // Importez et rendez ici votre AdminPanel complet
  return <AdminPanel />;
}
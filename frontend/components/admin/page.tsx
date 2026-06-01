'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

// Le vrai dashboard admin est dans le composant AdminPanel (artifact séparé)
// Cette page vérifie juste les droits avant de l'afficher

export default function AdminPage() {
  const user   = useAuthStore(s => s.user);
  const router = useRouter();

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'ADMIN') { router.push('/'); }
  }, [user]);

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-xl font-bold mb-2">Accès réservé</h1>
          <p className="text-[#8b96b0] text-sm">Vous n'avez pas les droits pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  // Importez et rendez ici votre AdminPanel complet
  // import dynamic from 'next/dynamic';
  // const AdminPanel = dynamic(() => import('@/components/admin/AdminPanel'), { ssr: false });
  return (
    <div className="min-h-screen bg-[#0a0c10] text-white flex items-center justify-center">
      <p className="text-[#8b96b0]">Chargement du panneau admin…</p>
    </div>
  );
}
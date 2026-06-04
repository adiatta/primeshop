'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Navbar } from '@/components/ui/Navbar';
import { FullPageLoader } from '@/components/ui/Loader';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const user   = useAuthStore(s => s.user);
  const router = useRouter();

  useEffect(() => {
    if (user === null)             { router.replace('/'); return; }
    if (user.role !== 'ADMIN')    { router.replace('/'); }
  }, [user]);

  if (!user) return <FullPageLoader text="Vérification des droits..." />;
  if (user.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-[#0a0c10]">
      <Navbar />
      <div className="pt-[68px]">
        {children}
      </div>
    </div>
  );
}
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const user   = useAuthStore(s => s.user);
  const router = useRouter();

  useEffect(() => {
    if (!user)               { router.replace('/'); return; }
    if (user.role !== 'ADMIN') { router.replace('/'); }
  }, [user]);

  if (!user || user.role !== 'ADMIN') return null;
  return <>{children}</>;
}
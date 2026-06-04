'use client';
import dynamic from 'next/dynamic';
import { FullPageLoader } from '@/components/ui/Loader';

const AdminPanel = dynamic(
  () => import('@/components/admin/AdminPanel'),
  { ssr: false, loading: () => <FullPageLoader text="Chargement du panel admin..." /> }
);

export default function AdminPage() {
  return <AdminPanel />;
}
// frontend/components/Providers.tsx
'use client';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthModal }   from '@/components/ui/AuthModal';   // ← présent ?
import { CartDrawer }  from '@/components/ui/CartDrawer';  // ← présent ?

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <AuthModal />   {/* ← présent ? */}
      <CartDrawer />  {/* ← présent ? */}
      <Toaster position="bottom-right" toastOptions={{
        style: { background: '#161a22', color: '#f0f4ff', border: '1px solid #1e2433', borderRadius: '12px' },
      }} />
    </QueryClientProvider>
  );
}
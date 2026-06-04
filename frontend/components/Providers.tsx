'use client';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthModal } from '@/components/ui/AuthModal';
import { CartDrawer } from '@/components/ui/CartDrawer';

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Modals globaux — disponibles sur toutes les pages */}
      <AuthModal />
      <CartDrawer />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#161a22',
            color: '#f0f4ff',
            border: '1px solid #1e2433',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 500,
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#161a22' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#161a22' } },
          loading: { iconTheme: { primary: '#2563eb', secondary: '#161a22' } },
        }}
      />
    </QueryClientProvider>
  );
}
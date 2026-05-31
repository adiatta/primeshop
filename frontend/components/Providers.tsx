'use client';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60 * 1000, retry: 1 },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        {children}
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
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
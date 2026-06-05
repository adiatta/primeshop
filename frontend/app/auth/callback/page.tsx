import { Suspense } from 'react';
import AuthCallbackClient from './AuthCallbackClient';

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-[#1e2433] border-t-blue-500 rounded-full animate-spin" />
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
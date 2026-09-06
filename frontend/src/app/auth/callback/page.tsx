'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

function CallbackHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (token) {
      auth.setToken(token);
      window.location.href = '/dashboard';
    } else if (error) {
      window.location.href = '/login?error=' + error;
    } else {
      window.location.href = '/login';
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 size={40} className="animate-spin text-indigo-400" />
        <p className="text-gray-400 font-medium">Signing you in...</p>
        <p className="text-gray-600 text-sm">You'll be redirected to your dashboard shortly.</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-indigo-400" />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}

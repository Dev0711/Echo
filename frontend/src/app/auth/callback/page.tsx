'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Loader2, Zap } from 'lucide-react';

function CallbackHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    if (token) { auth.setToken(token); window.location.href = '/dashboard'; }
    else if (error) { window.location.href = '/login?error=' + error; }
    else { window.location.href = '/login'; }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center gap-5">
      <div className="w-7 h-7 bg-indigo-500 rounded flex items-center justify-center">
        <Zap size={15} className="text-white" />
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-2 text-[13px] text-[#71717a]">
          <Loader2 size={14} className="animate-spin" />
          Signing you in...
        </div>
        <p className="text-[11px] text-[#3a3a3a]">You'll be redirected shortly.</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <Loader2 size={18} className="animate-spin text-[#52525b]" />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}

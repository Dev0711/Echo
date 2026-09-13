'use client';

import { useEffect } from 'react';
import { auth } from '@/lib/auth';
import { Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function LoginPage() {
  useEffect(() => {
    if (auth.isAuthenticated()) window.location.href = '/dashboard';
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="w-full max-w-[360px]">

        {/* Wordmark */}
        <div className="flex items-center gap-2 justify-center mb-10">
          <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center">
            <Zap size={13} className="text-white" />
          </div>
          <span className="text-[16px] font-semibold text-[#f2f2f2] tracking-tight">Echo</span>
        </div>

        {/* Card */}
        <div className="bg-[#141414] border border-[#252525] rounded-lg p-8 shadow-2xl">
          <h1 className="text-[16px] font-semibold text-[#f2f2f2] mb-1 text-center">Sign in to Echo</h1>
          <p className="text-[12px] text-[#71717a] text-center mb-7 leading-relaxed">
            Write once, publish to X, LinkedIn, Dev.to, Hashnode, and Medium.
          </p>

          {/* Google Sign-in */}
          <button
            onClick={() => auth.loginWithGoogle()}
            className="w-full flex items-center gap-3 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-800 rounded-md text-[13px] font-medium transition-colors shadow-sm group"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" className="shrink-0">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="flex-1 text-left">Continue with Google</span>
            <ArrowRight size={13} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <div className="flex items-center gap-3 my-5">
            <Separator className="flex-1" />
            <span className="text-[11px] text-[#3a3a3a]">or</span>
            <Separator className="flex-1" />
          </div>

          <Button variant="outline" className="w-full" disabled>
            Email / Password — Coming Soon
          </Button>
        </div>

        <p className="text-center text-[11px] text-[#3a3a3a] mt-6">
          Your credentials are encrypted and never shared.
        </p>
      </div>
    </div>
  );
}

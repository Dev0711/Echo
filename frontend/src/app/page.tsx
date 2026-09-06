'use client';

import { useEffect } from 'react';
import { auth } from '@/lib/auth';

export default function Home() {
  useEffect(() => {
    if (auth.isAuthenticated()) {
      window.location.href = '/dashboard';
    } else {
      window.location.href = '/login';
    }
  }, []);

  return null;
}

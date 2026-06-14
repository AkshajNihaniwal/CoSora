'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';

export default function HomePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role === 'ADMIN') router.replace('/dashboard');
    else if (user.role === 'EDITOR') router.replace('/tasks');
    else router.replace('/review');
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-cosora-orange animate-pulse">Loading CoSora...</div>
    </div>
  );
}

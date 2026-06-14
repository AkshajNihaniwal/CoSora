'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { useAuthStore } from '@/lib/store/authStore';

export default function ReviewerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (!isLoading && user && user.role !== 'REVIEWER') {
      if (user.role === 'ADMIN') router.replace('/dashboard');
      else if (user.role === 'EDITOR') router.replace('/tasks');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) return null;

  return (
    <div className="flex min-h-screen bg-cosora-black">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { MobileNav } from '@/components/layout/MobileNav';
import { useAuthStore } from '@/lib/store/authStore';

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (!isLoading && user && user.role !== 'EDITOR' && user.role !== 'ADMIN') {
      router.replace('/review');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) return null;

  return (
    <div className="flex min-h-screen bg-cosora-black">
      <Sidebar />
      <div className="flex-1 flex flex-col pb-16 md:pb-0">
        <TopBar />
        <main className="flex-1 p-6">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}

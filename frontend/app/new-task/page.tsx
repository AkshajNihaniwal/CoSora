'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { MobileNav } from '@/components/layout/MobileNav';
import { TaskCreatorChat } from '@/components/ui/TaskCreatorChat';
import { useAuthStore } from '@/lib/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NewTaskPage() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user?.role === 'REVIEWER') {
      router.replace('/review');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) return null;

  return (
    <div className="flex min-h-screen bg-cosora-black">
      <Sidebar />
      <div className="flex-1 flex flex-col pb-16 md:pb-0">
        <TopBar title="New Task" />
        <main className="flex-1 p-4 md:p-6 max-w-3xl mx-auto w-full">
          <TaskCreatorChat />
        </main>
      </div>
      {user.role === 'ADMIN' && <MobileNav />}
    </div>
  );
}

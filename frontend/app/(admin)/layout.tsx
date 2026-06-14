'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { MobileNav } from '@/components/layout/MobileNav';
import { useAuthStore } from '@/lib/store/authStore';
import { useNotificationStore } from '@/lib/store/notificationStore';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const urgentAlert = useNotificationStore((s) => s.urgentAlert);
  const setUrgentAlert = useNotificationStore((s) => s.setUrgentAlert);

  useEffect(() => {
    if (!isLoading && user && user.role !== 'ADMIN') {
      router.replace(user.role === 'EDITOR' ? '/tasks' : '/review');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-cosora-orange animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-cosora-black">
      <Sidebar />
      <div className="flex-1 flex flex-col pb-16 md:pb-0">
        <TopBar />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
      <MobileNav />

      {urgentAlert && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
          <div className="cosora-card max-w-md w-full p-6 border-cosora-danger">
            <h2 className="text-cosora-danger font-bold text-lg">{urgentAlert.title}</h2>
            <p className="text-cosora-light mt-2">{urgentAlert.message}</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setUrgentAlert(null)} className="cosora-btn-primary flex-1">
                View Task
              </button>
              <button
                onClick={() => setUrgentAlert(null)}
                className="flex-1 py-2 rounded border border-cosora-smoke text-cosora-mid"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

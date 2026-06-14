'use client';

import { Bell, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';
import { useNotificationStore } from '@/lib/store/notificationStore';

export function TopBar({ title }: { title?: string }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const setNotifications = useNotificationStore((s) => s.setNotifications);

  useEffect(() => {
    if (!user) return;
    api.get('/notifications').then((res) => {
      setNotifications(res.data.items, res.data.unreadCount);
    }).catch(() => {});
  }, [user, setNotifications]);

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
    router.push('/login');
  };

  return (
    <header className="h-14 border-b border-cosora-smoke bg-cosora-charcoal flex items-center justify-between px-6">
      <h1 className="text-cosora-light font-semibold">{title || 'CoSora'}</h1>
      <div className="flex items-center gap-4">
        <Link href="/notifications" className="relative text-cosora-mid hover:text-cosora-orange transition-colors">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-cosora-orange text-cosora-white text-[10px] rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Link>
        {user && (
          <button
            onClick={logout}
            className="text-cosora-mid hover:text-cosora-danger transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        )}
      </div>
    </header>
  );
}

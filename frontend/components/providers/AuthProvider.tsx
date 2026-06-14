'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';
import { connectSocket } from '@/lib/socket';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/login') {
      setLoading(false);
      return;
    }

    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data);
        connectSocket(res.data.id, res.data.role);
      })
      .catch(() => {
        setUser(null);
        if (pathname !== '/login') router.push('/login');
      })
      .finally(() => setLoading(false));
  }, [pathname, router, setLoading, setUser]);

  useEffect(() => {
    if (user) connectSocket(user.id, user.role);
  }, [user]);

  return <>{children}</>;
}

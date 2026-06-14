'use client';

import { useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/lib/store/authStore';
import { useNotificationStore } from '@/lib/store/notificationStore';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const setUrgentAlert = useNotificationStore((s) => s.setUrgentAlert);

  useEffect(() => {
    if (!user) return;

    const socket = getSocket();
    if (!socket.connected) socket.connect();
    socket.emit('join:user', user.id);
    if (user.role === 'ADMIN') {
      socket.emit('join:admin');
      socket.emit('join:audit');
    }

    socket.on('notification:new', (notification) => {
      addNotification(notification);
    });

    socket.on('email:urgent', (data: { sender: string; subject: string }) => {
      setUrgentAlert({
        id: Date.now().toString(),
        title: 'Urgent: Regulatory email received',
        message: `${data.sender} — ${data.subject}`,
        type: 'URGENT_EMAIL',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    });

    return () => {
      socket.off('notification:new');
      socket.off('email:urgent');
    };
  }, [user, addNotification, setUrgentAlert]);

  return <>{children}</>;
}

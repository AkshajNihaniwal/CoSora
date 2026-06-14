'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useNotificationStore } from '@/lib/store/notificationStore';
import { useEffect } from 'react';

const queryClient = new QueryClient();

function NotificationsContent() {
  const qc = useQueryClient();
  const setNotifications = useNotificationStore((s) => s.setNotifications);

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/notifications')).data,
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (data) {
      setNotifications(data.items, data.unreadCount);
    }
  }, [data, setNotifications]);

  const markRead = async (id: string) => {
    await api.post(`/notifications/${id}/read`);
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };

  const clearRead = async () => {
    await api.delete('/notifications/read-all');
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };

  const items = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="cosora-section-header flex-1">Notifications</div>
        <button onClick={clearRead} className="text-cosora-mid text-sm hover:text-cosora-light ml-4">
          Clear read
        </button>
      </div>

      {items.length === 0 ? (
        <div className="cosora-card p-8 text-center text-cosora-mid">No notifications</div>
      ) : (
        <div className="space-y-2">
          {items.map((n: {
            id: string; title: string; message: string; type: string;
            isRead: boolean; createdAt: string; taskId?: string;
          }) => (
            <div
              key={n.id}
              className={`cosora-card p-4 ${!n.isRead ? 'border-l-4 border-cosora-orange' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-cosora-light font-medium">{n.title}</p>
                  <p className="text-cosora-mid text-sm mt-1">{n.message}</p>
                  <p className="text-cosora-mid text-xs mt-2">
                    {new Date(n.createdAt).toLocaleString()} · {n.type}
                  </p>
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="text-cosora-orange text-xs whitespace-nowrap hover:underline"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationsContent />
    </QueryClientProvider>
  );
}

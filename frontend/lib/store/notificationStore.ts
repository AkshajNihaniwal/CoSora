import { create } from 'zustand';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  urgentAlert: Notification | null;
  setNotifications: (notifications: Notification[], unreadCount: number) => void;
  addNotification: (notification: Notification) => void;
  setUrgentAlert: (notification: Notification | null) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  urgentAlert: null,
  setNotifications: (notifications, unreadCount) => set({ notifications, unreadCount }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),
  setUrgentAlert: (urgentAlert) => set({ urgentAlert }),
}));

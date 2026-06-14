import prisma from '../lib/prisma';
import { emitToUser } from '../socket';

export async function createNotification(input: {
  userId: string;
  title: string;
  message: string;
  type: string;
  taskId?: string;
}) {
  const notification = await prisma.notification.create({
    data: input,
  });

  emitToUser(input.userId, 'notification:new', notification);
  return notification;
}

export async function getUserNotifications(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return { items, total, unreadCount, page, limit };
}

export async function markNotificationRead(id: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });
}

export async function clearReadNotifications(userId: string) {
  return prisma.notification.deleteMany({
    where: { userId, isRead: true },
  });
}

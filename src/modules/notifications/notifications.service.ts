import { prisma } from "../../config/prisma";

export const getNotifications = async (userId: string) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50 // limit to latest 50 notifications
  });
};

export const getUnreadCount = async (userId: string) => {
  return prisma.notification.count({
    where: { userId, isRead: false }
  });
};

export const markAllAsRead = async (userId: string) => {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true }
  });
};

export const markAsRead = async (id: string, userId: string) => {
  return prisma.notification.update({
    where: { id, userId },
    data: { isRead: true }
  });
};

export const createNotification = async (
  userId: string,
  universityId: string,
  title: string,
  message: string,
  type: string = "INFO"
) => {
  return prisma.notification.create({
    data: {
      userId,
      universityId,
      title,
      message,
      type
    }
  });
};

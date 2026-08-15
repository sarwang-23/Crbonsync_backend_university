import { z } from "zod";

export const getNotificationsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  isRead: z.enum(["true", "false"]).optional().transform(val => val === "true" ? true : val === "false" ? false : undefined)
});

export const notificationIdParamSchema = z.object({
  id: z.string().uuid("Invalid notification ID")
});

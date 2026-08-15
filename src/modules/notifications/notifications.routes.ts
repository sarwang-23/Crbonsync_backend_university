import { Router } from "express";
import { list, markRead, markAllRead, unreadCount } from "./notifications.controller";
import { authenticate } from "../../middleware/auth.middleware";

const notificationsRouter = Router();

notificationsRouter.use(authenticate);

notificationsRouter.get("/", list);
notificationsRouter.get("/unread-count", unreadCount);
notificationsRouter.patch("/read-all", markAllRead);
notificationsRouter.patch("/:id/read", markRead);

export { notificationsRouter };

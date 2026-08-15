import { Router } from "express";
import { list, markRead, markAllRead, unreadCount } from "./notifications.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validate.middleware";
import { getNotificationsSchema, notificationIdParamSchema } from "./notifications.validator";

const notificationsRouter = Router();

notificationsRouter.use(authenticate);

notificationsRouter.get("/", validateRequest(getNotificationsSchema, "query"), list);
notificationsRouter.get("/unread-count", unreadCount);
notificationsRouter.patch("/read-all", markAllRead);
notificationsRouter.patch("/:id/read", validateRequest(notificationIdParamSchema, "params"), markRead);

export { notificationsRouter };

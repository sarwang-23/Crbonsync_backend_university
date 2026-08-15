import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from "./notifications.service";

export const unreadCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const data = await getUnreadCount(userId);
    return res.status(200).json({ success: true, data: { count: data } });
  } catch (error) { next(error); }
};

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId; // Assuming authenticate middleware sets req.user
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const data = await getNotifications(userId);
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

export const markRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const data = await markAsRead(String(req.params.id), userId);
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

export const markAllRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const data = await markAllAsRead(userId);
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

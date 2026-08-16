import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { getUsers, createUser, updateUser } from "./users.service";

export const listUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const uId = authReq.user?.role === "SUPER_ADMIN" ? undefined : (authReq.user?.universityId || undefined);
    const data = await getUsers(uId);
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const adminId = authReq.user!.userId;
    const universityId = authReq.user?.role === "SUPER_ADMIN" ? req.body.universityId : authReq.user?.universityId;
    if (!universityId) return res.status(400).json({ success: false, message: "University ID required" });

    const data = await createUser({ ...req.body, universityId, adminId });
    return res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const adminId = authReq.user!.userId;
    const universityId = authReq.user!.universityId!;
    const data = await updateUser(String(req.params.id), req.body, adminId, universityId);
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

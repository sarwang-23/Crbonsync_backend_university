import { Request, Response } from "express";
import { getAuditLogs } from "./auditLogs.service";
import { getAuditLogsSchema } from "./auditLogs.validator";

export const getAuditLogsController = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    if (user.role !== "SUPER_ADMIN" && user.role !== "UNIVERSITY_ADMIN") {
      return res.status(403).json({ success: false, message: "Forbidden: Audit logs are restricted to admins" });
    }

    const filters: any = getAuditLogsSchema.parse(req.query) || {};

    if (user.role !== "SUPER_ADMIN") {
      filters.universityId = user.universityId;
    }

    const data = await getAuditLogs(filters);
    return res.status(200).json({ success: true, ...data });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to fetch audit logs" });
  }
};

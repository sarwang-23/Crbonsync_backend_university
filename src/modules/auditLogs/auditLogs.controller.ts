import { Request, Response } from "express";
import { getAuditLogs } from "./auditLogs.service";
import { getAuditLogsSchema } from "./auditLogs.validator";

export const getAuditLogsController = async (req: Request, res: Response) => {
  try {
    const filters = getAuditLogsSchema.parse(req.query);
    const data = await getAuditLogs(filters);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to fetch audit logs" });
  }
};

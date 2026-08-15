import { Router } from "express";
import { getAuditLogsController } from "./auditLogs.controller";

const auditLogsRouter = Router();

auditLogsRouter.get("/", getAuditLogsController);

export { auditLogsRouter };

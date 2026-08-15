import { z } from "zod";
import { AuditAction } from "../../generated/prisma/client";

export const getAuditLogsSchema = z.object({
  universityId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  action: z.nativeEnum(AuditAction).optional(),
  entity: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

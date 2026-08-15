import { z } from "zod";

export const getRecommendationsSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "IMPLEMENTED", "REJECTED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20)
});

export const generateRecommendationsSchema = z.object({
  reportingPeriodId: z.string().uuid("Invalid reporting period ID")
});

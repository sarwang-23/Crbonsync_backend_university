import { z } from "zod";

export const createTargetSchema = z.object({
  universityId: z.string().uuid("Invalid university ID"),
  targetYear: z.number().int().min(2000),
  reductionPct: z.number().min(0).max(100),
  description: z.string().optional()
});

export const getTargetProgressSchema = z.object({
  reportingPeriodId: z.string().uuid("Invalid reporting period ID"),
});

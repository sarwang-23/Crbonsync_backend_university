import { z } from "zod";

export const generateReportSchema = z.object({
  universityId: z.string().uuid("Invalid university ID"),
  reportingPeriodId: z.string().uuid("Invalid reporting period ID")
});

export const getReportsSchema = z.object({
  universityId: z.string().uuid("Invalid university ID")
});

export const reportIdParamSchema = z.object({
  id: z.string().uuid("Invalid report ID")
});

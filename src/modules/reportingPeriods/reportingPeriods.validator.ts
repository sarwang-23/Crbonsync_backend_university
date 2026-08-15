import { z } from "zod";

export const createReportingPeriodSchema = z.object({
  universityId: z.string().uuid(),
  name: z.string(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  description: z.string().optional()
});

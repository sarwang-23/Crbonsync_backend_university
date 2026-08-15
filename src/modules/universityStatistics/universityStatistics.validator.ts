import { z } from "zod";

export const getStatisticsSchema = z.object({
  universityId: z.string().uuid("Invalid university ID")
});

export const createStatisticSchema = z.object({
  universityId: z.string().uuid("Invalid university ID"),
  reportingPeriodId: z.string().uuid("Invalid reporting period ID"),
  studentCount: z.number().int().nonnegative().optional(),
  staffCount: z.number().int().nonnegative().optional(),
  totalAreaSqm: z.number().nonnegative().optional()
}).passthrough();

export const updateStatisticSchema = z.object({
  studentCount: z.number().int().nonnegative().optional(),
  staffCount: z.number().int().nonnegative().optional(),
  totalAreaSqm: z.number().nonnegative().optional()
}).passthrough();

export const statisticIdParamSchema = z.object({
  id: z.string().uuid("Invalid statistic ID")
});

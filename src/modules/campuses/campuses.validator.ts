import { z } from "zod";

export const createCampusSchema = z.object({
  name: z.string().min(2, "Campus name is required"),
  code: z.string().min(2, "Campus code is required"),
  universityId: z.string().uuid("Valid university ID is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default("India"),
  postalCode: z.string().optional(),
});

export type CreateCampusInput = z.infer<typeof createCampusSchema>;

export const updateCampusSchema = createCampusSchema
  .omit({ universityId: true })
  .partial();

export type UpdateCampusInput = z.infer<typeof updateCampusSchema>;

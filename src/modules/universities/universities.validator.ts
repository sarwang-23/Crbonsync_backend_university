import { z } from "zod";

export const createUniversitySchema = z.object({
  name: z.string().min(2, "University name is required"),

  code: z
    .string()
    .min(2, "University code is required")
    .max(50),

  email: z.string().email().optional(),

  phone: z.string().optional(),

  website: z.string().url().optional(),

  address: z.string().optional(),

  city: z.string().optional(),

  state: z.string().optional(),

  country: z.string().default("India"),

  postalCode: z.string().optional(),
});

export type CreateUniversityInput = z.infer<
  typeof createUniversitySchema
>;

export const updateUniversitySchema =
  createUniversitySchema.partial().extend({
    status: z
      .enum(["ACTIVE", "INACTIVE", "PENDING"])
      .optional(),
  });

export type UpdateUniversityInput = z.infer<
  typeof updateUniversitySchema
>;

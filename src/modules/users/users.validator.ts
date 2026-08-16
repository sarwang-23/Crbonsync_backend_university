import { z } from "zod";
import { UserRole, UserStatus } from "../../generated/prisma/client";

export const createUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
  universityId: z.string().uuid().optional(), // Admin can provide it, otherwise inferred
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

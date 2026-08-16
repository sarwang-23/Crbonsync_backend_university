import { z } from "zod";
import { UserRole } from "../../generated/prisma/client";

export const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  role: z.nativeEnum(UserRole).optional(),
  universityId: z.string().uuid("Invalid university ID").optional(),
  adminSecret: z.string().optional(), // For bypassing privileged role blocks
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

import { UserRole } from "../../generated/prisma/client";

export interface RegisterInput {
  firstName: string;
  lastName?: string;
  email: string;
  password?: string; // If left blank, a random one will be generated
  role: UserRole;
  universityId?: string;
}

export interface LoginInput {
  email: string;
  password?: string;
}

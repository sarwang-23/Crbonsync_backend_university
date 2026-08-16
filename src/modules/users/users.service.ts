import { prisma } from "../../config/prisma";
import { UserRole, UserStatus } from "../../generated/prisma/client";
import bcrypt from "bcryptjs";
import { logEvent } from "../auditLogs/auditLogs.service";

export const getUsers = async (universityId?: string) => {
  const where = universityId ? { universityId } : {};
  return prisma.user.findMany({
    where,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      lastLoginAt: true,
      universityId: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

export const createUser = async (data: {
  firstName: string;
  lastName?: string;
  email: string;
  role: UserRole;
  universityId: string;
  adminId: string;
}) => {
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) throw new Error("Email already in use");

  // In a real app, generate a random password and email it. For now, set a default.
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const user = await prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      role: data.role,
      passwordHash,
      universityId: data.universityId,
      status: "ACTIVE",
    },
    select: { id: true, email: true, firstName: true, role: true }
  });

  await logEvent("CREATE", "User", user.id, data.adminId, data.universityId, null, user, "Added new user");
  return user;
};

export const updateUser = async (id: string, data: {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
}, adminId: string, universityId: string) => {
  const oldUser = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, status: true, firstName: true, lastName: true } });
  if (!oldUser) throw new Error("User not found");

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, firstName: true, lastName: true, email: true, role: true, status: true }
  });

  await logEvent("UPDATE", "User", user.id, adminId, universityId, oldUser, user, "Updated user details");
  return user;
};
export const deleteUser = async (id: string, adminId: string, universityId: string) => {
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, universityId: true } });
  if (!user) throw new Error("User not found");

  // Cannot delete SUPER_ADMIN
  if (user.role === "SUPER_ADMIN") throw new Error("Cannot delete a SUPER_ADMIN account");

  await logEvent("DELETE", "User", id, adminId, universityId, user, null, "Deleted user");
  await prisma.user.delete({ where: { id } });
  return { message: "User deleted successfully" };
};

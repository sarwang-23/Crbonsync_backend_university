import { prisma } from "../../config/prisma";
import { AuditAction } from "../../generated/prisma/client";

export const logEvent = async (
  action: AuditAction,
  entity: string,
  entityId: string | null = null,
  userId: string | null = null,
  universityId: string | null = null,
  oldValue: any = null,
  newValue: any = null,
  ipAddress: string | null = null,
  userAgent: string | null = null
) => {
  return prisma.auditLog.create({
    data: {
      action,
      entity,
      entityId,
      userId,
      universityId,
      oldValue: oldValue ? oldValue : null,
      newValue: newValue ? newValue : null,
      ipAddress,
      userAgent
    }
  });
};

export const getAuditLogs = async (filters: {
  universityId?: string;
  userId?: string;
  action?: AuditAction;
  entity?: string;
  from?: string;
  to?: string;
}) => {
  const where: any = {};
  if (filters.universityId) where.universityId = filters.universityId;
  if (filters.userId) where.userId = filters.userId;
  if (filters.action) where.action = filters.action;
  if (filters.entity) where.entity = filters.entity;
  
  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt.gte = new Date(filters.from);
    if (filters.to) where.createdAt.lte = new Date(filters.to);
  }

  return prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100 // Limit for MVP
  });
};

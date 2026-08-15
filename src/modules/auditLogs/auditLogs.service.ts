import { prisma } from "../../config/prisma";
import { AuditAction } from "../../generated/prisma/client";

export const createAuditLog = async (params: {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  universityId?: string;
  userId?: string;
  oldValue?: any;
  newValue?: any;
  metadata?: any;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        entity: params.entityType,
        entityId: params.entityId,
        universityId: params.universityId,
        userId: params.userId,
        oldValue: params.oldValue ? params.oldValue : undefined,
        newValue: params.newValue ? params.newValue : undefined,
        metadata: params.metadata ? params.metadata : undefined,
        description: params.description,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    console.error("Failed to log audit action:", error);
    // Don't throw - audit logging shouldn't crash the main transaction flow typically
  }
};

export const logEvent = async (action: any, entity: any, entityId: any, userId: any, universityId: any, oldValue: any, newValue: any, description: any, _ip?: any) => {
  return createAuditLog({ action, entityType: entity, entityId, userId, universityId, oldValue, newValue, description });
};

export const getAuditLogs = async (filters: {
  universityId?: string;
  userId?: string;
  action?: AuditAction;
  entity?: string;
  entityId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}) => {
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 50;
  const skip = (page - 1) * limit;

  const where: any = {};
  
  if (filters.universityId) where.universityId = filters.universityId;
  if (filters.userId) where.userId = filters.userId;
  if (filters.action) where.action = filters.action;
  if (filters.entity) where.entity = filters.entity;
  if (filters.entityId) where.entityId = filters.entityId;

  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt.gte = new Date(filters.from);
    if (filters.to) where.createdAt.lte = new Date(filters.to);
  }

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } }
      }
    }),
    prisma.auditLog.count({ where })
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

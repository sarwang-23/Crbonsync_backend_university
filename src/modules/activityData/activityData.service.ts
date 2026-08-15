import { prisma } from "../../config/prisma";
import { CreateActivityDataInput, ActivityDataFilterParams } from "./activityData.types";
import { ActivityStatus, AuditAction } from "../../generated/prisma/client";
import { createAuditLog } from "../auditLogs/auditLogs.service";

export const createActivityData = async (userId: string, data: CreateActivityDataInput) => {
  // Validate ReportingPeriod bounds
  const period = await prisma.reportingPeriod.findUnique({
    where: { id: data.reportingPeriodId }
  });

  if (!period) throw new Error("Reporting period not found");

  const activityDate = new Date(data.activityDate);
  if (activityDate < period.startDate || activityDate > period.endDate) {
    throw new Error(`Activity date must be within reporting period (${period.startDate.toISOString().split('T')[0]} to ${period.endDate.toISOString().split('T')[0]})`);
  }

  // Verify University Isolation (period belongs to correct university)
  if (period.universityId !== data.universityId) {
    throw new Error("Reporting period does not belong to the specified university");
  }

  // Check for duplicate
  const existing = await prisma.activityData.findFirst({
    where: {
      universityId: data.universityId,
      reportingPeriodId: data.reportingPeriodId,
      activityDate: data.activityDate,
      category: data.category,
      quantity: data.quantity,
      unit: data.unit
    }
  });

  const result = await prisma.activityData.create({
    data: {
      universityId: data.universityId,
      reportingPeriodId: data.reportingPeriodId,
      campusId: data.campusId,
      buildingId: data.buildingId,
      floorId: data.floorId,
      category: data.category,
      scope: data.scope,
      quantity: data.quantity,
      unit: data.unit,
      activityDate: data.activityDate,
      description: existing ? `POSSIBLE_DUPLICATE: ${data.description || ''}` : data.description,
      status: "DRAFT",
      enteredById: userId,
    }
  });

  await createAuditLog({
    action: AuditAction.ACTIVITY_CREATED,
    entityType: "ActivityData",
    entityId: result.id,
    userId: userId || undefined,
    universityId: data.universityId,
    newValue: result,
    description: "Activity data created"
  });

  return result;
};

export const getActivityData = async (params: ActivityDataFilterParams) => {
  const { 
    universityId, reportingPeriodId, campusId, buildingId, floorId, 
    scope, category, status, from, to, page = 1, limit = 20 
  } = params;

  const skip = Math.max(0, (page - 1) * limit);

  const where: any = { universityId };

  if (reportingPeriodId) where.reportingPeriodId = reportingPeriodId;
  if (campusId) where.campusId = campusId;
  if (buildingId) where.buildingId = buildingId;
  if (floorId) where.floorId = floorId;
  if (scope) where.scope = scope;
  if (category) where.category = category;
  if (status) where.status = status;

  if (from || to) {
    where.activityDate = {};
    if (from) where.activityDate.gte = new Date(from);
    if (to) where.activityDate.lte = new Date(to);
  }

  const [data, total] = await Promise.all([
    prisma.activityData.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { activityDate: "desc" },
      include: {
        campus: { select: { name: true } },
        building: { select: { name: true } },
        floor: { select: { name: true } },
        createdBy: { select: { firstName: true, lastName: true } },
        verifiedBy: { select: { firstName: true, lastName: true } },
      }
    }),
    prisma.activityData.count({ where })
  ]);

  return {
    data,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  };
};

export const getActivityDataById = async (id: string, universityId: string) => {
  const record = await prisma.activityData.findUnique({
    where: { id },
    include: {
      campus: { select: { name: true } },
      building: { select: { name: true } },
      floor: { select: { name: true } },
      documents: true,
    }
  });

  if (!record || record.universityId !== universityId) {
    throw new Error("Activity data not found");
  }

  return record;
};

export const updateActivityData = async (id: string, universityId: string, data: any) => {
  const record = await getActivityDataById(id, universityId);
  
  // Rule Step 5: DRAFT and UNDER_REVIEW (NEEDS_REVIEW) are editable. VERIFIED and CALCULATED are locked.
  if (record.status === "VERIFIED" || record.status === "REJECTED") { // Calculated activities are usually verified first
    throw new Error(`Cannot edit activity data that is ${record.status}. Request correction to move to DRAFT.`);
  }

  // Validate dates if updated
  if (data.activityDate) {
    const period = await prisma.reportingPeriod.findUnique({
      where: { id: record.reportingPeriodId }
    });
    if (period) {
      const activityDate = new Date(data.activityDate);
      if (activityDate < period.startDate || activityDate > period.endDate) {
        throw new Error(`Activity date must be within reporting period bounds`);
      }
    }
  }

  const result = await prisma.activityData.update({
    where: { id },
    data
  });

  await createAuditLog({
    action: AuditAction.ACTIVITY_UPDATED,
    entityType: "ActivityData",
    entityId: id,
    universityId: universityId,
    oldValue: { quantity: record.quantity },
    newValue: { quantity: result.quantity },
    description: "Activity data updated"
  });

  return result;
};

export const deleteActivityData = async (id: string, universityId: string) => {
  const record = await getActivityDataById(id, universityId);
  
  if (record.status === "VERIFIED") {
    throw new Error("Cannot delete VERIFIED activity data");
  }

  const result = await prisma.activityData.delete({ where: { id } });

  await createAuditLog({
    action: AuditAction.DELETE,
    entityType: "ActivityData",
    entityId: id,
    universityId: universityId,
    oldValue: record,
    description: "Activity data deleted"
  });

  return result;
};

export const verifyActivityData = async (id: string, universityId: string, userId: string) => {
  const record = await getActivityDataById(id, universityId);

  // Checks required for verification (Step 3)
  if (!record.category) throw new Error("Category is missing");
  if (record.quantity <= 0) throw new Error("Quantity must be greater than 0");
  if (!record.unit) throw new Error("Unit is missing");
  if (!record.activityDate) throw new Error("Activity date is invalid");
  
  const period = await prisma.reportingPeriod.findUnique({ where: { id: record.reportingPeriodId } });
  if (!period || period.universityId !== universityId) {
    throw new Error("Invalid reporting period or university ownership mismatch");
  }

  const result = await prisma.activityData.update({
    where: { id },
    data: {
      status: "VERIFIED",
      verifiedById: userId,
      verifiedAt: new Date()
    }
  });

  await createAuditLog({
    action: AuditAction.ACTIVITY_VERIFIED,
    entityType: "ActivityData",
    entityId: id,
    userId: userId,
    universityId: universityId,
    description: "Activity verified"
  });

  return result;
};

export const rejectActivityData = async (id: string, universityId: string, userId: string, reason: string) => {
  if (!reason) {
    throw new Error("Rejection reason is mandatory");
  }

  const record = await getActivityDataById(id, universityId);

  const result = await prisma.activityData.update({
    where: { id },
    data: {
      status: "REJECTED",
      rejectionReason: reason
    }
  });

  await createAuditLog({
    action: AuditAction.ACTIVITY_REJECTED,
    entityType: "ActivityData",
    entityId: id,
    userId: userId,
    universityId: universityId,
    description: `Activity rejected: ${reason}`
  });

  return result;
};

// State Hooks
export const changeActivityStatus = async (id: string, universityId: string, status: ActivityStatus, userId: string, rejectionReason?: string) => {
  const record = await getActivityDataById(id, universityId);

  // Workflow rules: DRAFT -> SUBMITTED -> UNDER_REVIEW -> VERIFIED/REJECTED -> DRAFT
  const current = record.status;
  
  if (status === "SUBMITTED" && current !== "DRAFT" && current !== "REJECTED") {
    throw new Error("Only DRAFT or REJECTED records can be SUBMITTED");
  }
  if (status === "UNDER_REVIEW" && current !== "SUBMITTED") {
    throw new Error("Only SUBMITTED records can be marked UNDER_REVIEW");
  }
  if (status === "DRAFT" && current !== "REJECTED") {
     throw new Error("Only REJECTED records can be reverted to DRAFT");
  }

  const result = await prisma.activityData.update({
    where: { id },
    data: {
      status,
      rejectionReason: status === "REJECTED" ? rejectionReason : null,
      verifiedById: status === "VERIFIED" ? userId : undefined,
      verifiedAt: status === "VERIFIED" ? new Date() : undefined,
    }
  });

  if (status === "SUBMITTED" || status === "UNDER_REVIEW") {
    await createAuditLog({
      action: AuditAction.UPDATE,
      entityType: "ActivityData",
      entityId: id,
      userId: userId,
      universityId: universityId,
      description: `Activity status changed to ${status}`
    });
  }

  return result;
};

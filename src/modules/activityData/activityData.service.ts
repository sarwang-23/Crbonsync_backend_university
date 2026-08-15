import { prisma } from "../../config/prisma";
import { CreateActivityDataInput, ActivityDataFilterParams } from "./activityData.types";
import { ActivityStatus, AuditAction } from "../../generated/prisma/client";
import { logEvent } from "../auditLogs/auditLogs.service";

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
      description: data.description,
      status: "DRAFT",
      enteredById: userId,
    }
  });

  await logEvent(
    AuditAction.ACTIVITY_CREATED,
    "ActivityData",
    result.id,
    userId,
    data.universityId,
    null,
    result,
    "Activity data created"
  );

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
  
  if (record.status !== "DRAFT" && record.status !== "REJECTED") {
    throw new Error("Only DRAFT or REJECTED activity data can be updated");
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

  await logEvent(
    AuditAction.ACTIVITY_UPDATED,
    "ActivityData",
    id,
    null,
    universityId,
    { quantity: record.quantity },
    { quantity: result.quantity },
    "Activity quantity updated"
  );

  return result;
};

export const deleteActivityData = async (id: string, universityId: string) => {
  const record = await getActivityDataById(id, universityId);
  
  if (record.status === "VERIFIED") {
    throw new Error("Cannot delete VERIFIED activity data");
  }

  const result = await prisma.activityData.delete({ where: { id } });

  await logEvent(
    AuditAction.DELETE,
    "ActivityData",
    id,
    null,
    universityId,
    record,
    null,
    "Activity data deleted"
  );

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
  if ((status === "VERIFIED" || status === "REJECTED") && current !== "UNDER_REVIEW") {
    throw new Error("Only UNDER_REVIEW records can be VERIFIED or REJECTED");
  }
  if (status === "DRAFT" && current !== "REJECTED") {
     throw new Error("Only REJECTED records can be reverted to DRAFT");
  }

  if (status === "REJECTED" && !rejectionReason) {
    throw new Error("rejectionReason is required when rejecting activity data");
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

  if (status === "VERIFIED") {
    await logEvent(
      AuditAction.ACTIVITY_VERIFIED,
      "ActivityData",
      id,
      userId,
      universityId,
      null,
      null,
      "Activity data verified"
    );
  }

  return result;
};

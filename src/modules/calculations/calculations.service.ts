import { prisma } from "../../config/prisma";
import { logEvent } from "../auditLogs/auditLogs.service";
import { AuditAction } from "../../generated/prisma/client";

export const calculateActivity = async (activityId: string) => {
  const activity = await prisma.activityData.findUnique({
    where: { id: activityId },
    include: {
      university: true,
      reportingPeriod: true,
    }
  });

  if (!activity) {
    throw new Error("Activity data not found");
  }

  if (activity.status !== "VERIFIED") {
    throw new Error("Only VERIFIED activity data can be calculated");
  }

  const period = activity.reportingPeriod;

  if (period.status === "LOCKED") {
    throw new Error("Reporting period is locked");
  }

  const factor = await prisma.emissionFactor.findFirst({
    where: {
      category: activity.category,
      scope: activity.scope,
      status: "ACTIVE",
      OR: [
        { country: activity.university.country },
        { country: null },
      ]
    },
    orderBy: [
      { country: "desc" },
      { createdAt: "desc" }
    ]
  });

  if (!factor) {
    throw new Error(`No emission factor found for ${activity.category}`);
  }

  const co2eKg = activity.quantity * factor.factor;

  const result = await prisma.calculation.create({
    data: {
      universityId: activity.universityId,
      reportingPeriodId: activity.reportingPeriodId,
      activityDataId: activity.id,
      emissionFactorId: factor.id,
      scope: activity.scope,
      quantity: activity.quantity,
      activityUnit: activity.unit,
      emissionFactor: factor.factor,
      factorUnit: factor.unit,
      co2eKg,
      status: "CALCULATED",
    }
  });

  await logEvent(
    AuditAction.CALCULATE,
    "Calculation",
    result.id,
    null,
    activity.universityId,
    null,
    result,
    "Calculation created"
  );

  return result;
};

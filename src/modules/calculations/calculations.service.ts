import { prisma } from "../../config/prisma";
import { createAuditLog } from "../auditLogs/auditLogs.service";
import { AuditAction } from "../../generated/prisma/client";
import { getEmissionFactor } from "../emissionFactors/ef.resolver";
import { convertToEmissionFactorUnit, getCo2eMultiplier } from "./unitConversion";

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

  // Determine the year for EF lookup from the activity date or reporting period
  const activityYear = activity.activityDate
    ? new Date(activity.activityDate).getFullYear()
    : new Date(period.startDate).getFullYear();

  // Determine country from activity's campus country or university default
  const country = activity.university.country ?? "IN";

  // ── EF Resolver: Fixed → Cache → Climatiq → PENDING ──────────
  let resolvedFactor: Awaited<ReturnType<typeof getEmissionFactor>>;
  try {
    resolvedFactor = await getEmissionFactor({
      category: activity.category,
      country,
      year: activityYear,
      activityUnit: activity.unit
    });
  } catch (err: any) {
    // Structured PENDING error from resolver
    if (err?.status === "PENDING") {
      await prisma.activityData.update({
        where: { id: activityId },
        data: { status: "DRAFT" } // revert so it can be re-submitted after EF is available
      });
      throw new Error(err.message ?? "No emission factor available for this activity");
    }
    throw err;
  }

  let convertedQuantity: number;
  try {
    convertedQuantity = convertToEmissionFactorUnit(
      activity.quantity,
      activity.unit,
      resolvedFactor.unit,
      activity.category
    );
  } catch (err: any) {
    if (err.message.includes("PENDING")) {
      await prisma.activityData.update({
        where: { id: activityId },
        data: { status: "DRAFT" }
      });
      throw new Error(err.message);
    }
    throw err;
  }

  const multiplier = getCo2eMultiplier(resolvedFactor.unit);
  const co2eKg = convertedQuantity * resolvedFactor.factor * multiplier;

  // ── Save Calculation with factor snapshot ──────────────────────
  const result = await prisma.calculation.create({
    data: {
      universityId: activity.universityId,
      reportingPeriodId: activity.reportingPeriodId,
      activityDataId: activity.id,
      emissionFactorId: resolvedFactor.id,
      scope: activity.scope,
      quantity: activity.quantity,
      activityUnit: activity.unit,
      emissionFactor: resolvedFactor.factor,
      factorUnit: resolvedFactor.unit,
      factorSource: resolvedFactor.source,
      factorVersion: resolvedFactor.sourceVersion ?? null,
      factorName: resolvedFactor.factorName,
      co2eKg,
      status: "CALCULATED",
    }
  });
  const efAction = resolvedFactor.source.toLowerCase() === "climatiq" 
    ? AuditAction.EF_RESOLVED_CLIMATIQ 
    : AuditAction.EF_RESOLVED_FIXED;

  await createAuditLog({
    action: efAction,
    entityType: "EmissionFactor",
    entityId: resolvedFactor.id,
    universityId: activity.universityId,
    metadata: { factor: resolvedFactor.factor, source: resolvedFactor.source },
    description: `Emission factor selected (${resolvedFactor.source})`
  });

  await createAuditLog({
    action: AuditAction.CALCULATION_CREATED,
    entityType: "Calculation",
    entityId: result.id,
    universityId: activity.universityId,
    metadata: { co2eKg },
    description: "Calculation created"
  });
  
  await prisma.activityData.update({
    where: { id: activityId },
    data: { status: "CALCULATED" }
  });

  await createAuditLog({
    action: AuditAction.ACTIVITY_CALCULATED,
    entityType: "ActivityData",
    entityId: activity.id,
    universityId: activity.universityId,
    description: "Activity calculation completed"
  });

  return result;
};

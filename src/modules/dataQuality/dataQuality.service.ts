import { prisma } from "../../config/prisma";

export const getDataQualityMetrics = async (universityId: string, filters?: {
  reportingPeriodId?: string;
  campusId?: string;
  buildingId?: string;
  scope?: string;
  category?: string;
}) => {
  const where: any = { universityId };
  if (filters?.reportingPeriodId) where.reportingPeriodId = filters.reportingPeriodId;
  if (filters?.scope) where.scope = filters.scope;
  if (filters?.category) where.category = filters.category;

  const [
    total,
    verified,
    draft,
    needsReview,
    submitted,
    rejected,
    calculated,
  ] = await Promise.all([
    prisma.activityData.count({ where }),
    prisma.activityData.count({ where: { ...where, status: "VERIFIED" } }),
    prisma.activityData.count({ where: { ...where, status: "DRAFT" } }),
    prisma.activityData.count({ where: { ...where, status: "UNDER_REVIEW" } }),
    prisma.activityData.count({ where: { ...where, status: "SUBMITTED" } }),
    prisma.activityData.count({ where: { ...where, status: "REJECTED" } }),
    prisma.activityData.count({ where: { ...where, status: "CALCULATED" } }),
  ]);

  // Missing quantity
  const missingQuantity = await prisma.activityData.count({
    where: { ...where, OR: [{ quantity: null }, { quantity: 0 }] }
  });

  // Missing unit
  const missingUnit = await prisma.activityData.count({
    where: { ...where, OR: [{ unit: null }, { unit: "" }] }
  });

  // Missing date
  const missingDate = await prisma.activityData.count({
    where: { ...where, activityDate: null }
  });

  // Verified but no Calculation
  const uncalculated = await prisma.activityData.count({
    where: {
      ...where,
      status: "VERIFIED",
      calculations: { none: {} }
    }
  });

  // Missing EF (verified but calculation PENDING or FAILED)
  const missingEF = await prisma.activityData.count({
    where: {
      ...where,
      status: "VERIFIED",
      calculations: { none: {} }
    }
  });

  // Duplicates (activities with POSSIBLE_DUPLICATE prefix in description)
  const duplicates = await prisma.activityData.count({
    where: {
      ...where,
      description: { startsWith: "POSSIBLE_DUPLICATE" }
    }
  });

  // Document coverage: Activities that have a linked document
  const withDocument = await prisma.activityData.count({
    where: { ...where, documentId: { not: null } }
  });

  // Verification rate
  const verificationRate = total > 0 ? Number(((verified + calculated) / total * 100).toFixed(1)) : 0;

  // Calculation coverage
  const calculationCoverage = verified > 0 ? Number((calculated / verified * 100).toFixed(1)) : 0;

  // Document coverage  
  const documentCoverage = total > 0 ? Number((withDocument / total * 100).toFixed(1)) : 0;

  // Quality Score formula: weighted average of completeness indicators
  // = 40% verification rate + 30% calculation coverage + 20% doc coverage + 10% no duplicates
  const noDuplicateScore = total > 0 ? ((total - duplicates) / total) * 100 : 100;
  const qualityScore = Math.round(
    (verificationRate * 0.4) + 
    (calculationCoverage * 0.3) + 
    (documentCoverage * 0.2) +
    (noDuplicateScore * 0.1)
  );

  const issues: { key: string; label: string; count: number }[] = [];
  if (missingQuantity > 0) issues.push({ key: "missingQuantity", label: "Missing Quantity", count: missingQuantity });
  if (missingUnit > 0) issues.push({ key: "missingUnit", label: "Missing Unit", count: missingUnit });
  if (missingDate > 0) issues.push({ key: "missingDate", label: "Missing Activity Date", count: missingDate });
  if (needsReview > 0 || submitted > 0) issues.push({ key: "unverified", label: "Unverified Activities", count: needsReview + submitted + draft });
  if (uncalculated > 0) issues.push({ key: "uncalculated", label: "Uncalculated Activities", count: uncalculated });
  if (duplicates > 0) issues.push({ key: "duplicates", label: "Possible Duplicates", count: duplicates });

  return {
    summary: {
      total,
      verified,
      draft,
      submitted,
      needsReview,
      rejected,
      calculated,
    },
    issues,
    coverage: {
      verification: { verified: verified + calculated, total, rate: verificationRate },
      calculation: { calculated, verified, rate: calculationCoverage },
      document: { withDocument, total, rate: documentCoverage },
    },
    qualityScore,
    missingEF,
    duplicates,
  };
};

export const getDataQualityOverview = async (universityId: string, reportingPeriodId?: string) => {
  return getDataQualityMetrics(universityId, reportingPeriodId ? { reportingPeriodId } : undefined);
};

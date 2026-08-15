import { prisma } from "../../config/prisma";

export const getDataQualityMetrics = async (universityId: string) => {
  const [
    total,
    verified,
    draft,
    needsReview,
    rejected
  ] = await Promise.all([
    prisma.activityData.count({ where: { universityId } }),
    prisma.activityData.count({ where: { universityId, status: "VERIFIED" } }),
    prisma.activityData.count({ where: { universityId, status: "DRAFT" } }),
    prisma.activityData.count({ where: { universityId, status: "UNDER_REVIEW" } }),
    prisma.activityData.count({ where: { universityId, status: "REJECTED" } }),
  ]);

  // To find missing EF, we look for activities that are VERIFIED but have no related calculation
  // Or calculation status = FAILED
  const missingEF = await prisma.activityData.count({
    where: {
      universityId,
      status: "VERIFIED",
      calculations: { none: {} }
    }
  });

  // To find duplicates, we can look for descriptions starting with 'POSSIBLE_DUPLICATE' 
  // as implemented in our activityData.service.ts
  const duplicates = await prisma.activityData.count({
    where: {
      universityId,
      description: {
        startsWith: "POSSIBLE_DUPLICATE"
      }
    }
  });

  return {
    total,
    verified,
    draft,
    needsReview,
    rejected,
    missingEF,
    duplicates
  };
};

export const getDataQualityOverview = async (universityId: string, _reportingPeriodId?: string) => {
  return getDataQualityMetrics(universityId);
};

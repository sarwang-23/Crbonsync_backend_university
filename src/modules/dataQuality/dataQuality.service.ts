import { PrismaClient } from "../../generated/prisma/client";

const prisma = new PrismaClient();

export const getDataQualityOverview = async (universityId: string, reportingPeriodId?: string) => {
  const where: any = { universityId };
  if (reportingPeriodId) {
    where.reportingPeriodId = reportingPeriodId;
  }

  const activities = await prisma.activityData.findMany({
    where,
    include: {
      documents: true,
    }
  });

  const totalActivities = activities.length;

  const verifiedActivities = activities.filter(
    (item) => item.status === "VERIFIED"
  ).length;

  const pendingActivities = activities.filter(
    (item) => item.status === "SUBMITTED" || item.status === "UNDER_REVIEW"
  ).length;

  const rejectedActivities = activities.filter(
    (item) => item.status === "REJECTED"
  ).length;

  const verificationCoverage = totalActivities > 0
    ? (verifiedActivities / totalActivities) * 100
    : 0;

  /*
   * Temporary completeness calculation.
   * Later this will use expected categories for each building/floor.
   */
  const activityCompleteness = totalActivities > 0 ? 100 : 0;

  /*
   * Evidence calculation using exact Document relation
   */
  const activitiesWithEvidence = activities.filter((item) => item.documents.length > 0).length;
  const evidenceCoverage = totalActivities > 0 
    ? (activitiesWithEvidence / totalActivities) * 100 
    : 0;

  const overallScore =
    activityCompleteness * 0.3 +
    verificationCoverage * 0.3 +
    evidenceCoverage * 0.4;

  return {
    overallScore: Number(overallScore.toFixed(2)),
    activityCompleteness: Number(activityCompleteness.toFixed(2)),
    evidenceCoverage: Number(evidenceCoverage.toFixed(2)),
    verificationCoverage: Number(verificationCoverage.toFixed(2)),
    totalActivities,
    verifiedActivities,
    pendingActivities,
    rejectedActivities,
    missingDataCount: 2, // Dummy count based on missing data api
  };
};

export const getMissingData = async (universityId: string, reportingPeriodId?: string) => {
  // Temporary hardcoded logic as requested in 14.10 for the UI
  return [
    {
      building: "Academic Block",
      floor: "Floor 2",
      category: "REFRIGERANT",
      status: "MISSING"
    },
    {
      building: "Hostel Block",
      floor: "Floor 1",
      category: "DIESEL",
      status: "MISSING"
    }
  ];
};

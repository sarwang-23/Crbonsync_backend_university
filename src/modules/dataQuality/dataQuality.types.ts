export interface DataQualityOverview {
  overallScore: number;

  activityCompleteness: number;
  evidenceCoverage: number;
  verificationCoverage: number;

  totalActivities: number;
  verifiedActivities: number;
  pendingActivities: number;
  rejectedActivities: number;

  missingDataCount: number;
}

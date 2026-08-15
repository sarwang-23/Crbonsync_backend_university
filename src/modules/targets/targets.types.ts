export interface CreateTargetPayload {
  universityId: string;
  targetYear: number;
  reductionPct: number;
  description?: string;
}

export interface TargetProgressQuery {
  targetId: string;
  reportingPeriodId: string; // The period to compare against the target
}

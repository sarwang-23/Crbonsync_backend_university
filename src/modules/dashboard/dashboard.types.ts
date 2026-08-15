export interface OverviewQuery {
  universityId: string;
  reportingPeriodId: string;
}

export interface BuildingQuery {
  buildingId: string;
}

export interface MonthlyTrend {
  month: string;
  scope1TCO2e: number;
  scope2TCO2e: number;
  totalTCO2e: number;
}

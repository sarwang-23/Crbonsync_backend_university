import { ActivityCategory, ActivityScope } from "../../generated/prisma/client";

export interface CreateActivityDataInput {
  universityId: string;
  reportingPeriodId: string;
  campusId?: string;
  buildingId?: string;
  floorId?: string;
  category: ActivityCategory;
  scope: ActivityScope;
  quantity: number;
  unit: string;
  activityDate: Date;
  description?: string;
}

export interface ActivityDataFilterParams {
  universityId: string;
  reportingPeriodId?: string;
  campusId?: string;
  buildingId?: string;
  floorId?: string;
  scope?: ActivityScope;
  category?: ActivityCategory;
  status?: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

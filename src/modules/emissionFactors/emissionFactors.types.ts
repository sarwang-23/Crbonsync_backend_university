import { ActivityCategory, ActivityScope, EmissionFactorSource, EmissionFactorStatus } from "../../generated/prisma/client";

export interface CreateEmissionFactorInput {
  name: string;
  category: ActivityCategory;
  scope: ActivityScope;
  factor: number;
  unit: string;
  source: EmissionFactorSource;
  sourceName?: string;
  sourceVersion?: string;
  sourceUrl?: string;
  country?: string;
  region?: string;
  validFrom?: string;
  validTo?: string;
  notes?: string;
}

export interface UpdateEmissionFactorInput {
  name?: string;
  category?: ActivityCategory;
  scope?: ActivityScope;
  factor?: number;
  unit?: string;
  source?: EmissionFactorSource;
  sourceName?: string;
  sourceVersion?: string;
  sourceUrl?: string;
  country?: string;
  region?: string;
  validFrom?: string;
  validTo?: string;
  status?: EmissionFactorStatus;
  notes?: string;
}

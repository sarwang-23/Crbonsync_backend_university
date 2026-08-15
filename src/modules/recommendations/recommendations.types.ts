import { RecommendationPriority } from "../../generated/prisma/client";

export interface RecommendationQuery {
  universityId: string;
}

export interface RecommendationPayload {
  universityId: string;
  buildingId?: string;
  category: string;
  title: string;
  description: string;
  priority: RecommendationPriority;
  estimatedReductionKg?: number;
}

import { prisma } from "../../config/prisma";
import { recommendationEngine } from "./recommendations.engine";
import { RecommendationPayload, RecommendationQuery } from "./recommendations.types";
import { getIntensityMetrics, getCategoryBreakdown } from "../dashboard/dashboard.service";
import { getDataQualityOverview } from "../dataQuality/dataQuality.service";

export class RecommendationsService {
  async getRecommendations(query: RecommendationQuery) {
    const { universityId } = query;
    return prisma.recommendation.findMany({
      where: { universityId },
      orderBy: { priority: "desc" }
    });
  }

  async generateRecommendations(universityId: string, reportingPeriodId: string) {
    // 1. Gather context data
    const intensity = await getIntensityMetrics(universityId, reportingPeriodId);
    
    const categories = await getCategoryBreakdown(universityId, reportingPeriodId);
    const scope1Categories = categories
      .filter(c => c.scope === "SCOPE_1")
      .map(c => ({ category: c.category, tCO2e: c.tonnesCO2e }));

    const dq = await getDataQualityOverview(universityId, reportingPeriodId);
    
    const contextData = {
      universityId,
      intensity,
      scope1Categories,
      dataQuality: dq
    };

    // 2. Evaluate rules
    const newRecommendations = recommendationEngine.evaluateRules(contextData);

    // 3. Persist non-duplicate recommendations
    for (const rec of newRecommendations) {
      const existing = await prisma.recommendation.findFirst({
        where: {
          universityId: rec.universityId,
          title: rec.title,
          status: "OPEN"
        }
      });

      if (!existing) {
        await prisma.recommendation.create({
          data: {
            ...rec,
            status: "OPEN"
          }
        });
      }
    }

    // 4. Return all open recommendations
    return prisma.recommendation.findMany({
      where: { universityId, status: "OPEN" },
      orderBy: { priority: "desc" }
    });
  }
}

export const recommendationsService = new RecommendationsService();

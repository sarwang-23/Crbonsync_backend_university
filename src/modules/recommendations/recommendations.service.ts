import { prisma } from "../../config/prisma";
import { recommendationEngine } from "./recommendations.engine";
import { RecommendationPayload, RecommendationQuery } from "./recommendations.types";
import { getIntensityMetrics, getCategoryBreakdown } from "../dashboard/dashboard.service";
import { getDataQualityOverview } from "../dataQuality/dataQuality.service";

export class RecommendationsService {
  async getRecommendations(query: RecommendationQuery & { priority?: string; category?: string; status?: string }) {
    const { universityId, priority, category, status } = query;
    const where: any = { universityId };
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (status) where.status = status;
    else where.status = { not: "DISMISSED" }; // Default: hide dismissed

    return prisma.recommendation.findMany({
      where,
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" }
      ]
    });
  }

  async getRecommendationById(id: string) {
    return prisma.recommendation.findUnique({ where: { id } });
  }

  async updateRecommendationStatus(id: string, status: string) {
    const validStatuses = ["NEW", "IN_PROGRESS", "COMPLETED", "DISMISSED"];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }
    return prisma.recommendation.update({
      where: { id },
      data: { status }
    });
  }

  async generateRecommendations(universityId: string, reportingPeriodId: string) {
    // 1. Gather context data
    const intensity = await getIntensityMetrics(universityId, reportingPeriodId);
    const categories = await getCategoryBreakdown(universityId, reportingPeriodId);
    const scope1Categories = categories
      .filter((c: any) => c.scope === "SCOPE_1")
      .map((c: any) => ({ category: c.category, tCO2e: c.tonnesCO2e }));

    const dq = await getDataQualityOverview(universityId, reportingPeriodId);

    // Category totals for emission share
    const totalEmissions = categories.reduce((sum: number, c: any) => sum + c.tonnesCO2e, 0);
    const categoryMap: Record<string, { tCO2e: number; pct: number }> = {};
    for (const c of categories) {
      categoryMap[c.category] = {
        tCO2e: c.tonnesCO2e,
        pct: totalEmissions > 0 ? (c.tonnesCO2e / totalEmissions) * 100 : 0
      };
    }

    const contextData = {
      universityId,
      intensity,
      scope1Categories,
      dataQuality: dq,
      categoryMap,
      totalEmissions
    };

    // 2. Evaluate rules
    const newRecommendations = recommendationEngine.evaluateRules(contextData);

    // 3. Persist non-duplicate recommendations
    for (const rec of newRecommendations) {
      const existing = await prisma.recommendation.findFirst({
        where: {
          universityId: rec.universityId,
          title: rec.title,
          status: { in: ["NEW", "OPEN", "IN_PROGRESS"] }
        }
      });

      if (!existing) {
        await prisma.recommendation.create({
          data: { ...rec, status: "NEW" }
        });
      }
    }

    // 4. Return all active recommendations
    return prisma.recommendation.findMany({
      where: { universityId, status: { not: "DISMISSED" } },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }]
    });
  }
}

export const recommendationsService = new RecommendationsService();

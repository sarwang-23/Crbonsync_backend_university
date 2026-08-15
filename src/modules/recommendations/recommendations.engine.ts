import { RecommendationPayload } from "./recommendations.types";

export class RecommendationEngine {
  evaluateRules(data: any): RecommendationPayload[] {
    const recommendations: RecommendationPayload[] = [];
    
    // Sample rule-based evaluation

    // 1. High electricity intensity
    if (data.intensity && data.intensity.electricityKwhPerSqm > 150) {
      recommendations.push({
        universityId: data.universityId,
        category: "ENERGY",
        title: "HVAC Optimization required",
        description: "Electricity consumption is unusually high per sqm. Consider an energy audit for HVAC systems.",
        priority: "HIGH",
        estimatedReductionKg: 10000 // Mock value
      });
    }

    // 2. High diesel consumption
    if (data.scope1Categories) {
      const dieselCat = data.scope1Categories.find((c: any) => c.category === "DIESEL_CONSUMPTION");
      if (dieselCat && dieselCat.tCO2e > 50) {
        recommendations.push({
          universityId: data.universityId,
          category: "EMISSIONS",
          title: "Generator efficiency review",
          description: "High diesel consumption detected. Review backup generator efficiency or switch to cleaner alternatives.",
          priority: "MEDIUM",
          estimatedReductionKg: 5000
        });
      }
    }

    // 3. Data quality is low
    if (data.dataQuality && data.dataQuality.score < 80) {
      recommendations.push({
        universityId: data.universityId,
        category: "DATA_QUALITY",
        title: "Data completion reminder",
        description: "Data quality score is below 80%. Ensure all activity data is properly verified and documented.",
        priority: "MEDIUM",
      });
    }

    // Add more rules as needed...

    return recommendations;
  }
}

export const recommendationEngine = new RecommendationEngine();

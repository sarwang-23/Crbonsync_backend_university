import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import { CreateTargetPayload, TargetProgressQuery } from "./targets.types";

export class TargetsService {
  async createTarget(data: CreateTargetPayload) {
    const baseline = await prisma.baseline.findFirst({
      where: { universityId: data.universityId, status: "APPROVED" },
      orderBy: { baselineYear: "desc" }
    });

    if (!baseline) {
      throw new AppError("No approved baseline found for this university. Target requires a baseline.", 400);
    }

    const baselineTCO2e = baseline.totalKgCO2e / 1000;
    const reductionAmount = baselineTCO2e * (data.reductionPct / 100);
    const targetTCO2e = baselineTCO2e - reductionAmount;
    
    // Store in kg internally
    const targetCo2eKg = targetTCO2e * 1000;

    const target = await prisma.sustainabilityTarget.create({
      data: {
        universityId: data.universityId,
        targetYear: data.targetYear,
        reductionPct: data.reductionPct,
        targetCo2eKg: targetCo2eKg,
        description: data.description,
        status: "ACTIVE"
      }
    });

    return target;
  }

  async getTargetProgress(query: TargetProgressQuery) {
    const target = await prisma.sustainabilityTarget.findUnique({
      where: { id: query.targetId }
    });

    if (!target) throw new AppError("Target not found", 404);

    const baseline = await prisma.baseline.findFirst({
      where: { universityId: target.universityId, status: "APPROVED" },
      orderBy: { baselineYear: "desc" }
    });

    if (!baseline) throw new AppError("Approved baseline not found", 404);

    const currentPeriod = await prisma.reportingPeriod.findUnique({
      where: { id: query.reportingPeriodId }
    });

    if (!currentPeriod) throw new AppError("Reporting period not found", 404);

    const currentCalcs = await prisma.calculation.findMany({
      where: {
        activityData: {
          reportingPeriodId: currentPeriod.id,
          status: "VERIFIED"
        }
      }
    });

    let currentKg = 0;
    currentCalcs.forEach(c => currentKg += c.co2eKg);

    const baselineTCO2e = baseline.totalKgCO2e / 1000;
    const targetTCO2e = (target.targetCo2eKg || 0) / 1000;
    const currentTCO2e = currentKg / 1000;

    const achievedReductionTCO2e = baselineTCO2e - currentTCO2e;
    const requiredReductionTCO2e = baselineTCO2e - targetTCO2e;

    const progressPercent = requiredReductionTCO2e > 0 
      ? (achievedReductionTCO2e / requiredReductionTCO2e) * 100 
      : 0;

    return {
      baselineTCO2e: Number(baselineTCO2e.toFixed(2)),
      targetTCO2e: Number(targetTCO2e.toFixed(2)),
      currentTCO2e: Number(currentTCO2e.toFixed(2)),
      achievedReductionTCO2e: Number(achievedReductionTCO2e.toFixed(2)),
      requiredReductionTCO2e: Number(requiredReductionTCO2e.toFixed(2)),
      progressPercent: Number(progressPercent.toFixed(2))
    };
  }

  async getTargets(universityId: string) {
    return prisma.sustainabilityTarget.findMany({
      where: { universityId },
      orderBy: { targetYear: 'asc' }
    });
  }
}

export const targetsService = new TargetsService();

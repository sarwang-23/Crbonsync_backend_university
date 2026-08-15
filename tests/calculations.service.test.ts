import { calculateActivity } from "../src/modules/calculations/calculations.service";
import { prismaMock } from "./prisma.mock";
import { getEmissionFactor } from "../src/modules/emissionFactors/ef.resolver";

jest.mock("../src/modules/emissionFactors/ef.resolver", () => ({
  getEmissionFactor: jest.fn(),
}));

describe("Calculation Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Test 1 - Should calculate successfully with mock EF", async () => {
    const mockActivity: any = {
      id: "act-1",
      universityId: "uni-1",
      reportingPeriodId: "rp-1",
      category: "PURCHASED_ELECTRICITY",
      quantity: 10000,
      unit: "kWh",
      status: "VERIFIED",
      activityDate: new Date("2026-08-01"),
      scope: "SCOPE_2",
      university: { country: "IN" },
      reportingPeriod: {
        status: "ACTIVE",
        universityId: "uni-1"
      }
    };

    prismaMock.activityData.findUnique.mockResolvedValue(mockActivity);

    // Mock resolved EF
    (getEmissionFactor as jest.Mock).mockResolvedValue({
      id: "ef-1",
      factor: 0.7117,
      unit: "kgCO2e/kWh",
      source: "CEA",
      sourceVersion: "V21.0",
      factorName: "CEA Grid Factor"
    });

    prismaMock.calculation.create.mockResolvedValue({
      id: "calc-1",
      universityId: "uni-1",
      reportingPeriodId: "rp-1",
      activityDataId: "act-1",
      emissionFactorId: "ef-1",
      scope: "SCOPE_2",
      quantity: 10000,
      activityUnit: "kWh",
      emissionFactor: 0.7117,
      factorUnit: "kgCO2e/kWh",
      factorSource: "CEA",
      factorVersion: "V21.0",
      factorName: "CEA Grid Factor",
      co2eKg: 7117,
      status: "CALCULATED",
      createdAt: new Date(),
      updatedAt: new Date(),
      calculatedAt: new Date()
    });

    // Mock Audit Log
    prismaMock.auditLog.create.mockResolvedValue({} as any);

    const result = await calculateActivity("act-1");

    expect(result.co2eKg).toBe(7117);
    expect(result.status).toBe("CALCULATED");
    expect(prismaMock.calculation.create).toHaveBeenCalled();
    expect(prismaMock.activityData.update).toHaveBeenCalledWith({
      where: { id: "act-1" },
      data: { status: "CALCULATED" }
    });
  });

  it("Test 2 - Should reject calculation for DRAFT activity", async () => {
    const mockActivity: any = {
      id: "act-2",
      universityId: "uni-1",
      status: "DRAFT",
    };

    prismaMock.activityData.findUnique.mockResolvedValue(mockActivity);

    await expect(calculateActivity("act-2")).rejects.toThrow("Only VERIFIED activity data can be calculated");
  });

  it("Test 3 - Should reject calculation for LOCKED reporting period", async () => {
    const mockActivity: any = {
      id: "act-3",
      universityId: "uni-1",
      status: "VERIFIED",
      reportingPeriod: {
        status: "LOCKED",
        universityId: "uni-1"
      }
    };

    prismaMock.activityData.findUnique.mockResolvedValue(mockActivity);

    await expect(calculateActivity("act-3")).rejects.toThrow("Reporting period is locked");
  });
});

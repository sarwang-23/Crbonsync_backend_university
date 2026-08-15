import { getEmissionFactor } from "../src/modules/emissionFactors/ef.resolver";
import { prismaMock } from "./prisma.mock";
import { ActivityCategory } from "../src/generated/prisma/client";

// Mock fetch
global.fetch = jest.fn();

describe("EF Resolver", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("Test 1 - Should resolve Fixed EF (e.g. CEA)", async () => {
    prismaMock.emissionFactor.findFirst.mockResolvedValue({
      id: "ef-1",
      name: "CEA EF",
      category: "PURCHASED_ELECTRICITY",
      scope: "SCOPE_2",
      factor: 0.7117,
      unit: "kgCO2e/kWh",
      source: "CEA",
      sourceName: "CEA",
      sourceVersion: "2026",
      country: "IN",
      year: 2026,
      isFixed: true,
      status: "ACTIVE",
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date()
    } as any);

    const result = await getEmissionFactor({
      category: "PURCHASED_ELECTRICITY",
      country: "IN",
      year: 2026,
      activityUnit: "kWh"
    });

    expect(result.source).toBe("CEA");
    expect(result.factor).toBe(0.7117);
    expect(prismaMock.emissionFactor.findFirst).toHaveBeenCalled();
  });

  it("Test 2 - Should resolve Diesel EF from INCCA", async () => {
    prismaMock.emissionFactor.findFirst.mockResolvedValue({
      id: "ef-2",
      name: "INCCA Diesel",
      category: "DIESEL",
      scope: "SCOPE_1",
      factor: 2.68,
      unit: "kgCO2e/L",
      source: "INCCA",
      sourceName: "INCCA",
      sourceVersion: null,
      country: "IN",
      year: 2026,
      isFixed: true,
      status: "ACTIVE",
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date()
    } as any);

    const result = await getEmissionFactor({
      category: "DIESEL",
      country: "IN",
      year: 2026,
      activityUnit: "L"
    });

    expect(result.source).toBe("INCCA");
    expect(result.factor).toBe(2.68);
  });

  it("Test 3 - Should resolve from Cache if Fixed EF is unavailable", async () => {
    // No fixed EF
    prismaMock.emissionFactor.findFirst.mockResolvedValueOnce(null);
    
    // Cache available
    prismaMock.climatiqCache.findFirst.mockResolvedValue({
      id: "cache-1",
      category: "REFRIGERANT",
      country: "IN",
      year: 2026,
      factor: 5.5,
      unit: "kgCO2e/kg",
      climatiqId: "climatiq-1",
      climatiqVersion: "1.0",
      fetchedAt: new Date()
    });

    // Fetched EF from DB
    prismaMock.emissionFactor.findFirst.mockResolvedValueOnce({
      id: "ef-dynamic-1",
      name: "Climatiq EF",
      category: "REFRIGERANT",
      scope: "SCOPE_1",
      factor: 5.5,
      unit: "kgCO2e/kg",
      source: "CLIMATIQ",
      sourceName: "Climatiq API",
      sourceVersion: "1.0",
      country: "IN",
      year: 2026,
      isFixed: false,
      status: "ACTIVE",
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date()
    } as any);

    const result = await getEmissionFactor({
      category: "REFRIGERANT",
      country: "IN",
      year: 2026,
      activityUnit: "kg"
    });

    expect(result.source).toBe("Climatiq");
    expect(result.factor).toBe(5.5);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("Test 4 - Should call Climatiq API if Cache is unavailable and CLIMATIQ_API_KEY is set", async () => {
    // Mock environment
    process.env.CLIMATIQ_API_KEY = "test-key";

    // No fixed, no cache
    prismaMock.emissionFactor.findFirst.mockResolvedValueOnce(null);
    prismaMock.climatiqCache.findFirst.mockResolvedValue(null);

    // Mock API response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        co2e: 10.5,
        co2e_unit: "kgCO2e",
        emission_factor: {
          unit: "kg",
          activity_id: "climatiq-test-id",
          source_version: "2.0"
        }
      })
    });

    // Mock EF creation
    prismaMock.emissionFactor.findFirst.mockResolvedValueOnce(null); // existingDynamic check
    prismaMock.emissionFactor.create.mockResolvedValue({
      id: "ef-new",
      name: "Climatiq EF",
      category: "REFRIGERANT",
      scope: "SCOPE_1",
      factor: 10.5,
      unit: "kgCO2e/kg",
      source: "CLIMATIQ",
      sourceName: "Climatiq API",
      sourceVersion: "2.0",
      country: "IN",
      year: 2026,
      isFixed: false,
      status: "ACTIVE",
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date()
    } as any);

    const result = await getEmissionFactor({
      category: "REFRIGERANT",
      country: "IN",
      year: 2026,
      activityUnit: "kg"
    });

    expect(global.fetch).toHaveBeenCalled();
    expect(prismaMock.climatiqCache.upsert).toHaveBeenCalled();
    expect(prismaMock.emissionFactor.create).toHaveBeenCalled();
    expect(result.factor).toBe(10.5);
    expect(result.source).toBe("Climatiq");
  });

  it("Test 5 - Should throw PENDING error if everything is unavailable", async () => {
    // Remove key
    delete process.env.CLIMATIQ_API_KEY;

    prismaMock.emissionFactor.findFirst.mockResolvedValue(null);
    prismaMock.climatiqCache.findFirst.mockResolvedValue(null);

    await expect(getEmissionFactor({
      category: "REFRIGERANT",
      country: "IN",
      year: 2026,
      activityUnit: "kg"
    })).rejects.toMatchObject({
      status: "PENDING"
    });
  });
});

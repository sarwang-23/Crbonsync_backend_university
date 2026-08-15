import { prisma } from "../../config/prisma";
import { CreateEmissionFactorInput, UpdateEmissionFactorInput } from "./emissionFactors.types";

export const createEmissionFactor = async (data: CreateEmissionFactorInput) => {
  return prisma.emissionFactor.create({
    data: {
      name: data.name,
      category: data.category,
      scope: data.scope,
      factor: data.factor,
      unit: data.unit,
      source: data.source,
      sourceName: data.sourceName,
      sourceVersion: data.sourceVersion,
      sourceUrl: data.sourceUrl,
      country: data.country,
      region: data.region,
      validFrom: data.validFrom ? new Date(data.validFrom) : null,
      validTo: data.validTo ? new Date(data.validTo) : null,
      notes: data.notes,
    }
  });
};

export const getEmissionFactors = async (filters: {
  category?: any;
  scope?: any;
  country?: string;
  region?: string;
  status?: any;
  page?: number;
  limit?: number;
}) => {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (filters.category) where.category = filters.category;
  if (filters.scope) where.scope = filters.scope;
  if (filters.country) where.country = filters.country;
  if (filters.region) where.region = filters.region;
  if (filters.status) where.status = filters.status;

  const [data, total] = await Promise.all([
    prisma.emissionFactor.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" }
    }),
    prisma.emissionFactor.count({ where })
  ]);

  return {
    data,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  };
};

export const getEmissionFactorById = async (id: string) => {
  const factor = await prisma.emissionFactor.findUnique({
    where: { id }
  });

  if (!factor) {
    throw new Error("Emission factor not found");
  }

  return factor;
};

export const updateEmissionFactor = async (id: string, data: UpdateEmissionFactorInput) => {
  const factor = await getEmissionFactorById(id);

  return prisma.emissionFactor.update({
    where: { id },
    data: {
      name: data.name,
      category: data.category,
      scope: data.scope,
      factor: data.factor,
      unit: data.unit,
      source: data.source,
      sourceName: data.sourceName,
      sourceVersion: data.sourceVersion,
      sourceUrl: data.sourceUrl,
      country: data.country,
      region: data.region,
      validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
      validTo: data.validTo ? new Date(data.validTo) : undefined,
      notes: data.notes,
      status: data.status,
    }
  });
};

export const deactivateEmissionFactor = async (id: string) => {
  const factor = await getEmissionFactorById(id);

  return prisma.emissionFactor.update({
    where: { id },
    data: {
      status: "INACTIVE"
    }
  });
};

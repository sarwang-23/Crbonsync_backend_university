import { prisma } from "../../config/prisma";
import { CreateAssetInput, UpdateAssetInput } from "./assets.validator";
import { Prisma } from "../../generated/prisma/client";

export const createAsset = async (data: CreateAssetInput) => {
  const floor = await prisma.floor.findUnique({
    where: { id: data.floorId },
  });

  if (!floor) {
    throw new Error("Floor not found");
  }

  const existingAsset = await prisma.asset.findUnique({
    where: {
      floorId_code: {
        floorId: data.floorId,
        code: data.code,
      },
    },
  });

  if (existingAsset) {
    throw new Error("Asset with this code already exists on this floor");
  }

  return prisma.asset.create({ data });
};

export const getAssets = async (params: {
  page: number;
  limit: number;
  search?: string;
  floorId?: string;
  type?: string;
  status?: string;
}) => {
  const { page, limit, search, floorId, type, status } = params;
  const skip = Math.max(0, (page - 1) * limit);

  const where: any = {
    ...(floorId ? { floorId } : {}),
    ...(type ? { type } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [assets, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        floor: {
          select: {
            id: true,
            name: true,
            code: true,
            building: {
              select: { id: true, name: true, code: true },
            },
          },
        },
      },
    }),
    prisma.asset.count({ where }),
  ]);

  return {
    assets,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getAssetById = async (id: string) => {
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      floor: {
        include: {
          building: {
            include: {
              campus: {
                include: {
                  university: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!asset) {
    throw new Error("Asset not found");
  }

  return asset;
};

export const updateAsset = async (id: string, data: UpdateAssetInput) => {
  const existing = await prisma.asset.findUnique({ where: { id } });

  if (!existing) {
    throw new Error("Asset not found");
  }

  if (data.code && data.code !== existing.code) {
    const duplicate = await prisma.asset.findUnique({
      where: {
        floorId_code: {
          floorId: existing.floorId,
          code: data.code,
        },
      },
    });

    if (duplicate) {
      throw new Error("Asset with this code already exists on this floor");
    }
  }

  return prisma.asset.update({
    where: { id },
    data,
  });
};

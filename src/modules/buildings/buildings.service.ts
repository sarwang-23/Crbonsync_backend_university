import { prisma } from "../../config/prisma";
import { CreateBuildingInput, UpdateBuildingInput } from "./buildings.validator";
import { Prisma } from "../../generated/prisma/client";

export const createBuilding = async (data: CreateBuildingInput) => {
  const campus = await prisma.campus.findUnique({ where: { id: data.campusId } });
  if (!campus) {
    throw new Error("Campus not found");
  }

  const existingBuilding = await prisma.building.findUnique({
    where: {
      campusId_code: {
        campusId: data.campusId,
        code: data.code,
      },
    },
  });

  if (existingBuilding) {
    throw new Error("Building with this code already exists in this campus");
  }

  return await prisma.building.create({ data });
};

export const getBuildings = async (params: {
  page: number;
  limit: number;
  search?: string;
  campusId?: string;
}) => {
  const { page, limit, search, campusId } = params;
  const skip = Math.max(0, (page - 1) * limit);

  const where: Prisma.BuildingWhereInput = {
    ...(campusId ? { campusId } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [buildings, total] = await Promise.all([
    prisma.building.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        campus: {
          select: {
            id: true,
            name: true,
            code: true,
            university: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        _count: {
          select: {
            floors: true,
          },
        },
      },
    }),
    prisma.building.count({ where }),
  ]);

  return {
    buildings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getBuildingById = async (id: string) => {
  const building = await prisma.building.findUnique({
    where: { id },
    include: {
      campus: {
        select: {
          id: true,
          name: true,
          code: true,
          university: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },
      floors: {
        orderBy: {
          floorNumber: "asc",
        },
      },
      _count: {
        select: {
          floors: true,
        },
      },
    },
  });

  if (!building) {
    throw new Error("Building not found");
  }
  return building;
};

export const updateBuilding = async (id: string, data: UpdateBuildingInput) => {
  const existingBuilding = await prisma.building.findUnique({ where: { id } });
  if (!existingBuilding) {
    throw new Error("Building not found");
  }

  if (data.code && data.code !== existingBuilding.code) {
    const duplicate = await prisma.building.findUnique({
      where: {
        campusId_code: {
          campusId: existingBuilding.campusId,
          code: data.code,
        },
      },
    });
    if (duplicate) {
      throw new Error("Building with this code already exists for this campus");
    }
  }

  return await prisma.building.update({
    where: { id },
    data,
  });
};

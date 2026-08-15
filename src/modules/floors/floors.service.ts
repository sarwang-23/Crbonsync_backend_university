import { prisma } from "../../config/prisma";
import { CreateFloorInput, UpdateFloorInput } from "./floors.validator";
import { Prisma } from "../../generated/prisma/client";

export const createFloor = async (data: CreateFloorInput) => {
  const building = await prisma.building.findUnique({
    where: { id: data.buildingId },
  });

  if (!building) {
    throw new Error("Building not found");
  }

  const existingFloor = await prisma.floor.findUnique({
    where: {
      buildingId_code: {
        buildingId: data.buildingId,
        code: data.code,
      },
    },
  });

  if (existingFloor) {
    throw new Error("Floor with this code already exists in this building");
  }

  return prisma.floor.create({ data });
};

export const getFloors = async (params: {
  page: number;
  limit: number;
  search?: string;
  buildingId?: string;
}) => {
  const { page, limit, search, buildingId } = params;
  const skip = Math.max(0, (page - 1) * limit);

  const where: Prisma.FloorWhereInput = {
    ...(buildingId ? { buildingId } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [floors, total] = await Promise.all([
    prisma.floor.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { floorNumber: "asc" },
        { createdAt: "desc" },
      ],
      include: {
        building: {
          select: {
            id: true,
            name: true,
            code: true,
            campus: {
              select: {
                id: true,
                name: true,
                code: true,
                university: {
                  select: { id: true, name: true, code: true },
                },
              },
            },
          },
        },
      },
    }),
    prisma.floor.count({ where }),
  ]);

  return {
    floors,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getFloorById = async (id: string) => {
  const floor = await prisma.floor.findUnique({
    where: { id },
    include: {
      building: {
        select: {
          id: true,
          name: true,
          code: true,
          campus: {
            select: {
              id: true,
              name: true,
              code: true,
              university: {
                select: { id: true, name: true, code: true },
              },
            },
          },
        },
      },
    },
  });

  if (!floor) {
    throw new Error("Floor not found");
  }

  return floor;
};

export const updateFloor = async (id: string, data: UpdateFloorInput) => {
  const existing = await prisma.floor.findUnique({ where: { id } });

  if (!existing) {
    throw new Error("Floor not found");
  }

  if (data.code && data.code !== existing.code) {
    const duplicate = await prisma.floor.findUnique({
      where: {
        buildingId_code: {
          buildingId: existing.buildingId,
          code: data.code,
        },
      },
    });

    if (duplicate) {
      throw new Error("Floor with this code already exists in this building");
    }
  }

  return prisma.floor.update({
    where: { id },
    data,
  });
};

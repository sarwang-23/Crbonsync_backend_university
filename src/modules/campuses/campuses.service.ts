import { prisma } from "../../config/prisma";
import { CreateCampusInput, UpdateCampusInput } from "./campuses.validator";

export const createCampus = async (data: CreateCampusInput) => {
  return await prisma.campus.create({ data });
};

export const getCampuses = async (params: {
  page: number;
  limit: number;
  search?: string;
  universityId?: string;
}) => {
  const { page, limit, search, universityId } = params;

  const skip = Math.max(0, (page - 1) * limit);

  const where = {
    ...(universityId
      ? {
          universityId,
        }
      : {}),

    ...(search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              code: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  const [campuses, total] = await Promise.all([
    prisma.campus.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        university: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    }),

    prisma.campus.count({
      where,
    }),
  ]);

  return {
    campuses,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getCampusById = async (id: string) => {
  const campus = await prisma.campus.findUnique({
    where: { id },
    include: {
      university: {
        select: { id: true, name: true, code: true },
      },
      _count: {
        select: { buildings: true },
      },
    },
  });

  if (!campus) {
    throw new Error("Campus not found");
  }

  return campus;
};

export const updateCampus = async (id: string, data: UpdateCampusInput) => {
  const existingCampus = await prisma.campus.findUnique({ where: { id } });
  if (!existingCampus) {
    throw new Error("Campus not found");
  }

  if (data.code && data.code !== existingCampus.code) {
    const duplicate = await prisma.campus.findUnique({
      where: {
        universityId_code: {
          universityId: existingCampus.universityId,
          code: data.code,
        },
      },
    });
    if (duplicate) {
      throw new Error("Campus with this code already exists for this university");
    }
  }

  return await prisma.campus.update({
    where: { id },
    data,
  });
};

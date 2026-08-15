import { prisma } from "../../config/prisma";
import { Prisma, UniversityStatus } from "../../generated/prisma/client";
import {
  CreateUniversityInput,
  UpdateUniversityInput,
} from "./universities.validator";

export const createUniversity = async (
  data: CreateUniversityInput
) => {
  const existingUniversity = await prisma.university.findUnique({
    where: {
      code: data.code,
    },
  });

  if (existingUniversity) {
    throw new Error("University with this code already exists");
  }

  const university = await prisma.university.create({
    data: {
      name: data.name,
      code: data.code,
      email: data.email,
      phone: data.phone,
      website: data.website,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      postalCode: data.postalCode,
    },
  });

  return university;
};

export const getUniversities = async (params: {
  page: number;
  limit: number;
  search?: string;
  status?: UniversityStatus;
}) => {
  const { page, limit, search, status } = params;

  // Prevent negative skip values
  const skip = Math.max(0, (page - 1) * limit);

  const where: Prisma.UniversityWhereInput = {
    ...(search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              code: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),

    ...(status
      ? {
          status,
        }
      : {}),
  };

  const [universities, total] = await Promise.all([
    prisma.university.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.university.count({
      where,
    }),
  ]);

  return {
    universities,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getUniversityById = async (
  id: string
) => {
  const university = await prisma.university.findUnique({
    where: {
      id,
    },
    include: {
      _count: {
        select: {
          users: true,
          campuses: true,
        },
      },
    },
  });

  if (!university) {
    throw new Error("University not found");
  }

  return university;
};

export const updateUniversity = async (
  id: string,
  data: UpdateUniversityInput
) => {
  const existingUniversity =
    await prisma.university.findUnique({
      where: { id },
    });

  if (!existingUniversity) {
    throw new Error("University not found");
  }

  if (data.code && data.code !== existingUniversity.code) {
    const duplicate =
      await prisma.university.findUnique({
        where: {
          code: data.code,
        },
      });

    if (duplicate) {
      throw new Error(
        "University with this code already exists"
      );
    }
  }

  const university =
    await prisma.university.update({
      where: { id },
      data,
    });

  return university;
};
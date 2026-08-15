import { prisma } from "../../config/prisma";

export const getUniversityStatistics = async (universityId: string) => {
  return prisma.universityStatistics.findMany({ where: { universityId } });
};

export const createUniversityStatistic = async (data: any) => {
  return prisma.universityStatistics.create({ data });
};

export const updateUniversityStatistic = async (id: string, data: any) => {
  return prisma.universityStatistics.update({ where: { id }, data });
};

export const deleteUniversityStatistic = async (id: string) => {
  return prisma.universityStatistics.delete({ where: { id } });
};

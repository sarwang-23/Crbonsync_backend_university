import { prisma } from "../../config/prisma";
import { ReportingPeriodStatus } from "../../generated/prisma/client";

export const createReportingPeriod = async (
  data: {
    universityId: string;
    name: string;
    startDate: string;
    endDate: string;
    isBaseline?: boolean;
    notes?: string;
  }
) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);

  if (startDate >= endDate) {
    throw new Error("startDate must be before endDate");
  }

  const existing = await prisma.reportingPeriod.findFirst({
    where: {
      universityId: data.universityId,
      startDate,
      endDate,
    },
  });

  if (existing) {
    throw new Error("Reporting period already exists");
  }

  if (data.isBaseline) {
    await prisma.reportingPeriod.updateMany({
      where: {
        universityId: data.universityId,
        isBaseline: true,
      },
      data: {
        isBaseline: false,
      },
    });
  }

  return prisma.reportingPeriod.create({
    data: {
      universityId: data.universityId,
      name: data.name,
      startDate,
      endDate,
      isBaseline: data.isBaseline ?? false,
      description: data.notes,
    },
  });
};

export const getReportingPeriods = async (universityId: string) => {
  return prisma.reportingPeriod.findMany({
    where: {
      universityId,
    },
    orderBy: {
      startDate: "desc",
    },
  });
};

export const getReportingPeriodById = async (id: string) => {
  const period = await prisma.reportingPeriod.findUnique({
    where: { id },
    include: {
      university: true,
    },
  });

  if (!period) {
    throw new Error("Reporting period not found");
  }

  return period;
};

export const setBaseline = async (id: string) => {
  const period = await prisma.reportingPeriod.findUnique({
    where: { id },
  });

  if (!period) {
    throw new Error("Reporting period not found");
  }

  await prisma.reportingPeriod.updateMany({
    where: {
      universityId: period.universityId,
      isBaseline: true,
      NOT: {
        id,
      },
    },
    data: {
      isBaseline: false,
    },
  });

  return prisma.reportingPeriod.update({
    where: {
      id,
    },
    data: {
      isBaseline: true,
    },
  });
};

export const openReportingPeriod = async (id: string) => {
  const period = await prisma.reportingPeriod.findUnique({
    where: { id },
  });

  if (!period) {
    throw new Error("Reporting period not found");
  }

  if (period.status === "LOCKED") {
    throw new Error("Locked reporting period cannot be reopened");
  }

  return prisma.reportingPeriod.update({
    where: { id },
    data: {
      status: "OPEN",
    },
  });
};

export const lockReportingPeriod = async (id: string) => {
  const period = await prisma.reportingPeriod.findUnique({
    where: { id },
  });

  if (!period) {
    throw new Error("Reporting period not found");
  }

  if (period.status === "LOCKED") {
    throw new Error("Reporting period is already locked");
  }

  return prisma.reportingPeriod.update({
    where: { id },
    data: {
      status: "LOCKED",
    },
  });
};

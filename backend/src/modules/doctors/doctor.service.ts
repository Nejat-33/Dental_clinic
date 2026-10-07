import { prisma } from "../../lib/prisma.js";

export async function getActiveDoctors() {
  return prisma.doctor.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
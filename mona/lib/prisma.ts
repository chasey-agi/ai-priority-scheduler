import { PrismaClient } from "@prisma/client";

// Next.js 热重载下，确保只实例化一个 PrismaClient
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
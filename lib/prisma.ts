import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["warn", "error"],
  });

/** Reuse one client per isolate (Vercel serverless + dev HMR) to avoid exhausting DB connections. */
globalForPrisma.prisma = prisma;


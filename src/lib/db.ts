/**
 * Database Client Singleton
 * Provides a single Prisma client instance for the application
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Disconnect Prisma client
 * Useful for cleanup in tests or shutdown
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}


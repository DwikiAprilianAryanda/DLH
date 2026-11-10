import { PrismaClient } from '@prisma/client';

/**
 * Satu instance PrismaClient untuk seluruh aplikasi.
 * Di mode dev, Next.js me-reload modul terus-menerus; tanpa cache di globalThis
 * koneksi MySQL akan menumpuk. Pakai: import { prisma } from '@/lib/prisma';
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

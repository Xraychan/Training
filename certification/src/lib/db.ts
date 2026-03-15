import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

console.log('DB URL:', 'file:D:/Storage/TrainingTest/certification/dev.db');
const adapter = new PrismaBetterSqlite3({
  url: 'file:D:/Storage/TrainingTest/certification/dev.db'
});

console.log('Initializing Prisma Client...');
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ 
    adapter,
    log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

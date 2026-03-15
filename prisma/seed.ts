import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';

const databaseUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db';
const dbPath = databaseUrl.replace('file:', '');

const betterSqlite = new Database(dbPath);
const adapter = new PrismaBetterSqlite3(betterSqlite);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database at:', dbPath);

  // 1. Initial Notice
  await prisma.notice.upsert({
    where: { id: 'notice-1' },
    update: {},
    create: {
      id: 'notice-1',
      content: '"The new Medical Trainers protocols have been updated. Please ensure all relevant assessments are completed by the end of the month."',
      updatedBy: 'system',
    },
  });

  // 2. Mock Users
  const users = [
    {
      email: 'admin@example.com',
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      passwordHash: '10e0315b85bc67e9405f6056aa704586f3c4d34479072fe5f3059c6e7b8f2a0e', // Certify123!
    },
    {
      email: 'manager@example.com',
      name: 'Dr. Jane Smith',
      role: 'MANAGER',
      passwordHash: '10e0315b85bc67e9405f6056aa704586f3c4d34479072fe5f3059c6e7b8f2a0e',
    },
    {
      email: 'trainer@example.com',
      name: 'John Doe',
      role: 'TRAINER',
      passwordHash: '10e0315b85bc67e9405f6056aa704586f3c4d34479072fe5f3059c6e7b8f2a0e',
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }

  console.log('Seed successful.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Adapter doesn't expose easy disconnect for better-sqlite3 in this way
  });

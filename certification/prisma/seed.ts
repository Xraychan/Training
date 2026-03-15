import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';
import crypto from 'crypto';

const adapter = new PrismaBetterSqlite3({
  url: 'file:D:/Storage/TrainingTest/certification/dev.db'
});
const prisma = new PrismaClient({ adapter });

const DEFAULT_PASS_HASH = crypto.createHash('sha256').update('password123').digest('hex');

async function main() {
  console.log('Seeding database...');

  // 1. Create Departments and Groups
  const dept1 = await prisma.department.upsert({
    where: { name: 'Emergency Medicine' },
    update: {},
    create: {
      name: 'Emergency Medicine',
      groups: {
        create: [
          { name: 'Physicians' },
          { name: 'Nursing' },
          { name: 'Allied Health' },
        ],
      },
    },
  });

  const physiciansGroup = await prisma.group.findFirst({
    where: { name: 'Physicians', departmentId: dept1.id },
  });
  
  const nursingGroup = await prisma.group.findFirst({
    where: { name: 'Nursing', departmentId: dept1.id },
  });

  // 2. Create Users
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      passwordHash: DEFAULT_PASS_HASH,
    },
  });

  await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      email: 'manager@example.com',
      name: 'Dr. Jane Smith',
      role: 'MANAGER',
      departmentId: dept1.id,
      groupId: nursingGroup?.id,
      passwordHash: DEFAULT_PASS_HASH,
    },
  });

  await prisma.user.upsert({
    where: { email: 'trainer@example.com' },
    update: {},
    create: {
      email: 'trainer@example.com',
      name: 'John Doe',
      role: 'TRAINER',
      departmentId: dept1.id,
      groupId: nursingGroup?.id,
      passwordHash: DEFAULT_PASS_HASH,
    },
  });

  // 3. Create a sample template
  const templateCount = await prisma.formTemplate.count();
  if (templateCount === 0) {
    await prisma.formTemplate.create({
      data: {
        title: 'Clinical Peer Assessment',
        description: 'Standard peer evaluation for clinical staff.',
        createdBy: 'admin-id',
        structure: JSON.stringify([
          {
            id: 'page-1',
            sections: [
              {
                id: 'sec-1',
                title: 'Competency Check',
                description: 'Assess basic clinical skills.'
              },
              {
                id: 'q-1',
                type: 'RADIO',
                label: 'Maintains sterile field?',
                required: true,
                options: ['Yes', 'No', 'N/A']
              }
            ]
          }
        ]),
        theme: JSON.stringify({
          backgroundColor: '#F9F8F7',
          accentColor: '#F27D26',
          borderRadius: 8
        })
      }
    });
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

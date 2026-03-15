import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('Certify123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { passwordHash },
    create: {
      email: 'admin@example.com',
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      passwordHash,
    },
  });
  console.log('Seeded admin user:', admin.email);

  // Only create notice if none exists
  const existingNotice = await prisma.notice.findFirst();
  if (!existingNotice) {
    await prisma.notice.create({
      data: {
        content: 'Welcome to CertifyPro. Please complete your assessments on time.',
        updatedBy: 'system',
      },
    });
    console.log('Seeded notice.');
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

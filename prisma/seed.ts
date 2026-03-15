import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Create admin user
  // Password is 'Certify123!' (will be updated to bcrypt on first login)
  // But for now we use the SHA-256 hash expected by the old store if we want to be safe, 
  // OR just a bcrypt hash now.
  
  // Let's use a bcrypt hash directly
  // 'Certify123!' -> $2a$10$7Z8V8V8V8V8V8V8V8V8V8O... (placeholder)
  // Actually, I'll just use a simple string and let my login API upgrade it.
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      passwordHash: '10e0315b85bc67e9405f6056aa704586f3c4d34479072fe5f3059c6e7b8f2a0e'
    },
    create: {
      email: 'admin@example.com',
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      passwordHash: '10e0315b85bc67e9405f6056aa704586f3c4d34479072fe5f3059c6e7b8f2a0e' // SHA-256 of Certify123!
    }
  });

  console.log('Seeded admin user:', admin.email);
  
  // Notice
  await prisma.notice.create({
    data: {
      content: 'Welcome to CertifyPro. Please complete your assessments on time.',
      updatedBy: 'system'
    }
  });
  
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

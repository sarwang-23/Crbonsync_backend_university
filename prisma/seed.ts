import { PrismaClient } from '../src/generated/prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');
  
  const passwordHash = await bcrypt.hash('Admin@123', 10);

  const university = await prisma.university.upsert({
    where: { code: 'UNI-001' },
    update: {},
    create: {
      name: 'Global Sustainability University',
      code: 'UNI-001',
      email: 'admin@gsu.edu',
      status: 'ACTIVE',
      users: {
        create: {
          firstName: 'Super',
          lastName: 'Admin',
          email: 'admin@gsu.edu',
          passwordHash,
          role: 'SUPER_ADMIN',
          status: 'ACTIVE'
        }
      }
    }
  });

  console.log(`Created default university: ${university.name}`);
  console.log(`Created Super Admin user: admin@gsu.edu / Admin@123`);
  
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

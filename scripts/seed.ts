import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('cYI2nH$5nX', 10);

  await prisma.user.upsert({
    where: { email: 'abacus-8ca18260@example.com' },
    update: { role: 'admin' },
    create: {
      role: 'admin',
      email: 'abacus-8ca18260@example.com',
      name: 'Test Admin',
      passwordHash,
      profile: {
        create: {
          onboardingDone: true,
          age: 30,
          gender: 'male',
          weight: 75,
          height: 178,
          activityLevel: 'moderate',
          goal: 'maintain',
          dietaryPreference: 'regular',
          allergies: [],
          budget: 5000,
          cookingTime: '30',
        },
      },
    },
  });

  // User-facing admin account
  const adminPasswordHash = await bcrypt.hash('ErQAR8GS9HA9!', 10);
  await prisma.user.upsert({
    where: { email: 'admin@supermealplanner.com' },
    update: { role: 'admin' },
    create: {
      email: 'admin@supermealplanner.com',
      name: 'Administrator',
      role: 'admin',
      passwordHash: adminPasswordHash,
      profile: {
        create: { onboardingDone: true },
      },
    },
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e: any) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

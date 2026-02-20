import bcrypt from 'bcrypt';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@foodie.com';
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'Areti123$';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: 'Foodie Admin',
      password: passwordHash,
      role: Role.ADMIN
    },
    create: {
      name: 'Foodie Admin',
      email: adminEmail,
      password: passwordHash,
      role: Role.ADMIN
    }
  });

  console.log('Admin user seeded', { id: admin.id, email: admin.email, role: admin.role });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

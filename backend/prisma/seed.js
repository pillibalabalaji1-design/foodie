const bcrypt = require('bcrypt');
const { PrismaClient, Role } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin@123', 12);

  await prisma.user.upsert({
    where: { email: 'admin@foodie.com' },
    update: {
      name: 'Foodie Admin',
      password: passwordHash,
      role: Role.ADMIN
    },
    create: {
      name: 'Foodie Admin',
      email: 'admin@foodie.com',
      password: passwordHash,
      role: Role.ADMIN
    }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

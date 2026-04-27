import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@platform.com';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Seed admin already exists — skipping.');
    return;
  }

  const defaultPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!defaultPassword) {
    throw new Error('SEED_ADMIN_PASSWORD environment variable is required for seeding.');
  }
  const password = await bcrypt.hash(defaultPassword, 12);
  await prisma.user.create({
    data: { email, name: 'Platform Admin', password, role: 'ADMIN' },
  });

  console.log('Seed admin created: admin@platform.com');
  console.log('IMPORTANT: Change the default password immediately after first login.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

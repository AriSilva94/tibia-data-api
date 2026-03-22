import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as bcrypt from 'bcrypt';

const url = process.env.DATABASE_URL ?? 'file:prisma/dev.db';
const adapter = new PrismaLibSql({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { email, passwordHash, role: 'admin' },
  });

  console.log(`Admin user created: ${email}`);

  const calmeraExists = await prisma.world.findUnique({ where: { name: 'Calmera' } });
  if (!calmeraExists) {
    await prisma.world.create({
      data: {
        name: 'Calmera',
        region: 'South America',
        pvpType: 'Open PvP',
        isTracked: true,
      },
    });
    console.log('World Calmera created');
  } else {
    console.log('World Calmera already exists');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

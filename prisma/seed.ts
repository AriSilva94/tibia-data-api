import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as path from 'path';

const rawUrl = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
const dbPath = rawUrl.replace(/^file:/, '');
const resolvedUrl = path.isAbsolute(dbPath)
  ? dbPath
  : path.resolve(process.cwd(), dbPath);
const adapter = new PrismaBetterSqlite3({ url: resolvedUrl });
const prisma = new PrismaClient({ adapter } as never);

async function main() {
  // Worlds are populated automatically by WorldSyncJob on startup.
  // Optionally mark specific worlds as tracked via TRACKED_WORLDS env var.
  const trackedWorlds = (process.env.TRACKED_WORLDS ?? '')
    .split(',')
    .map((w) => w.trim())
    .filter(Boolean);

  for (const worldName of trackedWorlds) {
    await prisma.world.upsert({
      where: { name: worldName },
      create: { name: worldName, isTracked: true },
      update: { isTracked: true },
    });
    console.log(`Marked as tracked: ${worldName}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

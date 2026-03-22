import { defineConfig } from 'prisma/config';

export default defineConfig({
  migrations: {
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: {
    url: 'file:prisma/dev.db',
  },
});

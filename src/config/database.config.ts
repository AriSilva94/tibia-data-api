import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
}));

export type DatabaseConfig = ReturnType<typeof databaseConfig>;

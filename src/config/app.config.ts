import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  allowedOrigins: process.env.ALLOWED_ORIGINS ?? '*',
  logLevel: process.env.LOG_LEVEL ?? 'log',
}));

export type AppConfig = ReturnType<typeof appConfig>;

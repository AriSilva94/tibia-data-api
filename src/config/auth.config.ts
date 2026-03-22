import { registerAs } from '@nestjs/config';

export const authConfig = registerAs('auth', () => {
  const isProd = process.env.NODE_ENV === 'production';
  const jwtSecret = process.env.JWT_SECRET;

  if (isProd && !jwtSecret) {
    throw new Error('JWT_SECRET must be defined in production');
  }

  return {
    jwtSecret: jwtSecret ?? 'dev-insecure-secret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  };
});

export type AuthConfig = ReturnType<typeof authConfig>;

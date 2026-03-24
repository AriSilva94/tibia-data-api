import { registerAs } from '@nestjs/config';

export const scheduleConfig = registerAs('schedule', () => ({
  worldSyncCron: process.env.WORLD_SYNC_CRON ?? '20 6 * * *',
}));

export type ScheduleConfig = ReturnType<typeof scheduleConfig>;

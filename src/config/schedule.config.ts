import { registerAs } from '@nestjs/config';

export const scheduleConfig = registerAs('schedule', () => ({
  onlineJobCron: process.env.ONLINE_JOB_CRON ?? '*/5 * * * *',
  highscoresJobCron: process.env.HIGHSCORES_JOB_CRON ?? '0 */6 * * *',
  characterRefreshCron: process.env.CHARACTER_REFRESH_CRON ?? '0 2 * * *',
  dailyMetricsCron: process.env.DAILY_METRICS_CRON ?? '30 2 * * *',
  discoveryReconciliationCron:
    process.env.DISCOVERY_RECONCILIATION_CRON ?? '0 3 * * *',
}));

export type ScheduleConfig = ReturnType<typeof scheduleConfig>;

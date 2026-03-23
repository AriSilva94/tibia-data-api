import { registerAs } from '@nestjs/config';

export const scheduleConfig = registerAs('schedule', () => ({
  onlineJobCron: process.env.ONLINE_JOB_CRON ?? '*/5 * * * *',
  highscoresJobCron: process.env.HIGHSCORES_JOB_CRON ?? '0 3 * * *',
  highscoresCategories: (
    process.env.HIGHSCORES_CATEGORIES ??
    'experience,magic,sword,axe,club,distance,shielding,fist,fishing,achievements'
  ).split(','),
  characterRefreshCron: process.env.CHARACTER_REFRESH_CRON ?? '0 2 * * *',
  characterRefreshBatchSize: parseInt(
    process.env.CHARACTER_REFRESH_BATCH_SIZE ?? '100',
    10,
  ),
  dailyMetricsCron: process.env.DAILY_METRICS_CRON ?? '30 23 * * *',
  discoveryReconciliationCron:
    process.env.DISCOVERY_RECONCILIATION_CRON ?? '0 4 * * *',
  inactiveDaysThreshold: parseInt(
    process.env.INACTIVE_DAYS_THRESHOLD ?? '30',
    10,
  ),
}));

export type ScheduleConfig = ReturnType<typeof scheduleConfig>;

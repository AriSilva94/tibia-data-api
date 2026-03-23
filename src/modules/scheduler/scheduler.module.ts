import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CollectorModule } from '../collector/collector.module';
import { DiscoveryModule } from '../discovery/discovery.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { WorldOnlineJob } from './jobs/world-online.job';
import { HighscoresSyncJob } from './jobs/highscores-sync.job';
import { CharacterRefreshJob } from './jobs/character-refresh.job';
import { DailyMetricsJob } from './jobs/daily-metrics.job';
import { DiscoveryReconciliationJob } from './jobs/discovery-reconciliation.job';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CollectorModule,
    DiscoveryModule,
    PrismaModule,
  ],
  providers: [
    WorldOnlineJob,
    HighscoresSyncJob,
    CharacterRefreshJob,
    DailyMetricsJob,
    DiscoveryReconciliationJob,
  ],
})
export class SchedulerModule {}
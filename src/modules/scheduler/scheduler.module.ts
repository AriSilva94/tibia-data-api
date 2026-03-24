import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CollectorModule } from '../collector/collector.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { WorldSyncJob } from './jobs/world-sync.job';

@Module({
  imports: [ScheduleModule.forRoot(), CollectorModule, PrismaModule],
  providers: [WorldSyncJob],
})
export class SchedulerModule {}

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CollectorModule } from '../collector/collector.module';
import { DiscoveryModule } from '../discovery/discovery.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { WorldOnlineJob } from './jobs/world-online.job';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CollectorModule,
    DiscoveryModule,
    PrismaModule,
  ],
  providers: [WorldOnlineJob],
})
export class SchedulerModule {}
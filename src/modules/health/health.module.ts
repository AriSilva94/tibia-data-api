import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { CollectorModule } from '../collector/collector.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, CollectorModule],
  controllers: [HealthController],
})
export class HealthModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { scheduleConfig } from './config/schedule.config';
import { PrismaModule } from './prisma/prisma.module';
import { WorldsModule } from './modules/worlds/worlds.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, scheduleConfig],
    }),
    PrismaModule,
    WorldsModule,
    SchedulerModule,
  ],
})
export class AppModule {}

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { PrismaService } from '../../../prisma/prisma.service';

const BATCH_SIZE = 200;

// NOTE: All date logic uses UTC. The server must run with TZ=UTC (or equivalent)
// to ensure the cron schedule and date boundaries are aligned correctly.
function utcDateString(date: Date): string {
  return date.toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

function dayBounds(dateStr: string): { start: Date; end: Date } {
  return {
    start: new Date(`${dateStr}T00:00:00.000Z`),
    end: new Date(`${dateStr}T23:59:59.999Z`),
  };
}

@Injectable()
export class DailyMetricsJob implements OnModuleInit {
  private readonly logger = new Logger(DailyMetricsJob.name);

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit(): void {
    const cron = this.configService.get<string>(
      'schedule.dailyMetricsCron',
      '30 23 * * *',
    );
    const job = new CronJob(cron, () => void this.run());
    this.schedulerRegistry.addCronJob('daily-metrics', job);
    job.start();
    this.logger.log(`Scheduled with cron: ${cron}`);
  }

  async run(targetDate?: string): Promise<void> {
    const start = Date.now();
    const date = targetDate ?? utcDateString(new Date());
    const { start: dayStart, end: dayEnd } = dayBounds(date);

    const trackedWorlds = await this.prisma.world.findMany({
      where: { isTracked: true },
      select: { name: true },
    });

    if (trackedWorlds.length === 0) {
      this.logger.debug('No tracked worlds found');
      return;
    }

    const worldNames = trackedWorlds.map((w) => w.name);

    let offset = 0;
    let totalProcessed = 0;
    let totalWithMetrics = 0;
    let totalSkipped = 0;

    while (true) {
      const characters = await this.prisma.character.findMany({
        where: {
          isConfirmedWorld: true,
          world: { in: worldNames },
        },
        select: { id: true, world: true },
        orderBy: { id: 'asc' },
        skip: offset,
        take: BATCH_SIZE,
      });

      if (characters.length === 0) break;

      for (const character of characters) {
        const had = await this.processCharacter(
          character.id,
          character.world,
          date,
          dayStart,
          dayEnd,
        );
        totalProcessed++;
        if (had) totalWithMetrics++;
        else totalSkipped++;
      }

      offset += characters.length;
      if (characters.length < BATCH_SIZE) break;
    }

    this.logger.log(
      `[${date}] Done in ${Date.now() - start}ms | ` +
        `processed=${totalProcessed} with_metrics=${totalWithMetrics} skipped=${totalSkipped}`,
    );
  }

  private async processCharacter(
    characterId: number,
    world: string,
    date: string,
    dayStart: Date,
    dayEnd: Date,
  ): Promise<boolean> {
    const snapshots = await this.prisma.characterSnapshot.findMany({
      where: {
        characterId,
        collectedAt: { gte: dayStart, lte: dayEnd },
      },
      orderBy: { collectedAt: 'asc' },
      select: { experience: true, level: true },
    });

    if (snapshots.length === 0) return false;

    const oldest = snapshots[0];
    const newest = snapshots[snapshots.length - 1];

    const expStart = oldest.experience ?? BigInt(0);
    const expEnd = newest.experience ?? BigInt(0);
    const rawGain = expEnd - expStart;
    const expGained = rawGain < BigInt(0) ? BigInt(0) : rawGain;

    const levelStart = oldest.level ?? 0;
    const levelEnd = newest.level ?? 0;
    const rawLevelsGained = levelEnd - levelStart;
    const levelsGained = rawLevelsGained < 0 ? 0 : rawLevelsGained;

    const deathsCount = await this.prisma.characterDeath.count({
      where: {
        characterId,
        deathAt: { gte: dayStart, lte: dayEnd },
      },
    });

    await this.prisma.characterDailyMetric.upsert({
      where: { characterId_date: { characterId, date } },
      create: {
        characterId,
        world,
        date,
        expStart,
        expEnd,
        expGained,
        levelStart,
        levelEnd,
        levelsGained,
        deathsCount,
      },
      update: {
        expStart,
        expEnd,
        expGained,
        levelStart,
        levelEnd,
        levelsGained,
        deathsCount,
      },
    });

    return true;
  }
}

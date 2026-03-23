import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class DiscoveryReconciliationJob implements OnModuleInit {
  private readonly logger = new Logger(DiscoveryReconciliationJob.name);

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit(): void {
    const cron = this.configService.get<string>(
      'schedule.discoveryReconciliationCron',
      '0 4 * * *',
    );
    const job = new CronJob(cron, () => void this.run());
    this.schedulerRegistry.addCronJob('discovery-reconciliation', job);
    job.start();
    this.logger.log(`Scheduled with cron: ${cron}`);
  }

  async run(): Promise<void> {
    try {
      await this.doRun();
    } catch (err: unknown) {
      this.logger.error(`Discovery reconciliation failed: ${String(err)}`);
    }
  }

  private async doRun(): Promise<void> {
    const start = Date.now();

    const inactiveDaysThreshold = this.configService.get<number>(
      'schedule.inactiveDaysThreshold',
      30,
    );

    if (!Number.isFinite(inactiveDaysThreshold) || inactiveDaysThreshold <= 0) {
      this.logger.error(
        `Invalid inactiveDaysThreshold: ${inactiveDaysThreshold} — skipping`,
      );
      return;
    }

    const trackedWorlds = await this.prisma.world.findMany({
      where: { isTracked: true },
      select: { name: true },
    });

    if (trackedWorlds.length === 0) {
      this.logger.debug('No tracked worlds found');
      return;
    }

    const worldNames = trackedWorlds.map((w) => w.name);

    // Step 1 — deprioritize characters not seen within the threshold
    const cutoffDate = new Date(
      Date.now() - inactiveDaysThreshold * 24 * 60 * 60 * 1000,
    );

    const { count: deactivated } = await this.prisma.character.updateMany({
      where: {
        world: { in: worldNames },
        isActiveCandidate: true,
        lastSeenAt: { lt: cutoffDate },
      },
      data: { isActiveCandidate: false },
    });

    if (deactivated > 0) {
      this.logger.log(
        `Deactivated ${deactivated} inactive characters (threshold: ${inactiveDaysThreshold}d)`,
      );
    }

    // Step 2 — log index state
    const [total, confirmed, active, inactive, pendingConfirmation] =
      await Promise.all([
        this.prisma.character.count({
          where: { world: { in: worldNames } },
        }),
        this.prisma.character.count({
          where: { world: { in: worldNames }, isConfirmedWorld: true },
        }),
        this.prisma.character.count({
          where: { world: { in: worldNames }, isActiveCandidate: true },
        }),
        this.prisma.character.count({
          where: { world: { in: worldNames }, isActiveCandidate: false },
        }),
        this.prisma.character.count({
          where: {
            world: { in: worldNames },
            isConfirmedWorld: false,
            isActiveCandidate: true,
          },
        }),
      ]);

    this.logger.log(
      `Index state | ` +
        `total=${total} confirmed=${confirmed} active=${active} ` +
        `inactive=${inactive} pending_confirmation=${pendingConfirmation} | ` +
        `${Date.now() - start}ms`,
    );
  }
}


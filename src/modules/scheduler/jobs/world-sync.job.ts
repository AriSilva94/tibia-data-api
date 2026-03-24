import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { PrismaService } from '../../../prisma/prisma.service';
import { TibiaHttpClientService } from '../../collector/services/tibia-http-client.service';
import { TibiaRateLimitService } from '../../collector/services/tibia-rate-limit.service';
import { WorldsListParser } from '../../collector/parsers/worlds-list.parser';
import { CollectorOutcome } from '../../../common/enums/collector-outcome.enum';

const WORLDS_LIST_URL = 'https://www.tibia.com/community/?subtopic=worlds';

@Injectable()
export class WorldSyncJob implements OnModuleInit {
  private readonly logger = new Logger(WorldSyncJob.name);

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly httpClient: TibiaHttpClientService,
    private readonly rateLimit: TibiaRateLimitService,
    private readonly worldsListParser: WorldsListParser,
  ) {}

  onModuleInit(): void {
    const cron = this.configService.get<string>(
      'schedule.worldSyncCron',
      '30 6 * * *',
    );
    const job = new CronJob(cron, () => void this.run());
    this.schedulerRegistry.addCronJob('world-sync', job);
    job.start();
    this.logger.log(`Scheduled with cron: ${cron}`);

    void this.run();
  }

  async run(): Promise<void> {
    const start = Date.now();

    if (this.rateLimit.isBlocked()) {
      this.logger.warn('Blocked by rate limit — skipping cycle');
      return;
    }

    const result = await this.httpClient.fetch(WORLDS_LIST_URL);

    if (result.outcome === CollectorOutcome.Challenge) {
      this.rateLimit.reportChallenge();
      this.logger.warn('Challenge detected — backing off');
      return;
    }

    if (result.outcome === CollectorOutcome.Block) {
      this.rateLimit.reportBlock();
      this.logger.warn('Block detected — pausing');
      return;
    }

    if (result.outcome !== CollectorOutcome.Success || !result.html) {
      this.logger.warn(`Fetch failed: outcome=${result.outcome}`);
      return;
    }

    this.rateLimit.reportSuccess();

    let worlds: ReturnType<WorldsListParser['parse']>;
    try {
      worlds = this.worldsListParser.parse(result.html);
    } catch (err: unknown) {
      this.logger.error(`Parse error: ${String(err)}`);
      return;
    }

    let upserted = 0;
    for (const world of worlds) {
      try {
        await this.prisma.world.upsert({
          where: { name: world.name },
          create: {
            name: world.name,
            region: world.region,
            pvpType: world.pvpType,
            lastOnlineCount: world.status === 'online' ? world.playersOnline : null,
            isTracked: false,
          },
          update: {
            region: world.region,
            pvpType: world.pvpType,
            ...(world.status === 'online' && { lastOnlineCount: world.playersOnline }),
          },
        });
        upserted++;
      } catch (err: unknown) {
        this.logger.warn(`Failed to upsert world "${world.name}": ${String(err)}`);
      }
    }

    this.logger.log(
      `Sync complete in ${Date.now() - start}ms | ${upserted}/${worlds.length} worlds upserted`,
    );
  }
}

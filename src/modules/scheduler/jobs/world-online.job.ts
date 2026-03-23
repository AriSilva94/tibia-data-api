import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { PrismaService } from '../../../prisma/prisma.service';
import { TibiaHttpClientService } from '../../collector/services/tibia-http-client.service';
import { TibiaRateLimitService } from '../../collector/services/tibia-rate-limit.service';
import { OnlineParser } from '../../collector/parsers/online.parser';
import { DiscoveryService } from '../../discovery/discovery.service';
import { CollectorOutcome } from '../../../common/enums/collector-outcome.enum';
import { DiscoverySource } from '../../../common/enums/discovery-source.enum';

const DISCOVER_CONCURRENCY = 10;

function tibiaOnlineUrl(world: string): string {
  return `https://www.tibia.com/community/?subtopic=worlds&world=${encodeURIComponent(world)}`;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // e.g. '2026-03-22'
}

@Injectable()
export class WorldOnlineJob implements OnModuleInit {
  private readonly logger = new Logger(WorldOnlineJob.name);

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly httpClient: TibiaHttpClientService,
    private readonly rateLimit: TibiaRateLimitService,
    private readonly onlineParser: OnlineParser,
    private readonly discoveryService: DiscoveryService,
  ) {}

  onModuleInit(): void {
    const cron = this.configService.get<string>(
      'schedule.onlineJobCron',
      '*/5 * * * *',
    );
    const job = new CronJob(cron, () => void this.run());
    this.schedulerRegistry.addCronJob('world-online', job);
    job.start();
    this.logger.log(`Scheduled with cron: ${cron}`);
  }

  async run(): Promise<void> {
    const start = Date.now();

    if (this.rateLimit.isBlocked()) {
      this.logger.warn('Blocked by rate limit — skipping cycle');
      return;
    }

    const worlds = await this.prisma.world.findMany({
      where: { isTracked: true },
    });

    if (worlds.length === 0) {
      this.logger.debug('No tracked worlds found');
      return;
    }

    for (let i = 0; i < worlds.length; i++) {
      if (i > 0) {
        await this.sleep(this.rateLimit.getDelayMs());
      }
      await this.processWorld(worlds[i].name);
    }

    this.logger.log(`Cycle complete in ${Date.now() - start}ms`);
  }

  private async processWorld(worldName: string): Promise<void> {
    const start = Date.now();

    const result = await this.httpClient.fetch(tibiaOnlineUrl(worldName));

    if (result.outcome === CollectorOutcome.Challenge) {
      this.rateLimit.reportChallenge();
      this.logger.warn(`[${worldName}] Challenge detected — backing off`);
      return;
    }

    if (result.outcome === CollectorOutcome.Block) {
      this.rateLimit.reportBlock();
      this.logger.warn(`[${worldName}] Block detected — pausing`);
      return;
    }

    if (result.outcome !== CollectorOutcome.Success || !result.html) {
      this.logger.warn(`[${worldName}] Fetch failed: outcome=${result.outcome}`);
      return;
    }

    this.rateLimit.reportSuccess();

    try {
      const parsed = this.onlineParser.parse(result.html);
      const collectedAt = new Date();
      const sourceKey = `online_${todayKey()}`;

      await this.prisma.onlineWorldSnapshot.create({
        data: { world: worldName, collectedAt, onlineCount: parsed.onlineCount },
      });

      if (parsed.players.length > 0) {
        await this.prisma.onlinePlayerSnapshot.createMany({
          data: parsed.players.map((p) => ({
            world: worldName,
            collectedAt,
            characterName: p.name,
            level: p.level,
            vocation: p.vocation,
          })),
        });

        for (let i = 0; i < parsed.players.length; i += DISCOVER_CONCURRENCY) {
          const batch = parsed.players.slice(i, i + DISCOVER_CONCURRENCY);
          await Promise.all(
            batch.map((player) =>
              this.discoveryService.discover({
                characterName: player.name,
                world: worldName,
                source: DiscoverySource.OnlineList,
                sourceKey,
                seenOnlineAt: collectedAt,
              }),
            ),
          );
        }
      }

      await this.prisma.world.update({
        where: { name: worldName },
        data: { lastOnlineCount: parsed.onlineCount },
      });

      this.logger.log(
        `[${worldName}] ${parsed.onlineCount} online | ${Date.now() - start}ms`,
      );
    } catch (err: unknown) {
      this.logger.error(`[${worldName}] Parse/save error: ${String(err)}`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
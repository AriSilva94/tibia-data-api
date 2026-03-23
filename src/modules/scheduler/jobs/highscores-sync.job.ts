import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { PrismaService } from '../../../prisma/prisma.service';
import { TibiaHttpClientService } from '../../collector/services/tibia-http-client.service';
import { TibiaRateLimitService } from '../../collector/services/tibia-rate-limit.service';
import {
  HighscoresEntry,
  HighscoresParser,
} from '../../collector/parsers/highscores.parser';
import { DiscoveryService } from '../../discovery/discovery.service';
import { CollectorOutcome } from '../../../common/enums/collector-outcome.enum';
import { DiscoverySource } from '../../../common/enums/discovery-source.enum';

const DISCOVER_CONCURRENCY = 10;

// Maps human-readable category names to Tibia's numeric category IDs
const CATEGORY_ID: Record<string, number> = {
  experience: 1,
  magic: 2,
  fist: 3,
  club: 4,
  sword: 5,
  axe: 6,
  distance: 7,
  shielding: 8,
  fishing: 9,
  achievements: 10,
};

function tibiaHighscoresUrl(
  world: string,
  category: string,
  page: number,
): string {
  const categoryId = CATEGORY_ID[category] ?? 1;
  return (
    `https://www.tibia.com/community/?subtopic=highscores` +
    `&world=${encodeURIComponent(world)}` +
    `&category=${categoryId}` +
    `&currentpage=${page}`
  );
}


@Injectable()
export class HighscoresSyncJob implements OnModuleInit {
  private readonly logger = new Logger(HighscoresSyncJob.name);

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly httpClient: TibiaHttpClientService,
    private readonly rateLimit: TibiaRateLimitService,
    private readonly highscoresParser: HighscoresParser,
    private readonly discoveryService: DiscoveryService,
  ) {}

  onModuleInit(): void {
    const cron = this.configService.get<string>(
      'schedule.highscoresJobCron',
      '0 3 * * *',
    );
    const job = new CronJob(cron, () => void this.run());
    this.schedulerRegistry.addCronJob('highscores-sync', job);
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

    const categories = this.configService.get<string[]>(
      'schedule.highscoresCategories',
      [
        'experience',
        'magic',
        'sword',
        'axe',
        'club',
        'distance',
        'shielding',
        'fist',
        'fishing',
        'achievements',
      ],
    );

    // collectedAt and snapshotDate are captured once and shared across all categories/pages of this run
    const collectedAt = new Date();
    const snapshotDate = collectedAt.toISOString().slice(0, 10);

    for (const world of worlds) {
      for (const category of categories) {
        await this.processCategory(world.name, category, collectedAt, snapshotDate);
      }
    }

    this.logger.log(`Cycle complete in ${Date.now() - start}ms`);
  }

  private async processCategory(
    worldName: string,
    category: string,
    collectedAt: Date,
    snapshotDate: string,
  ): Promise<void> {
    const start = Date.now();
    const sourceKey = `highscores_${snapshotDate}_${category}`;
    let page = 1;
    let totalEntries = 0;

    const alreadyCollected = await this.prisma.highscoreSnapshot.findFirst({
      where: { world: worldName, category, snapshotDate },
      select: { id: true },
    });

    if (alreadyCollected) {
      this.logger.debug(
        `[${worldName}/${category}] Already collected for ${snapshotDate} — skipping`,
      );
      return;
    }

    while (true) {
      if (this.rateLimit.isBlocked()) {
        this.logger.warn(
          `[${worldName}/${category}] p=${page} Blocked — stopping category`,
        );
        break;
      }

      await this.sleep(this.rateLimit.getDelayMs());

      const url = tibiaHighscoresUrl(worldName, category, page);
      const result = await this.httpClient.fetch(url);

      if (result.outcome === CollectorOutcome.Challenge) {
        this.rateLimit.reportChallenge();
        this.logger.warn(
          `[${worldName}/${category}] p=${page} Challenge — backing off`,
        );
        break;
      }

      if (result.outcome === CollectorOutcome.Block) {
        this.rateLimit.reportBlock();
        this.logger.warn(
          `[${worldName}/${category}] p=${page} Block — pausing`,
        );
        break;
      }

      if (result.outcome !== CollectorOutcome.Success || !result.html) {
        this.logger.warn(
          `[${worldName}/${category}] p=${page} Fetch failed: outcome=${result.outcome}`,
        );
        break;
      }

      this.rateLimit.reportSuccess();

      let entries: HighscoresEntry[];
      try {
        const parsed = this.highscoresParser.parse(
          result.html,
          worldName,
          category,
          page,
        );
        entries = parsed.entries;
      } catch (err: unknown) {
        this.logger.error(
          `[${worldName}/${category}] p=${page} Parse error: ${String(err)}`,
        );
        break;
      }

      if (entries.length === 0) {
        break;
      }

      try {
        await this.prisma.highscoreSnapshot.createMany({
          data: entries.map((entry) => ({
            world: worldName,
            category,
            snapshotDate,
            page,
            rank: entry.rank,
            characterName: entry.characterName,
            vocation: entry.vocation,
            value: BigInt(entry.value),
            collectedAt,
          })),
        });
      } catch (err: unknown) {
        this.logger.error(
          `[${worldName}/${category}] p=${page} DB save error: ${String(err)}`,
        );
        // Pages already saved are valid — continue to next page
      }

      for (let i = 0; i < entries.length; i += DISCOVER_CONCURRENCY) {
        const batch = entries.slice(i, i + DISCOVER_CONCURRENCY);
        await Promise.all(
          batch.map((entry) =>
            this.discoveryService.discover({
              characterName: entry.characterName,
              world: worldName,
              source: DiscoverySource.Highscores,
              sourceKey,
            }),
          ),
        );
      }

      totalEntries += entries.length;
      page++;
    }

    this.logger.log(
      `[${worldName}/${category}] ${totalEntries} entries, ${page - 1} pages | ${Date.now() - start}ms`,
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

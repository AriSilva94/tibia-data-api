import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Character } from '@prisma/client';
import { CronJob } from 'cron';
import { PrismaService } from '../../../prisma/prisma.service';
import { TibiaHttpClientService } from '../../collector/services/tibia-http-client.service';
import { TibiaRateLimitService } from '../../collector/services/tibia-rate-limit.service';
import { CharacterParser } from '../../collector/parsers/character.parser';
import { CollectorParseError } from '../../collector/collector.errors';
import { DiscoveryService } from '../../discovery/discovery.service';
import { CollectorOutcome } from '../../../common/enums/collector-outcome.enum';

type ProcessResult = 'confirmed' | 'wrong_world' | 'not_found' | 'error';

function tibiaCharacterUrl(name: string): string {
  return `https://www.tibia.com/community/?subtopic=characters&name=${encodeURIComponent(name)}`;
}

@Injectable()
export class CharacterRefreshJob implements OnModuleInit {
  private readonly logger = new Logger(CharacterRefreshJob.name);

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly httpClient: TibiaHttpClientService,
    private readonly rateLimit: TibiaRateLimitService,
    private readonly characterParser: CharacterParser,
    private readonly discoveryService: DiscoveryService,
  ) {}

  onModuleInit(): void {
    const cron = this.configService.get<string>(
      'schedule.characterRefreshCron',
      '0 2 * * *',
    );
    const job = new CronJob(cron, () => void this.run());
    this.schedulerRegistry.addCronJob('character-refresh', job);
    job.start();
    this.logger.log(`Scheduled with cron: ${cron}`);
  }

  async run(): Promise<void> {
    const start = Date.now();

    if (this.rateLimit.isBlocked()) {
      this.logger.warn('Blocked by rate limit — skipping cycle');
      return;
    }

    const batchSize = this.configService.get<number>(
      'schedule.characterRefreshBatchSize',
      100,
    );
    const concurrency = this.configService.get<number>(
      'schedule.characterRefreshConcurrency',
      3,
    );

    const worlds = await this.prisma.world.findMany({
      where: { isTracked: true },
    });

    if (worlds.length === 0) {
      this.logger.debug('No tracked worlds found');
      return;
    }

    let totalProcessed = 0;
    let totalConfirmed = 0;
    let totalWrongWorld = 0;
    let totalNotFound = 0;
    let totalErrors = 0;

    for (const world of worlds) {
      const characters = await this.discoveryService.getDiscoveryQueue(
        world.name,
        batchSize,
      );

      if (characters.length === 0) {
        this.logger.debug(`[${world.name}] No characters in queue`);
        continue;
      }

      for (let i = 0; i < characters.length; i += concurrency) {
        if (this.rateLimit.isBlocked()) {
          this.logger.warn(`[${world.name}] Blocked mid-batch — stopping`);
          break;
        }

        const batch = characters.slice(i, i + concurrency);
        const results = await Promise.all(
          batch.map((char) => this.processCharacter(char, world.name)),
        );

        for (const result of results) {
          totalProcessed++;
          if (result === 'confirmed') totalConfirmed++;
          else if (result === 'wrong_world') totalWrongWorld++;
          else if (result === 'not_found') totalNotFound++;
          else totalErrors++;
        }
      }
    }

    this.logger.log(
      `Cycle complete in ${Date.now() - start}ms | ` +
        `processed=${totalProcessed} confirmed=${totalConfirmed} ` +
        `wrong_world=${totalWrongWorld} not_found=${totalNotFound} errors=${totalErrors}`,
    );
  }

  private async processCharacter(
    character: Character,
    worldName: string,
  ): Promise<ProcessResult> {
    await this.sleep(this.rateLimit.getDelayMs());

    const result = await this.httpClient.fetch(
      tibiaCharacterUrl(character.name),
    );

    if (result.outcome === CollectorOutcome.Challenge) {
      this.rateLimit.reportChallenge();
      this.logger.warn(`[${character.name}] Challenge detected — backing off`);
      return 'error';
    }

    if (result.outcome === CollectorOutcome.Block) {
      this.rateLimit.reportBlock();
      this.logger.warn(`[${character.name}] Block detected — pausing`);
      return 'error';
    }

    if (result.outcome !== CollectorOutcome.Success || !result.html) {
      this.logger.warn(
        `[${character.name}] Fetch failed: outcome=${result.outcome}`,
      );
      return 'error';
    }

    this.rateLimit.reportSuccess();

    let parsed: ReturnType<CharacterParser['parse']>;
    try {
      parsed = this.characterParser.parse(result.html);
    } catch (err: unknown) {
      if (
        err instanceof CollectorParseError &&
        err.message === 'Character not found'
      ) {
        await this.prisma.character.update({
          where: { id: character.id },
          data: { isActiveCandidate: false },
        });
        this.logger.debug(`[${character.name}] Not found — deactivated`);
        return 'not_found';
      }
      // Update lastProfileScanAt so this character is deprioritized on next queue fetch
      await this.prisma.character.update({
        where: { id: character.id },
        data: { lastProfileScanAt: new Date() },
      });
      this.logger.warn(`[${character.name}] Parse error: ${String(err)}`);
      return 'error';
    }

    if (parsed.world.toLowerCase() !== worldName.toLowerCase()) {
      await this.prisma.character.update({
        where: { id: character.id },
        data: { isActiveCandidate: false },
      });
      this.logger.debug(
        `[${character.name}] Wrong world (${parsed.world}) — deactivated`,
      );
      return 'wrong_world';
    }

    // World confirmed — persist everything
    try {
      await this.discoveryService.confirmWorld(character.name, worldName);

      await this.prisma.characterProfile.upsert({
        where: { characterId: character.id },
        create: {
          characterId: character.id,
          world: worldName,
          level: parsed.level,
          experience: BigInt(parsed.experience),
          vocation: parsed.vocation,
          guildName: parsed.guildName,
          residence: parsed.residence,
          sex: parsed.sex,
          formerNamesRaw: parsed.formerNamesRaw,
          accountStatusRaw: parsed.accountStatusRaw,
        },
        update: {
          level: parsed.level,
          experience: BigInt(parsed.experience),
          vocation: parsed.vocation,
          guildName: parsed.guildName,
          residence: parsed.residence,
          sex: parsed.sex,
          formerNamesRaw: parsed.formerNamesRaw,
          accountStatusRaw: parsed.accountStatusRaw,
          lastFetchedAt: new Date(),
        },
      });

      // Always insert a snapshot — historical record matters even if nothing changed
      await this.prisma.characterSnapshot.create({
        data: {
          characterId: character.id,
          world: worldName,
          collectedAt: new Date(),
          level: parsed.level,
          experience: BigInt(parsed.experience),
          vocation: parsed.vocation,
          guildName: parsed.guildName,
          statusOnline: false,
          sourceType: 'profile_refresh',
        },
      });

      await this.saveNewDeaths(character.id, worldName, parsed.deaths);
    } catch (err: unknown) {
      this.logger.error(
        `[${character.name}] DB save error: ${String(err)}`,
      );
      return 'error';
    }

    return 'confirmed';
  }

  private async saveNewDeaths(
    characterId: number,
    worldName: string,
    deaths: ReturnType<CharacterParser['parse']>['deaths'],
  ): Promise<void> {
    if (deaths.length === 0) return;

    const existing = await this.prisma.characterDeath.findMany({
      where: { characterId },
      select: { dedupeHash: true },
    });

    const existingHashes = new Set(existing.map((d) => d.dedupeHash));
    const newDeaths = deaths.filter((d) => !existingHashes.has(d.dedupeHash));

    if (newDeaths.length === 0) return;

    await this.prisma.characterDeath.createMany({
      data: newDeaths.map((d) => ({
        characterId,
        world: worldName,
        deathAt: d.deathAt,
        level: d.level,
        killersRaw: d.killersRaw,
        dedupeHash: d.dedupeHash,
      })),
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

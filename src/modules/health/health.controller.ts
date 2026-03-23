import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TibiaRateLimitService } from '../collector/services/tibia-rate-limit.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rateLimitService: TibiaRateLimitService,
  ) {}

  @Public()
  @Get()
  async check() {
    const databaseStatus = await this.checkDatabase();
    const collectorStatus = this.rateLimitService.getStatus();
    const indexCounts = await this.getIndexCounts();

    const status = databaseStatus === 'ok' ? 'ok' : 'degraded';

    return {
      status,
      timestamp: new Date().toISOString(),
      database: databaseStatus,
      collector: {
        isBlocked: collectorStatus.state === 'blocked',
        currentDelayMs: collectorStatus.delayMs,
        concurrencyLimit: collectorStatus.concurrency,
      },
      index: indexCounts,
    };
  }

  private async checkDatabase(): Promise<'ok' | 'error'> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'ok';
    } catch {
      return 'error';
    }
  }

  private async getIndexCounts() {
    try {
      const [totalCharacters, confirmedCharacters, activeCharacters] =
        await Promise.all([
          this.prisma.character.count(),
          this.prisma.character.count({ where: { isConfirmedWorld: true } }),
          this.prisma.character.count({ where: { isActiveCandidate: true } }),
        ]);

      return { totalCharacters, confirmedCharacters, activeCharacters };
    } catch {
      return { totalCharacters: null, confirmedCharacters: null, activeCharacters: null };
    }
  }
}

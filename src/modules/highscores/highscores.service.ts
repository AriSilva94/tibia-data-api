import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../../prisma/prisma.service';
import { HighscoresQueryDto } from './dto/highscores-query.dto';
import { HighscoresResponseDto } from './dto/highscores-response.dto';

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

@Injectable()
export class HighscoresService {
  constructor(private readonly prisma: PrismaService) {}

  async findLatest(query: HighscoresQueryDto): Promise<HighscoresResponseDto> {
    const { world, category, page = 1 } = query;

    // Find the most recent collectedAt for this world+category+page combination
    const latest = await this.prisma.highscoresSnapshot.findFirst({
      where: { world, category, page },
      orderBy: { collectedAt: 'desc' },
      select: { collectedAt: true },
    });

    if (!latest) {
      throw new NotFoundException(
        `No highscores snapshot found for world "${world}", category "${category}", page ${page}`,
      );
    }

    const entries = await this.prisma.highscoresSnapshot.findMany({
      where: {
        world,
        category,
        page,
        collectedAt: latest.collectedAt,
      },
      orderBy: { rank: 'asc' },
      select: {
        rank: true,
        characterName: true,
        vocation: true,
        value: true,
      },
    });

    const isStale = Date.now() - latest.collectedAt.getTime() > STALE_THRESHOLD_MS;

    return plainToInstance(
      HighscoresResponseDto,
      {
        world,
        category,
        page,
        collectedAt: latest.collectedAt,
        isStale,
        entries,
      },
      { excludeExtraneousValues: true },
    );
  }
}

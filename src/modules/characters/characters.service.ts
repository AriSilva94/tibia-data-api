import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../../prisma/prisma.service';
import { CharacterListQueryDto } from './dto/character-list-query.dto';
import { CharacterProfileResponseDto } from './dto/character-profile-response.dto';
import { CharacterResponseDto } from './dto/character-response.dto';
import { DailyXpQueryDto } from './dto/daily-xp-query.dto';
import { DailyXpResponseDto } from './dto/daily-xp-response.dto';
import { SnapshotsQueryDto } from './dto/snapshots-query.dto';
import { SnapshotsResponseDto } from './dto/snapshots-response.dto';

const ONLINE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

// Tibia character names are stored in title-case. Normalizing the input
// ensures case-insensitive lookup works correctly on SQLite (no native support).
function toTitleCase(name: string): string {
  return name
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

@Injectable()
export class CharactersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: CharacterListQueryDto) {
    const { world, name, isOnline, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (world) {
      where.world = world;
    }

    if (name) {
      where.name = { contains: name };
    }

    if (isOnline !== undefined) {
      const threshold = new Date(Date.now() - ONLINE_THRESHOLD_MS);
      if (isOnline) {
        where.lastSeenOnlineAt = { gte: threshold };
      } else {
        where.OR = [
          { lastSeenOnlineAt: null },
          { lastSeenOnlineAt: { lt: threshold } },
        ];
      }
    }

    const [total, characters] = await Promise.all([
      this.prisma.character.count({ where }),
      this.prisma.character.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          world: true,
          lastSeenAt: true,
          lastSeenOnlineAt: true,
          isConfirmedWorld: true,
          profile: {
            select: {
              level: true,
              vocation: true,
            },
          },
        },
      }),
    ]);

    const data = plainToInstance(
      CharacterResponseDto,
      characters.map((c) => ({
        id: c.id,
        name: c.name,
        world: c.world,
        level: c.profile?.level ?? null,
        vocation: c.profile?.vocation ?? null,
        lastSeenAt: c.lastSeenAt,
        lastSeenOnlineAt: c.lastSeenOnlineAt,
        isConfirmedWorld: c.isConfirmedWorld,
      })),
      { excludeExtraneousValues: true },
    );

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByName(name: string) {
    const character = await this.prisma.character.findFirst({
      where: { name: { equals: toTitleCase(name) } },
      select: {
        id: true,
        name: true,
        world: true,
        lastSeenAt: true,
        lastSeenOnlineAt: true,
        isConfirmedWorld: true,
        discoverySource: true,
        profile: {
          select: {
            level: true,
            experience: true,
            vocation: true,
            guildName: true,
            residence: true,
            sex: true,
            lastFetchedAt: true,
          },
        },
      },
    });

    if (!character) {
      throw new NotFoundException(`Character "${name}" not found`);
    }

    return plainToInstance(
      CharacterProfileResponseDto,
      {
        id: character.id,
        name: character.name,
        world: character.world,
        level: character.profile?.level ?? null,
        experience: character.profile?.experience ?? null,
        vocation: character.profile?.vocation ?? null,
        guildName: character.profile?.guildName ?? null,
        residence: character.profile?.residence ?? null,
        sex: character.profile?.sex ?? null,
        lastFetchedAt: character.profile?.lastFetchedAt ?? null,
        lastSeenAt: character.lastSeenAt,
        lastSeenOnlineAt: character.lastSeenOnlineAt,
        isConfirmedWorld: character.isConfirmedWorld,
        discoverySource: character.discoverySource,
      },
      { excludeExtraneousValues: true },
    );
  }

  async getSnapshots(name: string, filters: SnapshotsQueryDto) {
    const { from, to, limit = 100 } = filters;

    const character = await this.prisma.character.findFirst({
      where: { name: { equals: toTitleCase(name) } },
      select: { id: true, name: true, world: true },
    });

    if (!character) {
      throw new NotFoundException(`Character "${name}" not found`);
    }

    if (from && to && from > to) {
      throw new BadRequestException('from must be before or equal to to');
    }

    const where: Record<string, unknown> = { characterId: character.id };

    if (from) where.collectedAt = { ...(where.collectedAt as object), gte: new Date(from) };
    if (to) where.collectedAt = { ...(where.collectedAt as object), lte: new Date(to) };

    const snapshots = await this.prisma.characterSnapshot.findMany({
      where,
      orderBy: { collectedAt: 'desc' },
      take: limit,
      select: {
        collectedAt: true,
        level: true,
        experience: true,
        vocation: true,
        guildName: true,
        sourceType: true,
      },
    });

    return plainToInstance(
      SnapshotsResponseDto,
      { characterName: character.name, world: character.world, snapshots },
      { excludeExtraneousValues: true },
    );
  }

  async getDailyXp(name: string, filters: DailyXpQueryDto) {
    const { from, to, limit = 30 } = filters;

    const character = await this.prisma.character.findFirst({
      where: { name: { equals: toTitleCase(name) } },
      select: { id: true, name: true, world: true },
    });

    if (!character) {
      throw new NotFoundException(`Character "${name}" not found`);
    }

    if (from && to && from > to) {
      throw new BadRequestException('from must be before or equal to to');
    }

    const where: Record<string, unknown> = { characterId: character.id };
    if (from) where.date = { ...(where.date as object), gte: from };
    if (to) where.date = { ...(where.date as object), lte: to };

    const metrics = await this.prisma.characterDailyMetric.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
      select: {
        date: true,
        expGained: true,
        expStart: true,
        expEnd: true,
        levelStart: true,
        levelEnd: true,
        levelsGained: true,
        deathsCount: true,
      },
    });

    return plainToInstance(
      DailyXpResponseDto,
      { characterName: character.name, world: character.world, metrics },
      { excludeExtraneousValues: true },
    );
  }
}

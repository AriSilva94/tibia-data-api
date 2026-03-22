import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../../prisma/prisma.service';
import { CharacterListQueryDto } from './dto/character-list-query.dto';
import { CharacterProfileResponseDto } from './dto/character-profile-response.dto';
import { CharacterResponseDto } from './dto/character-response.dto';

const ONLINE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

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
      where: { name: { equals: name } },
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
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../../prisma/prisma.service';
import { WorldOnlineResponseDto } from './dto/world-online-response.dto';
import { WorldResponseDto } from './dto/world-response.dto';

const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

@Injectable()
export class WorldsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllTracked() {
    const worlds = await this.prisma.world.findMany({
      where: { isTracked: true },
      select: {
        id: true,
        name: true,
        region: true,
        pvpType: true,
        isTracked: true,
        lastOnlineCount: true,
        createdAt: true,
      },
    });

    return plainToInstance(WorldResponseDto, worlds, { excludeExtraneousValues: true });
  }

  async findByName(name: string) {
    const world = await this.prisma.world.findUnique({
      where: { name },
      select: {
        id: true,
        name: true,
        region: true,
        pvpType: true,
        isTracked: true,
        lastOnlineCount: true,
        createdAt: true,
      },
    });

    if (!world) {
      throw new NotFoundException(`World "${name}" not found`);
    }

    return plainToInstance(WorldResponseDto, world, { excludeExtraneousValues: true });
  }

  async getOnlineSnapshot(name: string) {
    const world = await this.prisma.world.findFirst({
      where: { name: { equals: name } },
      select: { name: true },
    });

    if (!world) {
      throw new NotFoundException(`World "${name}" not found`);
    }

    const latestSnapshot = await this.prisma.onlineWorldSnapshot.findFirst({
      where: { world: world.name },
      orderBy: { collectedAt: 'desc' },
      select: { collectedAt: true, onlineCount: true },
    });

    if (!latestSnapshot) {
      throw new NotFoundException(`No online snapshot found for world "${name}"`);
    }

    const players = await this.prisma.onlinePlayerSnapshot.findMany({
      where: {
        world: world.name,
        collectedAt: latestSnapshot.collectedAt,
      },
      select: {
        characterName: true,
        level: true,
        vocation: true,
      },
    });

    const isStale =
      Date.now() - latestSnapshot.collectedAt.getTime() > STALE_THRESHOLD_MS;

    return plainToInstance(
      WorldOnlineResponseDto,
      {
        world: world.name,
        collectedAt: latestSnapshot.collectedAt,
        isStale,
        onlineCount: latestSnapshot.onlineCount,
        players,
      },
      { excludeExtraneousValues: true },
    );
  }
}

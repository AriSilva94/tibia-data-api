import { Injectable, Logger } from '@nestjs/common';
import { Character } from '@prisma/client';
import { DiscoverySource } from '../../common/enums/discovery-source.enum';
import { PrismaService } from '../../prisma/prisma.service';

export interface DiscoverInput {
  characterName: string;
  world: string;
  source: DiscoverySource;
  sourceKey?: string;
  seenOnlineAt?: Date;
}

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async discover(input: DiscoverInput): Promise<void> {
    const { characterName, world, source, sourceKey, seenOnlineAt } = input;
    const now = new Date();

    await this.prisma.character.upsert({
      where: { name_world: { name: characterName, world } },
      create: {
        name: characterName,
        world,
        isConfirmedWorld: false,
        isActiveCandidate: true,
        discoverySource: source,
        lastSeenAt: now,
        ...(seenOnlineAt ? { lastSeenOnlineAt: seenOnlineAt } : {}),
      },
      update: {
        lastSeenAt: now,
        ...(seenOnlineAt ? { lastSeenOnlineAt: seenOnlineAt } : {}),
      },
    });

    await this.prisma.discoveryEdge.create({
      data: {
        world,
        sourceType: source,
        sourceKey: sourceKey ?? source,
        characterName,
      },
    });

    this.logger.debug(
      `Discovered "${characterName}" on "${world}" via ${source}`,
    );
  }

  async confirmWorld(characterName: string, world: string): Promise<void> {
    await this.prisma.character.update({
      where: { name_world: { name: characterName, world } },
      data: {
        isConfirmedWorld: true,
        lastProfileScanAt: new Date(),
      },
    });

    this.logger.debug(`Confirmed world for "${characterName}" on "${world}"`);
  }

  async getDiscoveryQueue(world: string, limit: number): Promise<Character[]> {
    // isConfirmedWorld: 'asc' → false (0) sorts before true (1), prioritizing unconfirmed characters
    // lastProfileScanAt: 'asc' → NULL sorts first in SQLite, prioritizing never-scanned characters
    return this.prisma.character.findMany({
      where: { world, isActiveCandidate: true },
      orderBy: [
        { isConfirmedWorld: 'asc' },
        { lastProfileScanAt: 'asc' },
      ],
      take: limit,
    });
  }
}

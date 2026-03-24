import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../../prisma/prisma.service';
import { WorldResponseDto } from './dto/world-response.dto';

@Injectable()
export class WorldsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const worlds = await this.prisma.world.findMany({
      orderBy: { name: 'asc' },
    });
    return plainToInstance(WorldResponseDto, worlds, { excludeExtraneousValues: true });
  }

  async findByName(name: string) {
    const world = await this.prisma.world.findUnique({ where: { name } });
    if (!world) throw new NotFoundException(`World "${name}" not found`);
    return plainToInstance(WorldResponseDto, world, { excludeExtraneousValues: true });
  }
}

import { Controller, Get, Param } from '@nestjs/common';
import { WorldsService } from './worlds.service';

@Controller('worlds')
export class WorldsController {
  constructor(private readonly worldsService: WorldsService) {}

  @Get()
  findAll() {
    return this.worldsService.findAll();
  }

  @Get(':name')
  findOne(@Param('name') name: string) {
    return this.worldsService.findByName(name);
  }
}

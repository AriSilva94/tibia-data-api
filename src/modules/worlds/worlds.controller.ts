import {
  Controller,
  Get,
  Param,
  SerializeOptions,
  UseInterceptors,
} from '@nestjs/common';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { WorldsService } from './worlds.service';

@UseInterceptors(ClassSerializerInterceptor)
@SerializeOptions({ excludeExtraneousValues: true })
@Controller('worlds')
export class WorldsController {
  constructor(private readonly worldsService: WorldsService) {}

  @Get()
  findAll() {
    return this.worldsService.findAllTracked();
  }

  @Get(':name')
  findOne(@Param('name') name: string) {
    return this.worldsService.findByName(name);
  }

  @Get(':name/online')
  getOnline(@Param('name') name: string) {
    return this.worldsService.getOnlineSnapshot(name);
  }
}

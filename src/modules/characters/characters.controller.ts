import { Controller, Get, Param, Query } from '@nestjs/common';
import { CharactersService } from './characters.service';
import { CharacterListQueryDto } from './dto/character-list-query.dto';
import { DailyXpQueryDto } from './dto/daily-xp-query.dto';
import { SnapshotsQueryDto } from './dto/snapshots-query.dto';

@Controller('characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Get()
  findAll(@Query() query: CharacterListQueryDto) {
    return this.charactersService.findAll(query);
  }

  @Get(':name/snapshots')
  getSnapshots(@Param('name') name: string, @Query() query: SnapshotsQueryDto) {
    return this.charactersService.getSnapshots(name, query);
  }

  @Get(':name/xp')
  getDailyXp(@Param('name') name: string, @Query() query: DailyXpQueryDto) {
    return this.charactersService.getDailyXp(name, query);
  }

  @Get(':name')
  findOne(@Param('name') name: string) {
    return this.charactersService.findByName(name);
  }
}

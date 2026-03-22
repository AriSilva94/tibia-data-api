import { Controller, Get, Param, Query } from '@nestjs/common';
import { CharactersService } from './characters.service';
import { CharacterListQueryDto } from './dto/character-list-query.dto';

@Controller('characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Get()
  findAll(@Query() query: CharacterListQueryDto) {
    return this.charactersService.findAll(query);
  }

  @Get(':name')
  findOne(@Param('name') name: string) {
    return this.charactersService.findByName(name);
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { HighscoresQueryDto } from './dto/highscores-query.dto';
import { HighscoresService } from './highscores.service';

@Controller('highscores')
export class HighscoresController {
  constructor(private readonly highscoresService: HighscoresService) {}

  @Get()
  findLatest(@Query() query: HighscoresQueryDto) {
    return this.highscoresService.findLatest(query);
  }
}

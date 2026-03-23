import { Module } from '@nestjs/common';
import { TibiaHttpClientService } from './services/tibia-http-client.service';
import { TibiaRateLimitService } from './services/tibia-rate-limit.service';
import { OnlineParser } from './parsers/online.parser';
import { HighscoresParser } from './parsers/highscores.parser';
import { CharacterParser } from './parsers/character.parser';

@Module({
  providers: [
    TibiaHttpClientService,
    TibiaRateLimitService,
    OnlineParser,
    HighscoresParser,
    CharacterParser,
  ],
  exports: [
    TibiaHttpClientService,
    TibiaRateLimitService,
    OnlineParser,
    HighscoresParser,
    CharacterParser,
  ],
})
export class CollectorModule {}

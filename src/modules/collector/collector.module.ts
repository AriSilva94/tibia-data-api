import { Module } from '@nestjs/common';
import { TibiaHttpClientService } from './services/tibia-http-client.service';
import { TibiaRateLimitService } from './services/tibia-rate-limit.service';
import { WorldsListParser } from './parsers/worlds-list.parser';

@Module({
  providers: [TibiaHttpClientService, TibiaRateLimitService, WorldsListParser],
  exports: [TibiaHttpClientService, TibiaRateLimitService, WorldsListParser],
})
export class CollectorModule {}

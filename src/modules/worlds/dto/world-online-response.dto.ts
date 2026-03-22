import { Expose, Type } from 'class-transformer';

export class OnlinePlayerDto {
  @Expose()
  characterName: string;

  @Expose()
  level: number | null;

  @Expose()
  vocation: string | null;
}

export class WorldOnlineResponseDto {
  @Expose()
  world: string;

  @Expose()
  collectedAt: Date;

  @Expose()
  isStale: boolean;

  @Expose()
  onlineCount: number;

  @Expose()
  @Type(() => OnlinePlayerDto)
  players: OnlinePlayerDto[];
}

import { Expose, Type } from 'class-transformer';

export class DeathItemDto {
  @Expose()
  deathAt: Date;

  @Expose()
  level: number | null;

  @Expose()
  killersRaw: string | null;

  @Expose()
  collectedAt: Date;
}

export class DeathsResponseDto {
  @Expose()
  characterName: string;

  @Expose()
  world: string;

  @Expose()
  @Type(() => DeathItemDto)
  deaths: DeathItemDto[];
}

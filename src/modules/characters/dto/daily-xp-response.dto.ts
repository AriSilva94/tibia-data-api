import { Expose, Transform, Type } from 'class-transformer';

export class DailyXpItemDto {
  @Expose()
  date: string;

  @Expose()
  @Transform(({ value }) => (value != null ? value.toString() : null))
  expGained: string | null;

  @Expose()
  @Transform(({ value }) => (value != null ? value.toString() : null))
  expStart: string | null;

  @Expose()
  @Transform(({ value }) => (value != null ? value.toString() : null))
  expEnd: string | null;

  @Expose()
  levelStart: number | null;

  @Expose()
  levelEnd: number | null;

  @Expose()
  levelsGained: number | null;

  @Expose()
  deathsCount: number;
}

export class DailyXpResponseDto {
  @Expose()
  characterName: string;

  @Expose()
  world: string;

  @Expose()
  @Type(() => DailyXpItemDto)
  metrics: DailyXpItemDto[];
}

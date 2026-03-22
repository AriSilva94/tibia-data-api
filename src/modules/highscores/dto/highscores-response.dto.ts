import { Expose, Transform, Type } from 'class-transformer';

export class HighscoreEntryDto {
  @Expose()
  rank: number;

  @Expose()
  characterName: string;

  @Expose()
  vocation: string;

  @Expose()
  @Transform(({ value }) => (value != null ? value.toString() : null))
  value: string | null;
}

export class HighscoresResponseDto {
  @Expose()
  world: string;

  @Expose()
  category: string;

  @Expose()
  page: number;

  @Expose()
  collectedAt: Date;

  @Expose()
  isStale: boolean;

  @Expose()
  @Type(() => HighscoreEntryDto)
  entries: HighscoreEntryDto[];
}

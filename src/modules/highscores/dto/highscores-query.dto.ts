import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, Min } from 'class-validator';

export const VALID_HIGHSCORE_CATEGORIES = [
  'experience',
  'magic',
  'shielding',
  'distance',
  'sword',
  'club',
  'axe',
  'fist',
  'fishing',
  'achievement',
  'loyalty',
] as const;

export type HighscoreCategory = (typeof VALID_HIGHSCORE_CATEGORIES)[number];

export class HighscoresQueryDto {
  @IsNotEmpty()
  @IsString()
  world: string;

  @IsNotEmpty()
  @IsIn(VALID_HIGHSCORE_CATEGORIES)
  category: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : 1))
  page?: number = 1;
}

import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CharacterListQueryDto {
  @IsOptional()
  @IsString()
  world?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isOnline?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : value))
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : value))
  limit?: number = 50;
}

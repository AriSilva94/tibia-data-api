import { Transform } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class DeathsQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }) =>
    value && DATE_ONLY_REGEX.test(value) ? `${value}T23:59:59.999Z` : value,
  )
  to?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : 50))
  limit?: number = 50;
}

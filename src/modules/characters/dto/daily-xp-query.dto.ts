import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Matches, Max, Min } from 'class-validator';

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DATE_ONLY_MESSAGE = 'must be a date in YYYY-MM-DD format';

export class DailyXpQueryDto {
  @IsOptional()
  @Matches(DATE_ONLY_REGEX, { message: `from ${DATE_ONLY_MESSAGE}` })
  from?: string;

  @IsOptional()
  @Matches(DATE_ONLY_REGEX, { message: `to ${DATE_ONLY_MESSAGE}` })
  to?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : 30))
  limit?: number = 30;
}

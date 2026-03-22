import { Expose, Transform } from 'class-transformer';

export class CharacterProfileResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  world: string;

  @Expose()
  level: number | null;

  @Expose()
  @Transform(({ value }) => (value != null ? value.toString() : null))
  experience: string | null;

  @Expose()
  vocation: string | null;

  @Expose()
  guildName: string | null;

  @Expose()
  residence: string | null;

  @Expose()
  sex: string | null;

  @Expose()
  lastFetchedAt: Date | null;

  @Expose()
  lastSeenAt: Date | null;

  @Expose()
  lastSeenOnlineAt: Date | null;

  @Expose()
  isConfirmedWorld: boolean;

  @Expose()
  discoverySource: string | null;
}

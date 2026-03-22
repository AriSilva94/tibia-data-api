import { Expose } from 'class-transformer';

export class CharacterResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  world: string;

  @Expose()
  level: number | null;

  @Expose()
  vocation: string | null;

  @Expose()
  lastSeenAt: Date | null;

  @Expose()
  lastSeenOnlineAt: Date | null;

  @Expose()
  isConfirmedWorld: boolean;
}

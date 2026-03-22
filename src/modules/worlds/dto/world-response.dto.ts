import { Expose } from 'class-transformer';

export class WorldResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  region: string | null;

  @Expose()
  pvpType: string | null;

  @Expose()
  isTracked: boolean;

  @Expose()
  lastOnlineCount: number | null;

  @Expose()
  createdAt: Date;
}

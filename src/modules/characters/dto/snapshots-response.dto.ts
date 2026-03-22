import { Expose, Transform, Type } from 'class-transformer';

export class SnapshotItemDto {
  @Expose()
  collectedAt: Date;

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
  sourceType: string | null;
}

export class SnapshotsResponseDto {
  @Expose()
  characterName: string;

  @Expose()
  world: string;

  @Expose()
  @Type(() => SnapshotItemDto)
  snapshots: SnapshotItemDto[];
}

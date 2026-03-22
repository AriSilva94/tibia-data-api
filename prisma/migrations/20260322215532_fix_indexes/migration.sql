-- DropIndex
DROP INDEX "character_deaths_dedupeHash_idx";

-- DropIndex
DROP INDEX "online_players_snapshots_collectedAt_idx";

-- DropIndex
DROP INDEX "online_players_snapshots_world_idx";

-- CreateIndex
CREATE INDEX "online_players_snapshots_world_collectedAt_idx" ON "online_players_snapshots"("world", "collectedAt");

/*
  Warnings:

  - Added the required column `snapshotDate` to the `highscores_snapshots` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_highscores_snapshots" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "world" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "snapshotDate" TEXT NOT NULL,
    "page" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "characterName" TEXT NOT NULL,
    "vocation" TEXT,
    "value" BIGINT,
    "collectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_highscores_snapshots" ("category", "characterName", "collectedAt", "createdAt", "id", "page", "rank", "value", "vocation", "world") SELECT "category", "characterName", "collectedAt", "createdAt", "id", "page", "rank", "value", "vocation", "world" FROM "highscores_snapshots";
DROP TABLE "highscores_snapshots";
ALTER TABLE "new_highscores_snapshots" RENAME TO "highscores_snapshots";
CREATE INDEX "highscores_snapshots_world_idx" ON "highscores_snapshots"("world");
CREATE INDEX "highscores_snapshots_collectedAt_idx" ON "highscores_snapshots"("collectedAt");
CREATE UNIQUE INDEX "highscores_snapshots_world_category_rank_snapshotDate_key" ON "highscores_snapshots"("world", "category", "rank", "snapshotDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

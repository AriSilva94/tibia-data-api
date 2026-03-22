-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "worlds" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "region" TEXT,
    "pvpType" TEXT,
    "creationDate" TEXT,
    "isTracked" BOOLEAN NOT NULL DEFAULT false,
    "lastOnlineCount" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "characters" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "world" TEXT NOT NULL,
    "isConfirmedWorld" BOOLEAN NOT NULL DEFAULT false,
    "discoverySource" TEXT,
    "firstSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME,
    "lastSeenOnlineAt" DATETIME,
    "lastProfileScanAt" DATETIME,
    "isActiveCandidate" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "character_profiles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "characterId" INTEGER NOT NULL,
    "world" TEXT NOT NULL,
    "level" INTEGER,
    "experience" BIGINT,
    "vocation" TEXT,
    "guildName" TEXT,
    "residence" TEXT,
    "sex" TEXT,
    "formerNamesRaw" TEXT,
    "accountStatusRaw" TEXT,
    "lastFetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "character_profiles_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "character_snapshots" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "characterId" INTEGER NOT NULL,
    "world" TEXT NOT NULL,
    "collectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" INTEGER,
    "experience" BIGINT,
    "vocation" TEXT,
    "guildName" TEXT,
    "statusOnline" BOOLEAN NOT NULL DEFAULT false,
    "sourceType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "character_snapshots_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "character_daily_metrics" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "characterId" INTEGER NOT NULL,
    "world" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "expStart" BIGINT,
    "expEnd" BIGINT,
    "expGained" BIGINT,
    "levelStart" INTEGER,
    "levelEnd" INTEGER,
    "levelsGained" INTEGER,
    "deathsCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "character_daily_metrics_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "character_deaths" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "characterId" INTEGER NOT NULL,
    "world" TEXT NOT NULL,
    "deathAt" DATETIME NOT NULL,
    "level" INTEGER,
    "killersRaw" TEXT,
    "dedupeHash" TEXT NOT NULL,
    "collectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "character_deaths_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "online_world_snapshots" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "world" TEXT NOT NULL,
    "collectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "onlineCount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "online_players_snapshots" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "world" TEXT NOT NULL,
    "collectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "characterName" TEXT NOT NULL,
    "level" INTEGER,
    "vocation" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "highscores_snapshots" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "world" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "page" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "characterName" TEXT NOT NULL,
    "vocation" TEXT,
    "value" BIGINT,
    "collectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "discovery_edges" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "world" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "characterName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "worlds_name_key" ON "worlds"("name");

-- CreateIndex
CREATE INDEX "characters_name_idx" ON "characters"("name");

-- CreateIndex
CREATE INDEX "characters_world_idx" ON "characters"("world");

-- CreateIndex
CREATE UNIQUE INDEX "characters_name_world_key" ON "characters"("name", "world");

-- CreateIndex
CREATE UNIQUE INDEX "character_profiles_characterId_key" ON "character_profiles"("characterId");

-- CreateIndex
CREATE INDEX "character_snapshots_characterId_idx" ON "character_snapshots"("characterId");

-- CreateIndex
CREATE INDEX "character_snapshots_collectedAt_idx" ON "character_snapshots"("collectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "character_daily_metrics_characterId_date_key" ON "character_daily_metrics"("characterId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "character_deaths_dedupeHash_key" ON "character_deaths"("dedupeHash");

-- CreateIndex
CREATE INDEX "character_deaths_dedupeHash_idx" ON "character_deaths"("dedupeHash");

-- CreateIndex
CREATE INDEX "online_world_snapshots_world_idx" ON "online_world_snapshots"("world");

-- CreateIndex
CREATE INDEX "online_world_snapshots_collectedAt_idx" ON "online_world_snapshots"("collectedAt");

-- CreateIndex
CREATE INDEX "online_players_snapshots_world_idx" ON "online_players_snapshots"("world");

-- CreateIndex
CREATE INDEX "online_players_snapshots_collectedAt_idx" ON "online_players_snapshots"("collectedAt");

-- CreateIndex
CREATE INDEX "highscores_snapshots_world_idx" ON "highscores_snapshots"("world");

-- CreateIndex
CREATE INDEX "highscores_snapshots_collectedAt_idx" ON "highscores_snapshots"("collectedAt");

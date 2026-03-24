-- CreateTable
CREATE TABLE "worlds" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "region" TEXT,
    "pvpType" TEXT,
    "isTracked" BOOLEAN NOT NULL DEFAULT false,
    "lastOnlineCount" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "worlds_name_key" ON "worlds"("name");

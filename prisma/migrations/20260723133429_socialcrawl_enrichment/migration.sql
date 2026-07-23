-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EmployeeEnrichment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'ensembledata',
    "query" TEXT NOT NULL,
    "matchedUsername" TEXT,
    "matchedFullName" TEXT,
    "bio" TEXT,
    "followers" INTEGER,
    "verified" BOOLEAN,
    "engagementRate" REAL,
    "profileUrl" TEXT,
    "raw" TEXT,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmployeeEnrichment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_EmployeeEnrichment" ("bio", "employeeId", "fetchedAt", "followers", "id", "matchedFullName", "matchedUsername", "profileUrl", "provider", "query", "raw") SELECT "bio", "employeeId", "fetchedAt", "followers", "id", "matchedFullName", "matchedUsername", "profileUrl", "provider", "query", "raw" FROM "EmployeeEnrichment";
DROP TABLE "EmployeeEnrichment";
ALTER TABLE "new_EmployeeEnrichment" RENAME TO "EmployeeEnrichment";
CREATE INDEX "EmployeeEnrichment_employeeId_idx" ON "EmployeeEnrichment"("employeeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cedula" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "antiguedad" INTEGER NOT NULL,
    "rol" TEXT NOT NULL,
    "salario" INTEGER NOT NULL,
    "correo" TEXT NOT NULL,
    "edad" INTEGER NOT NULL,
    "hijos" INTEGER NOT NULL,
    "genero" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linkedUserId" TEXT,
    CONSTRAINT "Employee_linkedUserId_fkey" FOREIGN KEY ("linkedUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmployeeEnrichment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "matchedUsername" TEXT,
    "matchedFullName" TEXT,
    "bio" TEXT,
    "followers" INTEGER,
    "profileUrl" TEXT,
    "raw" TEXT,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmployeeEnrichment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CreditProductScore" (
    "employeeId" TEXT NOT NULL PRIMARY KEY,
    "cupoCredito" REAL NOT NULL,
    "consumo" REAL NOT NULL,
    "vivienda" REAL NOT NULL,
    "mujeres" REAL NOT NULL,
    "educativo" REAL NOT NULL,
    "topProduct" TEXT NOT NULL,
    "computedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CreditProductScore_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_cedula_key" ON "Employee"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_linkedUserId_key" ON "Employee"("linkedUserId");

-- CreateIndex
CREATE INDEX "Employee_cedula_idx" ON "Employee"("cedula");

-- CreateIndex
CREATE INDEX "EmployeeEnrichment_employeeId_idx" ON "EmployeeEnrichment"("employeeId");

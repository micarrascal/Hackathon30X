-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "cookieId" TEXT NOT NULL,
    "isIdentified" BOOLEAN NOT NULL DEFAULT false,
    "email" TEXT,
    "phone" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "consentDate" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "deviceType" TEXT NOT NULL,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "landingPage" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "pageUrl" TEXT,
    "searchTerm" TEXT,
    "elementClicked" TEXT,
    "metadata" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoringRule" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "pagePattern" TEXT,
    "points" INTEGER NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "ScoringRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntentScore" (
    "userId" TEXT NOT NULL,
    "currentScore" INTEGER NOT NULL DEFAULT 0,
    "scoreUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadStatus" TEXT NOT NULL DEFAULT 'frio',

    CONSTRAINT "IntentScore_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linkedUserId" TEXT,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeEnrichment" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'ensembledata',
    "query" TEXT NOT NULL,
    "matchedUsername" TEXT,
    "matchedFullName" TEXT,
    "bio" TEXT,
    "followers" INTEGER,
    "verified" BOOLEAN,
    "engagementRate" DOUBLE PRECISION,
    "profileUrl" TEXT,
    "raw" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeEnrichment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditProductScore" (
    "employeeId" TEXT NOT NULL,
    "cupoCredito" DOUBLE PRECISION NOT NULL,
    "consumo" DOUBLE PRECISION NOT NULL,
    "vivienda" DOUBLE PRECISION NOT NULL,
    "mujeres" DOUBLE PRECISION NOT NULL,
    "educativo" DOUBLE PRECISION NOT NULL,
    "topProduct" TEXT NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditProductScore_pkey" PRIMARY KEY ("employeeId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_cookieId_key" ON "User"("cookieId");

-- CreateIndex
CREATE INDEX "User_lastSeenAt_idx" ON "User"("lastSeenAt");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Event_userId_idx" ON "Event"("userId");

-- CreateIndex
CREATE INDEX "Event_sessionId_idx" ON "Event"("sessionId");

-- CreateIndex
CREATE INDEX "Event_eventType_idx" ON "Event"("eventType");

-- CreateIndex
CREATE INDEX "Event_occurredAt_idx" ON "Event"("occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_cedula_key" ON "Employee"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_linkedUserId_key" ON "Employee"("linkedUserId");

-- CreateIndex
CREATE INDEX "Employee_cedula_idx" ON "Employee"("cedula");

-- CreateIndex
CREATE INDEX "EmployeeEnrichment_employeeId_idx" ON "EmployeeEnrichment"("employeeId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntentScore" ADD CONSTRAINT "IntentScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_linkedUserId_fkey" FOREIGN KEY ("linkedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeEnrichment" ADD CONSTRAINT "EmployeeEnrichment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditProductScore" ADD CONSTRAINT "CreditProductScore_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

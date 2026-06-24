-- CreateEnum
CREATE TYPE "BugStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'FIXED', 'CLOSED', 'DUPLICATE');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateTable
CREATE TABLE "Bug" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" "BugStatus" NOT NULL DEFAULT 'OPEN',
    "pageUrl" TEXT NOT NULL,
    "pageTitle" TEXT,
    "userAgent" TEXT NOT NULL,
    "screenWidth" INTEGER NOT NULL,
    "screenHeight" INTEGER NOT NULL,
    "viewportWidth" INTEGER,
    "viewportHeight" INTEGER,
    "rrwebEvents" JSONB NOT NULL,
    "consoleLogs" JSONB NOT NULL,
    "networkFails" JSONB NOT NULL,
    "screenshotDataUrl" TEXT,
    "playwrightScript" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bug_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BugReport" (
    "id" TEXT NOT NULL,
    "bugId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "stepsToReproduce" JSONB NOT NULL,
    "expectedBehaviour" TEXT NOT NULL,
    "actualBehaviour" TEXT NOT NULL,
    "suspectedCause" TEXT,
    "severity" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BugReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BugMessage" (
    "id" TEXT NOT NULL,
    "bugId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BugMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Bug_projectId_idx" ON "Bug"("projectId");

-- CreateIndex
CREATE INDEX "Bug_projectId_capturedAt_idx" ON "Bug"("projectId", "capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BugReport_bugId_key" ON "BugReport"("bugId");

-- CreateIndex
CREATE INDEX "BugMessage_bugId_idx" ON "BugMessage"("bugId");

-- AddForeignKey
ALTER TABLE "Bug" ADD CONSTRAINT "Bug_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BugReport" ADD CONSTRAINT "BugReport_bugId_fkey" FOREIGN KEY ("bugId") REFERENCES "Bug"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BugMessage" ADD CONSTRAINT "BugMessage_bugId_fkey" FOREIGN KEY ("bugId") REFERENCES "Bug"("id") ON DELETE CASCADE ON UPDATE CASCADE;

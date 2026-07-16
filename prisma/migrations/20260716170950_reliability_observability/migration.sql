-- CreateTable
CREATE TABLE "reliability_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'open',
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "externalRef" TEXT,
    "metadata" JSONB,
    "acknowledgedBy" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reliability_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reliability_events_organizationId_status_severity_createdAt_idx" ON "reliability_events"("organizationId", "status", "severity", "createdAt");

-- CreateIndex
CREATE INDEX "reliability_events_organizationId_category_createdAt_idx" ON "reliability_events"("organizationId", "category", "createdAt");

-- AddForeignKey
ALTER TABLE "reliability_events" ADD CONSTRAINT "reliability_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

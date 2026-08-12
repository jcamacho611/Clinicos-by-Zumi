CREATE TABLE "GridDisputeRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "openedByOrganizationId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "requestedOutcome" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolutionNote" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GridDisputeRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GridDisputeRecord_reservationId_status_idx"
ON "GridDisputeRecord"("reservationId", "status");

CREATE INDEX "GridDisputeRecord_openedByOrganizationId_updatedAt_idx"
ON "GridDisputeRecord"("openedByOrganizationId", "updatedAt");

ALTER TABLE "GridDisputeRecord"
ADD CONSTRAINT "GridDisputeRecord_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GridDisputeRecord"
ADD CONSTRAINT "GridDisputeRecord_reservationId_fkey"
FOREIGN KEY ("reservationId") REFERENCES "GridReservationRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GridDisputeRecord"
ADD CONSTRAINT "GridDisputeRecord_openedByOrganizationId_fkey"
FOREIGN KEY ("openedByOrganizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "GridDisputeEventRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "note" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GridDisputeEventRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GridDisputeEventRecord_disputeId_createdAt_idx"
ON "GridDisputeEventRecord"("disputeId", "createdAt");

ALTER TABLE "GridDisputeEventRecord"
ADD CONSTRAINT "GridDisputeEventRecord_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GridDisputeEventRecord"
ADD CONSTRAINT "GridDisputeEventRecord_disputeId_fkey"
FOREIGN KEY ("disputeId") REFERENCES "GridDisputeRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "GridSafetyIncidentRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "reportedByOrganizationId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "providerId" TEXT,
    "locationId" TEXT,
    "resourceKind" TEXT,
    "resourceReference" TEXT,
    "resolutionNote" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GridSafetyIncidentRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GridSafetyIncidentRecord_reservationId_status_idx"
ON "GridSafetyIncidentRecord"("reservationId", "status");

CREATE INDEX "GridSafetyIncidentRecord_reportedByOrganizationId_updatedAt_idx"
ON "GridSafetyIncidentRecord"("reportedByOrganizationId", "updatedAt");

ALTER TABLE "GridSafetyIncidentRecord"
ADD CONSTRAINT "GridSafetyIncidentRecord_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GridSafetyIncidentRecord"
ADD CONSTRAINT "GridSafetyIncidentRecord_reservationId_fkey"
FOREIGN KEY ("reservationId") REFERENCES "GridReservationRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GridSafetyIncidentRecord"
ADD CONSTRAINT "GridSafetyIncidentRecord_reportedByOrganizationId_fkey"
FOREIGN KEY ("reportedByOrganizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "GridSafetyIncidentEventRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "note" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GridSafetyIncidentEventRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GridSafetyIncidentEventRecord_incidentId_createdAt_idx"
ON "GridSafetyIncidentEventRecord"("incidentId", "createdAt");

ALTER TABLE "GridSafetyIncidentEventRecord"
ADD CONSTRAINT "GridSafetyIncidentEventRecord_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GridSafetyIncidentEventRecord"
ADD CONSTRAINT "GridSafetyIncidentEventRecord_incidentId_fkey"
FOREIGN KEY ("incidentId") REFERENCES "GridSafetyIncidentRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

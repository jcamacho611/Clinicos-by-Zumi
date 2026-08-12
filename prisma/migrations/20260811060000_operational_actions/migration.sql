-- Actions Klinikos prepared or performed for a detected operational risk.
CREATE TABLE "operational_actions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "riskKind" TEXT NOT NULL,
    "actionKind" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'prepared',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "taskId" TEXT,
    "decidedByUserId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operational_actions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "operational_actions_appointmentId_riskKind_actionKind_key" ON "operational_actions"("appointmentId", "riskKind", "actionKind");
CREATE INDEX "operational_actions_organizationId_state_detectedAt_idx" ON "operational_actions"("organizationId", "state", "detectedAt");
CREATE INDEX "operational_actions_organizationId_riskKind_idx" ON "operational_actions"("organizationId", "riskKind");

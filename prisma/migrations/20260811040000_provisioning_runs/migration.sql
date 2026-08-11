-- Payment-driven provisioning ledger. Keyed by the payment's own identity so a
-- webhook redelivery resolves to the same row and provisions nothing twice.
CREATE TABLE "provisioning_runs" (
    "id" TEXT NOT NULL,
    "provisioningKey" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tierKey" TEXT,
    "planKey" TEXT,
    "organizationId" TEXT,
    "subscriptionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "steps" JSONB NOT NULL,
    "modules" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "outstanding" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "failureReason" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provisioning_runs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "provisioning_runs_provisioningKey_key" ON "provisioning_runs"("provisioningKey");
CREATE INDEX "provisioning_runs_email_status_idx" ON "provisioning_runs"("email", "status");
CREATE INDEX "provisioning_runs_organizationId_idx" ON "provisioning_runs"("organizationId");
CREATE INDEX "provisioning_runs_status_updatedAt_idx" ON "provisioning_runs"("status", "updatedAt");

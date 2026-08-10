-- Zumi AI Gateway: metering and accountability record for every AI invocation.
-- Stores no prompt text and no model output by design.
CREATE TABLE "zumi_invocations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "capability" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "reason" TEXT,
    "providerKey" TEXT,
    "modelId" TEXT,
    "promptVersion" TEXT,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "costMicroUsd" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "humanReviewRequired" BOOLEAN NOT NULL DEFAULT true,
    "redactionApplied" BOOLEAN NOT NULL DEFAULT false,
    "droppedKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "auditLogId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zumi_invocations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "zumi_invocations_organizationId_createdAt_idx" ON "zumi_invocations"("organizationId", "createdAt");

CREATE INDEX "zumi_invocations_organizationId_capability_createdAt_idx" ON "zumi_invocations"("organizationId", "capability", "createdAt");

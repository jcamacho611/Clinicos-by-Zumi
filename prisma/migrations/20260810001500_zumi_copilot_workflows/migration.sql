-- Connect the existing AI, voice, task, escalation, review, and audit foundations
-- through one tenant-scoped Zumi Copilot workflow ledger.
CREATE TABLE "copilot_runs" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "patientId" TEXT,
  "inputMode" TEXT NOT NULL DEFAULT 'typed',
  "inputText" TEXT NOT NULL,
  "intentKey" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "riskLevel" "RiskLevel" NOT NULL,
  "assignedTeam" TEXT NOT NULL,
  "confidence" DECIMAL(5,4),
  "status" TEXT NOT NULL DEFAULT 'awaiting_review',
  "engine" TEXT NOT NULL DEFAULT 'deterministic_local',
  "rulesVersion" TEXT NOT NULL,
  "aiClassificationId" TEXT,
  "aiDraftId" TEXT,
  "voiceSessionId" TEXT,
  "requiresHumanReview" BOOLEAN NOT NULL DEFAULT true,
  "blockedFromExecution" BOOLEAN NOT NULL DEFAULT true,
  "provenance" JSONB NOT NULL,
  "limitations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "copilot_runs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "copilot_runs_input_mode_check" CHECK ("inputMode" IN ('typed', 'voice')),
  CONSTRAINT "copilot_runs_status_check" CHECK ("status" IN ('awaiting_review', 'urgent_hold', 'reviewed', 'rejected')),
  CONSTRAINT "copilot_runs_engine_check" CHECK ("engine" IN ('deterministic_local', 'approved_provider_adapter')),
  CONSTRAINT "copilot_runs_human_review_check" CHECK ("requiresHumanReview" = true AND "blockedFromExecution" = true)
);

CREATE TABLE "copilot_events" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "actorId" TEXT,
  "actorType" TEXT NOT NULL DEFAULT 'system',
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "detail" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "copilot_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "copilot_events_actor_type_check" CHECK ("actorType" IN ('user', 'system'))
);

CREATE INDEX "copilot_runs_organizationId_status_createdAt_idx" ON "copilot_runs"("organizationId", "status", "createdAt");
CREATE INDEX "copilot_runs_organizationId_patientId_createdAt_idx" ON "copilot_runs"("organizationId", "patientId", "createdAt");
CREATE INDEX "copilot_runs_userId_createdAt_idx" ON "copilot_runs"("userId", "createdAt");
CREATE INDEX "copilot_events_organizationId_createdAt_idx" ON "copilot_events"("organizationId", "createdAt");
CREATE INDEX "copilot_events_runId_createdAt_idx" ON "copilot_events"("runId", "createdAt");

ALTER TABLE "copilot_runs" ADD CONSTRAINT "copilot_runs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "copilot_runs" ADD CONSTRAINT "copilot_runs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "copilot_runs" ADD CONSTRAINT "copilot_runs_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "copilot_events" ADD CONSTRAINT "copilot_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "copilot_events" ADD CONSTRAINT "copilot_events_runId_fkey" FOREIGN KEY ("runId") REFERENCES "copilot_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Additive case-room fields for governed no-fault and workers compensation workflows.
ALTER TABLE "nofault_cases"
  ADD COLUMN "policyNumber" TEXT,
  ADD COLUMN "diagnosisCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "assignmentBenefitsStatus" TEXT,
  ADD COLUMN "nf2Status" TEXT,
  ADD COLUMN "nf3Status" TEXT,
  ADD COLUMN "denialStatus" TEXT,
  ADD COLUMN "appealStatus" TEXT;

ALTER TABLE "workers_comp_cases"
  ADD COLUMN "diagnosisCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "treatmentPlan" TEXT,
  ADD COLUMN "returnToWorkStatus" TEXT,
  ADD COLUMN "c4Status" TEXT,
  ADD COLUMN "imeStatus" TEXT,
  ADD COLUMN "denialStatus" TEXT,
  ADD COLUMN "appealStatus" TEXT;

ALTER TABLE "case_tasks"
  ADD COLUMN "details" TEXT,
  ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'normal',
  ADD COLUMN "completedAt" TIMESTAMP(3),
  ADD COLUMN "createdBy" TEXT;

ALTER TABLE "case_packets"
  ADD COLUMN "generatedBy" TEXT,
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "approvedBy" TEXT;

CREATE UNIQUE INDEX "nofault_cases_organizationId_claimNumber_key" ON "nofault_cases"("organizationId", "claimNumber");
CREATE INDEX "nofault_cases_organizationId_patientId_idx" ON "nofault_cases"("organizationId", "patientId");
CREATE UNIQUE INDEX "workers_comp_cases_organizationId_claimNumber_key" ON "workers_comp_cases"("organizationId", "claimNumber");
CREATE INDEX "workers_comp_cases_organizationId_patientId_idx" ON "workers_comp_cases"("organizationId", "patientId");

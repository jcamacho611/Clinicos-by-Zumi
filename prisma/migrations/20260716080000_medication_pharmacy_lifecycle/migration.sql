ALTER TABLE "patient_pharmacies"
  ADD COLUMN "ncpdpId" TEXT,
  ADD COLUMN "npi" TEXT,
  ADD COLUMN "fax" TEXT,
  ADD COLUMN "hours" JSONB,
  ADD COLUMN "electronicPrescribingEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "controlledSubstancesEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN "source" TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN "verifiedBy" TEXT,
  ADD COLUMN "verifiedAt" TIMESTAMP(3);

DROP INDEX IF EXISTS "patient_pharmacies_patientId_idx";
CREATE INDEX "patient_pharmacies_organizationId_status_name_idx" ON "patient_pharmacies"("organizationId", "status", "name");
CREATE INDEX "patient_pharmacies_patientId_preferred_idx" ON "patient_pharmacies"("patientId", "preferred");
CREATE UNIQUE INDEX "patient_pharmacies_one_preferred_per_patient" ON "patient_pharmacies"("organizationId", "patientId") WHERE "preferred" = true AND "status" = 'active';

ALTER TABLE "medications"
  ADD COLUMN "genericName" TEXT,
  ADD COLUMN "brandName" TEXT,
  ADD COLUMN "rxNormCode" TEXT,
  ADD COLUMN "strength" TEXT,
  ADD COLUMN "quantity" TEXT,
  ADD COLUMN "refillsAuthorized" INTEGER,
  ADD COLUMN "indication" TEXT,
  ADD COLUMN "source" TEXT NOT NULL DEFAULT 'provider_entered',
  ADD COLUMN "patientReported" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "prescribingProviderId" TEXT,
  ADD COLUMN "encounterId" TEXT,
  ADD COLUMN "pharmacyId" TEXT,
  ADD COLUMN "reconciliationStatus" TEXT NOT NULL DEFAULT 'unreconciled',
  ADD COLUMN "reconciledBy" TEXT,
  ADD COLUMN "reconciledAt" TIMESTAMP(3),
  ADD COLUMN "discontinuedBy" TEXT,
  ADD COLUMN "discontinuedAt" TIMESTAMP(3),
  ADD COLUMN "discontinuationReason" TEXT,
  ADD COLUMN "provenance" JSONB,
  ADD COLUMN "createdBy" TEXT;

CREATE INDEX "medications_organizationId_status_updatedAt_idx" ON "medications"("organizationId", "status", "updatedAt");
CREATE INDEX "medications_prescribingProviderId_idx" ON "medications"("prescribingProviderId");

CREATE TABLE "medication_reconciliations" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "encounterId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "source" TEXT NOT NULL DEFAULT 'staff_review',
  "summary" TEXT,
  "discrepancies" JSONB,
  "medicationIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdBy" TEXT NOT NULL,
  "completedBy" TEXT,
  "completedAt" TIMESTAMP(3),
  "reopenedBy" TEXT,
  "reopenedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "medication_reconciliations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "medication_reconciliations_status_check" CHECK ("status" IN ('draft', 'completed', 'reopened'))
);

CREATE TABLE "refill_requests" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "medicationId" TEXT NOT NULL,
  "pharmacyId" TEXT,
  "providerId" TEXT,
  "requestSource" TEXT NOT NULL DEFAULT 'staff',
  "requestNote" TEXT,
  "urgency" TEXT NOT NULL DEFAULT 'routine',
  "quantityRequested" TEXT,
  "status" TEXT NOT NULL DEFAULT 'requested',
  "providerDecision" TEXT,
  "decisionReason" TEXT,
  "decidedBy" TEXT,
  "decidedAt" TIMESTAMP(3),
  "deliveryMethod" TEXT NOT NULL DEFAULT 'manual',
  "integrationId" TEXT,
  "transmissionStatus" TEXT NOT NULL DEFAULT 'not_started',
  "transmittedAt" TIMESTAMP(3),
  "externalReference" TEXT,
  "failureReason" TEXT,
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "lastAttemptAt" TIMESTAMP(3),
  "manualConfirmation" TEXT,
  "completedAt" TIMESTAMP(3),
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "refill_requests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "refill_requests_status_check" CHECK ("status" IN ('requested', 'triaged', 'needs_provider', 'approved', 'denied', 'queued', 'sent', 'failed', 'completed', 'cancelled')),
  CONSTRAINT "refill_requests_urgency_check" CHECK ("urgency" IN ('routine', 'high', 'urgent')),
  CONSTRAINT "refill_requests_delivery_method_check" CHECK ("deliveryMethod" IN ('manual', 'print', 'fax', 'electronic_adapter'))
);

CREATE TABLE "prescriptions" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "medicationId" TEXT NOT NULL,
  "refillRequestId" TEXT,
  "providerId" TEXT NOT NULL,
  "pharmacyId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "dosageInstructions" TEXT NOT NULL,
  "quantity" TEXT NOT NULL,
  "refills" INTEGER NOT NULL DEFAULT 0,
  "daysSupply" INTEGER,
  "controlledSubstance" BOOLEAN NOT NULL DEFAULT false,
  "deaSchedule" TEXT,
  "epcsRequired" BOOLEAN NOT NULL DEFAULT false,
  "deliveryMethod" TEXT NOT NULL DEFAULT 'manual',
  "integrationId" TEXT,
  "transmissionStatus" TEXT NOT NULL DEFAULT 'not_started',
  "externalReference" TEXT,
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP(3),
  "transmittedAt" TIMESTAMP(3),
  "failureReason" TEXT,
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "lastAttemptAt" TIMESTAMP(3),
  "manualConfirmation" TEXT,
  "cancelledBy" TEXT,
  "cancelledAt" TIMESTAMP(3),
  "cancellationReason" TEXT,
  "source" TEXT NOT NULL DEFAULT 'clinicos',
  "provenance" JSONB,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "prescriptions_status_check" CHECK ("status" IN ('draft', 'approved', 'queued', 'sent', 'failed', 'completed', 'cancelled')),
  CONSTRAINT "prescriptions_delivery_method_check" CHECK ("deliveryMethod" IN ('manual', 'print', 'fax', 'electronic_adapter')),
  CONSTRAINT "prescriptions_refills_check" CHECK ("refills" >= 0),
  CONSTRAINT "prescriptions_controlled_check" CHECK (("controlledSubstance" = false AND "epcsRequired" = false) OR ("controlledSubstance" = true AND "epcsRequired" = true))
);

CREATE TABLE "medication_warnings" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "medicationId" TEXT,
  "refillRequestId" TEXT,
  "prescriptionId" TEXT,
  "warningType" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "evidence" JSONB,
  "status" TEXT NOT NULL DEFAULT 'open',
  "requiresProviderReview" BOOLEAN NOT NULL DEFAULT true,
  "acknowledgedBy" TEXT,
  "acknowledgedAt" TIMESTAMP(3),
  "acknowledgmentReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "medication_warnings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "medication_warnings_status_check" CHECK ("status" IN ('open', 'acknowledged', 'resolved')),
  CONSTRAINT "medication_warnings_severity_check" CHECK ("severity" IN ('info', 'warning', 'high', 'urgent'))
);

CREATE TABLE "medication_events" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "medicationId" TEXT,
  "reconciliationId" TEXT,
  "refillRequestId" TEXT,
  "prescriptionId" TEXT,
  "actorId" TEXT,
  "eventType" TEXT NOT NULL,
  "fromStatus" TEXT,
  "toStatus" TEXT,
  "note" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "medication_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "medication_reconciliations_organizationId_status_updatedAt_idx" ON "medication_reconciliations"("organizationId", "status", "updatedAt");
CREATE INDEX "medication_reconciliations_patientId_createdAt_idx" ON "medication_reconciliations"("patientId", "createdAt");
CREATE INDEX "refill_requests_organizationId_status_updatedAt_idx" ON "refill_requests"("organizationId", "status", "updatedAt");
CREATE INDEX "refill_requests_patientId_createdAt_idx" ON "refill_requests"("patientId", "createdAt");
CREATE INDEX "refill_requests_medicationId_status_idx" ON "refill_requests"("medicationId", "status");
CREATE INDEX "prescriptions_organizationId_status_updatedAt_idx" ON "prescriptions"("organizationId", "status", "updatedAt");
CREATE INDEX "prescriptions_patientId_createdAt_idx" ON "prescriptions"("patientId", "createdAt");
CREATE INDEX "prescriptions_refillRequestId_idx" ON "prescriptions"("refillRequestId");
CREATE INDEX "medication_warnings_organizationId_status_severity_idx" ON "medication_warnings"("organizationId", "status", "severity");
CREATE INDEX "medication_warnings_patientId_createdAt_idx" ON "medication_warnings"("patientId", "createdAt");
CREATE INDEX "medication_warnings_prescriptionId_idx" ON "medication_warnings"("prescriptionId");
CREATE INDEX "medication_events_organizationId_createdAt_idx" ON "medication_events"("organizationId", "createdAt");
CREATE INDEX "medication_events_patientId_createdAt_idx" ON "medication_events"("patientId", "createdAt");
CREATE INDEX "medication_events_medicationId_createdAt_idx" ON "medication_events"("medicationId", "createdAt");
CREATE INDEX "medication_events_refillRequestId_createdAt_idx" ON "medication_events"("refillRequestId", "createdAt");
CREATE INDEX "medication_events_prescriptionId_createdAt_idx" ON "medication_events"("prescriptionId", "createdAt");

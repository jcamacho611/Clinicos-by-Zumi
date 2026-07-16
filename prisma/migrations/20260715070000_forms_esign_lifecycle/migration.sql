-- Governed intake forms, assignments, resumable submissions, staged reviews, and attested signatures.
ALTER TABLE "form_templates"
  ADD COLUMN "templateKey" TEXT,
  ADD COLUMN "supersedesId" TEXT,
  ADD COLUMN "description" TEXT,
  ADD COLUMN "category" TEXT NOT NULL DEFAULT 'general',
  ADD COLUMN "audience" TEXT NOT NULL DEFAULT 'patient',
  ADD COLUMN "completionModes" TEXT[] NOT NULL DEFAULT ARRAY['patient', 'staff', 'provider']::TEXT[],
  ADD COLUMN "requiresSignature" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "requiresWitness" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "requiresProviderSignature" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "staffReviewRequired" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "providerReviewRequired" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "expirationDays" INTEGER,
  ADD COLUMN "renewalReminderDays" INTEGER,
  ADD COLUMN "publishedAt" TIMESTAMP(3),
  ADD COLUMN "retiredAt" TIMESTAMP(3),
  ADD COLUMN "createdBy" TEXT,
  ADD COLUMN "provenance" JSONB;

UPDATE "form_templates"
SET "templateKey" = "id",
    "publishedAt" = CASE WHEN "status" = 'active' THEN "createdAt" ELSE NULL END;

ALTER TABLE "form_templates" ALTER COLUMN "templateKey" SET NOT NULL;

CREATE UNIQUE INDEX "form_templates_organizationId_templateKey_version_key"
  ON "form_templates"("organizationId", "templateKey", "version");
CREATE UNIQUE INDEX "form_templates_organizationId_supersedesId_key"
  ON "form_templates"("organizationId", "supersedesId");
DROP INDEX IF EXISTS "form_templates_organizationId_status_idx";
CREATE INDEX "form_templates_organizationId_status_category_idx"
  ON "form_templates"("organizationId", "status", "category");

CREATE TABLE "form_assignments" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "templateVersion" INTEGER NOT NULL,
  "appointmentId" TEXT,
  "encounterId" TEXT,
  "assignedBy" TEXT NOT NULL,
  "completionMode" TEXT NOT NULL DEFAULT 'patient',
  "deliveryMethod" TEXT NOT NULL DEFAULT 'portal',
  "status" TEXT NOT NULL DEFAULT 'not_started',
  "dueAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "cancellationReason" TEXT,
  "reminderCount" INTEGER NOT NULL DEFAULT 0,
  "lastReminderAt" TIMESTAMP(3),
  "provenance" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "form_assignments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "form_assignments_organizationId_status_dueAt_idx"
  ON "form_assignments"("organizationId", "status", "dueAt");
CREATE INDEX "form_assignments_patientId_status_idx"
  ON "form_assignments"("patientId", "status");
CREATE INDEX "form_assignments_templateId_templateVersion_idx"
  ON "form_assignments"("templateId", "templateVersion");

ALTER TABLE "form_submissions"
  ADD COLUMN "assignmentId" TEXT,
  ADD COLUMN "appointmentId" TEXT,
  ADD COLUMN "encounterId" TEXT,
  ADD COLUMN "completionMode" TEXT NOT NULL DEFAULT 'patient',
  ADD COLUMN "completionPercent" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "currentReviewStage" TEXT,
  ADD COLUMN "correctionReason" TEXT,
  ADD COLUMN "correctionRequestedBy" TEXT,
  ADD COLUMN "correctionRequestedAt" TIMESTAMP(3),
  ADD COLUMN "approvedBy" TEXT,
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "documentId" TEXT,
  ADD COLUMN "checksumSha256" TEXT,
  ADD COLUMN "expiresAt" TIMESTAMP(3),
  ADD COLUMN "provenance" JSONB;

UPDATE "form_submissions"
SET "status" = CASE WHEN "status" = 'incomplete' THEN 'draft' ELSE "status" END,
    "completionPercent" = CASE WHEN "submittedAt" IS NULL THEN 0 ELSE 100 END;

CREATE UNIQUE INDEX "form_submissions_organizationId_assignmentId_key"
  ON "form_submissions"("organizationId", "assignmentId");
CREATE INDEX "form_submissions_organizationId_status_currentReviewStage_idx"
  ON "form_submissions"("organizationId", "status", "currentReviewStage");
CREATE INDEX "form_submissions_templateId_templateVersion_idx"
  ON "form_submissions"("templateId", "templateVersion");
CREATE INDEX "form_submissions_documentId_idx" ON "form_submissions"("documentId");

CREATE TABLE "form_reviews" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "stage" TEXT NOT NULL,
  "requestedBy" TEXT,
  "assignedTo" TEXT,
  "reviewerId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'needs_review',
  "decision" TEXT,
  "notes" TEXT,
  "dueAt" TIMESTAMP(3),
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "form_reviews_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "form_reviews_organizationId_status_dueAt_idx"
  ON "form_reviews"("organizationId", "status", "dueAt");
CREATE INDEX "form_reviews_submissionId_stage_idx"
  ON "form_reviews"("submissionId", "stage");

CREATE TABLE "form_events" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "templateId" TEXT,
  "assignmentId" TEXT,
  "submissionId" TEXT,
  "actorId" TEXT,
  "eventType" TEXT NOT NULL,
  "fromStatus" TEXT,
  "toStatus" TEXT,
  "note" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "form_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "form_events_organizationId_createdAt_idx"
  ON "form_events"("organizationId", "createdAt");
CREATE INDEX "form_events_submissionId_createdAt_idx"
  ON "form_events"("submissionId", "createdAt");
CREATE INDEX "form_events_assignmentId_createdAt_idx"
  ON "form_events"("assignmentId", "createdAt");

ALTER TABLE "signatures"
  ADD COLUMN "providerId" TEXT,
  ADD COLUMN "signerType" TEXT NOT NULL DEFAULT 'signer',
  ADD COLUMN "signerRelationship" TEXT,
  ADD COLUMN "signatureMethod" TEXT NOT NULL DEFAULT 'attested_typed',
  ADD COLUMN "attestation" TEXT,
  ADD COLUMN "ipHash" TEXT,
  ADD COLUMN "userAgentHash" TEXT,
  ADD COLUMN "witnessSignatureId" TEXT,
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'valid',
  ADD COLUMN "revokedAt" TIMESTAMP(3),
  ADD COLUMN "revokedBy" TEXT,
  ADD COLUMN "revocationReason" TEXT;

CREATE UNIQUE INDEX "signatures_one_valid_signer_role_key"
  ON "signatures"("organizationId", "entityType", "entityId", "signerType")
  WHERE "status" = 'valid';
CREATE INDEX "signatures_organizationId_entityType_entityId_signerType_idx"
  ON "signatures"("organizationId", "entityType", "entityId", "signerType");
CREATE INDEX "signatures_organizationId_patientId_signedAt_idx"
  ON "signatures"("organizationId", "patientId", "signedAt");

ALTER TABLE "form_assignments"
  ADD CONSTRAINT "form_assignments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "form_assignments_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "form_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "form_assignments_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "form_assignments_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "encounters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "form_submissions"
  ADD CONSTRAINT "form_submissions_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "form_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "form_submissions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "form_reviews"
  ADD CONSTRAINT "form_reviews_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "form_submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "form_events"
  ADD CONSTRAINT "form_events_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "form_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "form_events_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "form_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "form_events_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "form_submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "form_templates"
  ADD CONSTRAINT "form_templates_version_check" CHECK ("version" > 0),
  ADD CONSTRAINT "form_templates_status_check" CHECK ("status" IN ('draft', 'active', 'retired', 'superseded')),
  ADD CONSTRAINT "form_templates_audience_check" CHECK ("audience" IN ('patient', 'staff', 'provider', 'mixed')),
  ADD CONSTRAINT "form_templates_expiration_check" CHECK ("expirationDays" IS NULL OR "expirationDays" BETWEEN 1 AND 36500),
  ADD CONSTRAINT "form_templates_renewal_check" CHECK ("renewalReminderDays" IS NULL OR "renewalReminderDays" BETWEEN 1 AND 3650),
  ADD CONSTRAINT "form_templates_active_published_check" CHECK ("status" <> 'active' OR "publishedAt" IS NOT NULL);

ALTER TABLE "form_assignments"
  ADD CONSTRAINT "form_assignments_template_version_check" CHECK ("templateVersion" > 0),
  ADD CONSTRAINT "form_assignments_mode_check" CHECK ("completionMode" IN ('patient', 'staff', 'provider')),
  ADD CONSTRAINT "form_assignments_delivery_check" CHECK ("deliveryMethod" IN ('portal', 'email_link', 'sms_link', 'tablet', 'paper_import', 'staff_assisted')),
  ADD CONSTRAINT "form_assignments_status_check" CHECK ("status" IN ('not_started', 'in_progress', 'submitted', 'completed', 'cancelled', 'expired')),
  ADD CONSTRAINT "form_assignments_reminder_check" CHECK ("reminderCount" >= 0),
  ADD CONSTRAINT "form_assignments_completed_check" CHECK ("status" <> 'completed' OR "completedAt" IS NOT NULL),
  ADD CONSTRAINT "form_assignments_cancelled_check" CHECK ("status" <> 'cancelled' OR ("cancelledAt" IS NOT NULL AND length(coalesce("cancellationReason", '')) >= 8));

ALTER TABLE "form_submissions"
  ADD CONSTRAINT "form_submissions_template_version_check" CHECK ("templateVersion" > 0),
  ADD CONSTRAINT "form_submissions_mode_check" CHECK ("completionMode" IN ('patient', 'staff', 'provider', 'paper_import')),
  ADD CONSTRAINT "form_submissions_progress_check" CHECK ("completionPercent" BETWEEN 0 AND 100),
  ADD CONSTRAINT "form_submissions_status_check" CHECK ("status" IN ('draft', 'submitted', 'staff_review', 'provider_review', 'needs_correction', 'approved', 'locked', 'rejected')),
  ADD CONSTRAINT "form_submissions_submitted_check" CHECK ("status" = 'draft' OR "submittedAt" IS NOT NULL),
  ADD CONSTRAINT "form_submissions_locked_check" CHECK ("status" <> 'locked' OR ("lockedAt" IS NOT NULL AND "documentId" IS NOT NULL AND "checksumSha256" IS NOT NULL));

ALTER TABLE "form_reviews"
  ADD CONSTRAINT "form_reviews_stage_check" CHECK ("stage" IN ('staff', 'provider')),
  ADD CONSTRAINT "form_reviews_status_check" CHECK ("status" IN ('needs_review', 'completed', 'rejected', 'cancelled')),
  ADD CONSTRAINT "form_reviews_decision_check" CHECK ("decision" IS NULL OR "decision" IN ('approved', 'needs_correction', 'rejected'));

ALTER TABLE "signatures"
  ADD CONSTRAINT "signatures_signer_type_check" CHECK ("signerType" IN ('signer', 'submitter', 'witness', 'provider')),
  ADD CONSTRAINT "signatures_method_check" CHECK ("signatureMethod" IN ('attested_typed', 'drawn', 'imported', 'system_credential')),
  ADD CONSTRAINT "signatures_status_check" CHECK ("status" IN ('valid', 'revoked')),
  ADD CONSTRAINT "signatures_revoked_check" CHECK ("status" <> 'revoked' OR ("revokedAt" IS NOT NULL AND length(coalesce("revocationReason", '')) >= 8));

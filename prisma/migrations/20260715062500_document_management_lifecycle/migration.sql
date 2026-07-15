-- Expand category policy without breaking legacy organizations.
ALTER TABLE "document_categories"
  ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "allowedMimeTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "code" TEXT,
  ADD COLUMN "color" TEXT NOT NULL DEFAULT 'slate',
  ADD COLUMN "defaultPatientVisible" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "description" TEXT,
  ADD COLUMN "retentionDays" INTEGER,
  ADD COLUMN "reviewRequired" BOOLEAN NOT NULL DEFAULT true;

UPDATE "document_categories"
SET "code" = COALESCE(NULLIF(regexp_replace(lower("name"), '[^a-z0-9]+', '_', 'g'), ''), 'category') || '_' || substr("id", 1, 8)
WHERE "code" IS NULL;

ALTER TABLE "document_categories" ALTER COLUMN "code" SET NOT NULL;

-- Add review assignment and decision provenance.
ALTER TABLE "document_reviews"
  ADD COLUMN "assignedTo" TEXT,
  ADD COLUMN "decision" TEXT,
  ADD COLUMN "dueAt" TIMESTAMP(3),
  ADD COLUMN "requestedBy" TEXT,
  ADD COLUMN "reviewType" TEXT NOT NULL DEFAULT 'content';

-- Add governed document lifecycle, encrypted fallback payload, links, and immutable lineage.
ALTER TABLE "documents"
  ADD COLUMN "caseId" TEXT,
  ADD COLUMN "caseType" TEXT,
  ADD COLUMN "checksumSha256" TEXT,
  ADD COLUMN "description" TEXT,
  ADD COLUMN "encounterId" TEXT,
  ADD COLUMN "encryptedContent" BYTEA,
  ADD COLUMN "encryptionAuthTag" BYTEA,
  ADD COLUMN "encryptionIv" BYTEA,
  ADD COLUMN "encryptionKeyId" TEXT,
  ADD COLUMN "expiresAt" TIMESTAMP(3),
  ADD COLUMN "originalFileName" TEXT,
  ADD COLUMN "provenance" JSONB,
  ADD COLUMN "referralId" TEXT,
  ADD COLUMN "releaseApprovedAt" TIMESTAMP(3),
  ADD COLUMN "releaseApprovedBy" TEXT,
  ADD COLUMN "releaseRequestedAt" TIMESTAMP(3),
  ADD COLUMN "releaseStatus" TEXT NOT NULL DEFAULT 'not_requested',
  ADD COLUMN "reviewRequired" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "reviewStatus" TEXT NOT NULL DEFAULT 'needs_review',
  ADD COLUMN "sourceType" TEXT NOT NULL DEFAULT 'upload',
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN "storageProvider" TEXT NOT NULL DEFAULT 'database_encrypted',
  ADD COLUMN "supersedesId" TEXT,
  ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "versionGroupId" TEXT;

UPDATE "documents"
SET
  "originalFileName" = COALESCE(NULLIF(regexp_replace("storageKey", '^.*/', ''), ''), "name"),
  "versionGroupId" = 'legacy-' || "id",
  "storageProvider" = 'synthetic_reference',
  "reviewStatus" = CASE WHEN "lockedAt" IS NOT NULL THEN 'approved' ELSE 'needs_review' END,
  "reviewRequired" = true,
  "provenance" = COALESCE("provenance", '{}'::jsonb) || jsonb_build_object('legacyBackfill', true)
WHERE "originalFileName" IS NULL OR "versionGroupId" IS NULL;

ALTER TABLE "documents" ALTER COLUMN "originalFileName" SET NOT NULL;
ALTER TABLE "documents" ALTER COLUMN "versionGroupId" SET NOT NULL;

CREATE TABLE "document_events" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "actorId" TEXT,
  "eventType" TEXT NOT NULL,
  "fromStatus" TEXT,
  "toStatus" TEXT,
  "note" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "document_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "document_events_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "document_events_organizationId_createdAt_idx" ON "document_events"("organizationId", "createdAt");
CREATE INDEX "document_events_documentId_createdAt_idx" ON "document_events"("documentId", "createdAt");
CREATE INDEX "document_categories_organizationId_active_idx" ON "document_categories"("organizationId", "active");
CREATE UNIQUE INDEX "document_categories_organizationId_code_key" ON "document_categories"("organizationId", "code");
CREATE INDEX "document_reviews_organizationId_status_dueAt_idx" ON "document_reviews"("organizationId", "status", "dueAt");
CREATE INDEX "documents_organizationId_status_createdAt_idx" ON "documents"("organizationId", "status", "createdAt");
CREATE INDEX "documents_organizationId_reviewStatus_releaseStatus_idx" ON "documents"("organizationId", "reviewStatus", "releaseStatus");
CREATE INDEX "documents_organizationId_categoryId_createdAt_idx" ON "documents"("organizationId", "categoryId", "createdAt");
CREATE UNIQUE INDEX "documents_organizationId_versionGroupId_version_key" ON "documents"("organizationId", "versionGroupId", "version");
CREATE UNIQUE INDEX "documents_organizationId_supersedesId_key" ON "documents"("organizationId", "supersedesId");
CREATE INDEX "documents_encounterId_idx" ON "documents"("encounterId");
CREATE INDEX "documents_referralId_idx" ON "documents"("referralId");
CREATE INDEX "documents_caseType_caseId_idx" ON "documents"("caseType", "caseId");
CREATE INDEX "documents_expiresAt_idx" ON "documents"("expiresAt");

ALTER TABLE "document_categories"
  ADD CONSTRAINT "document_categories_retention_check" CHECK ("retentionDays" IS NULL OR "retentionDays" > 0),
  ADD CONSTRAINT "document_categories_code_check" CHECK ("code" ~ '^[a-z0-9_]+$'),
  ADD CONSTRAINT "document_categories_restricted_visibility_check" CHECK ("defaultAccess" <> 'RESTRICTED' OR "defaultPatientVisible" = false);

ALTER TABLE "document_reviews"
  ADD CONSTRAINT "document_reviews_status_check" CHECK ("status" IN ('needs_review', 'completed', 'rejected', 'cancelled')),
  ADD CONSTRAINT "document_reviews_decision_check" CHECK ("decision" IS NULL OR "decision" IN ('approved', 'rejected', 'cancelled')),
  ADD CONSTRAINT "document_reviews_completion_check" CHECK (("status" = 'needs_review' AND "reviewedAt" IS NULL) OR ("status" <> 'needs_review'));

ALTER TABLE "documents"
  ADD CONSTRAINT "documents_version_check" CHECK ("version" > 0),
  ADD CONSTRAINT "documents_size_check" CHECK ("sizeBytes" > 0),
  ADD CONSTRAINT "documents_status_check" CHECK ("status" IN ('active', 'superseded', 'archived')),
  ADD CONSTRAINT "documents_review_status_check" CHECK ("reviewStatus" IN ('needs_review', 'approved', 'rejected', 'not_required')),
  ADD CONSTRAINT "documents_release_status_check" CHECK ("releaseStatus" IN ('not_requested', 'pending', 'held', 'approved', 'revoked')),
  ADD CONSTRAINT "documents_source_type_check" CHECK ("sourceType" IN ('upload', 'camera', 'scan', 'import', 'generated')),
  ADD CONSTRAINT "documents_storage_provider_check" CHECK ("storageProvider" IN ('database_encrypted', 'synthetic_reference', 'external_adapter')),
  ADD CONSTRAINT "documents_case_link_check" CHECK (("caseType" IS NULL AND "caseId" IS NULL) OR ("caseType" IN ('nofault', 'workers_comp') AND "caseId" IS NOT NULL)),
  ADD CONSTRAINT "documents_version_lineage_check" CHECK (("version" = 1 AND "supersedesId" IS NULL) OR ("version" > 1 AND "supersedesId" IS NOT NULL)),
  ADD CONSTRAINT "documents_portal_visibility_check" CHECK (("patientVisible" = false) OR ("patientId" IS NOT NULL AND "releaseStatus" = 'approved' AND "internalOnly" = false AND "accessLevel" = 'PATIENT_VISIBLE')),
  ADD CONSTRAINT "documents_release_approval_check" CHECK (("releaseStatus" <> 'approved') OR ("releaseApprovedBy" IS NOT NULL AND "releaseApprovedAt" IS NOT NULL)),
  ADD CONSTRAINT "documents_review_requirement_check" CHECK (("reviewRequired" = true) OR ("reviewStatus" IN ('not_required', 'approved'))),
  ADD CONSTRAINT "documents_encryption_bundle_check" CHECK (("encryptedContent" IS NULL AND "encryptionIv" IS NULL AND "encryptionAuthTag" IS NULL AND "encryptionKeyId" IS NULL) OR ("encryptedContent" IS NOT NULL AND "encryptionIv" IS NOT NULL AND "encryptionAuthTag" IS NOT NULL AND "encryptionKeyId" IS NOT NULL AND "checksumSha256" IS NOT NULL)),
  ADD CONSTRAINT "documents_database_storage_check" CHECK ("storageProvider" <> 'database_encrypted' OR ("encryptedContent" IS NOT NULL AND "checksumSha256" IS NOT NULL)),
  ADD CONSTRAINT "documents_checksum_check" CHECK ("checksumSha256" IS NULL OR "checksumSha256" ~ '^[a-f0-9]{64}$');

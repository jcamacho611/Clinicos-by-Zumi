-- Add Person-owned CareerArtifact evidence without changing identity or authority.
--
-- Resume/manual/import content is claims-only. Human confirmation, AI parsing,
-- organization scope, or evidence references do not grant professional, clinical,
-- billing, placement, listing, or organization-binding authority.
--
-- The record stores versioned metadata and structured claims. Raw file bytes remain
-- outside this table and continue to use approved encrypted storage boundaries.

CREATE TABLE IF NOT EXISTS "career_artifacts" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "organizationId" TEXT,
    "artifactType" TEXT NOT NULL DEFAULT 'resume',
    "sourceType" TEXT NOT NULL DEFAULT 'resume',
    "sourceReference" TEXT,
    "storageLocator" TEXT,
    "format" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "versionGroupId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "supersedesId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "claimState" TEXT NOT NULL DEFAULT 'claimed',
    "verificationState" TEXT NOT NULL DEFAULT 'claimed',
    "claims" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "parserProvenance" JSONB,
    "humanConfirmationState" TEXT NOT NULL DEFAULT 'pending',
    "humanConfirmedFields" JSONB,
    "evidenceReferences" JSONB,
    "provenance" JSONB,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "career_artifacts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "career_artifacts_personId_versionGroupId_version_key"
    ON "career_artifacts"("personId", "versionGroupId", "version");
CREATE UNIQUE INDEX IF NOT EXISTS "career_artifacts_personId_supersedesId_key"
    ON "career_artifacts"("personId", "supersedesId");
CREATE INDEX IF NOT EXISTS "career_artifacts_personId_status_effectiveFrom_idx"
    ON "career_artifacts"("personId", "status", "effectiveFrom");
CREATE INDEX IF NOT EXISTS "career_artifacts_organizationId_status_effectiveFrom_idx"
    ON "career_artifacts"("organizationId", "status", "effectiveFrom");
CREATE INDEX IF NOT EXISTS "career_artifacts_versionGroupId_version_idx"
    ON "career_artifacts"("versionGroupId", "version");
CREATE INDEX IF NOT EXISTS "career_artifacts_artifactType_status_idx"
    ON "career_artifacts"("artifactType", "status");
CREATE INDEX IF NOT EXISTS "career_artifacts_effectiveFrom_effectiveTo_idx"
    ON "career_artifacts"("effectiveFrom", "effectiveTo");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'career_artifacts_personId_fkey'
      AND conrelid = '"career_artifacts"'::regclass
  ) THEN
    ALTER TABLE "career_artifacts"
      ADD CONSTRAINT "career_artifacts_personId_fkey"
      FOREIGN KEY ("personId") REFERENCES "people"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

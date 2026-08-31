-- Add a durable Person-owned CareerArtifact for career/resume claims.
--
-- CareerArtifact is evidence/context only. Resume parsing, human confirmation, or
-- artifact verification state must never grant professional, clinical, billing,
-- organization-binding, listing, signing, payout, school/site approval, or other
-- consequential authority.
--
-- Raw resume bytes are deliberately NOT duplicated here. sourceReference and
-- sourceChecksumSha256 preserve provenance while the underlying private file remains
-- governed by its own storage/retention boundary.

CREATE TABLE IF NOT EXISTS "career_artifacts" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "artifactType" TEXT NOT NULL DEFAULT 'resume',
    "artifactVersion" INTEGER NOT NULL,
    "supersedesArtifactId" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'resume_upload',
    "sourceReference" TEXT,
    "sourceChecksumSha256" TEXT,
    "claimState" TEXT NOT NULL DEFAULT 'claimed',
    "verificationState" TEXT NOT NULL DEFAULT 'unverified',
    "educationClaims" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "experienceClaims" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "skillClaims" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "careerGoals" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "locationPreferences" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "availabilityPreferences" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "parserProvider" TEXT,
    "parserModel" TEXT,
    "parserRunId" TEXT,
    "parserSchemaVersion" INTEGER,
    "parserConfidence" DOUBLE PRECISION,
    "parsedAt" TIMESTAMP(3),
    "humanConfirmedAt" TIMESTAMP(3),
    "humanConfirmedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "career_artifacts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "career_artifacts_personId_artifactType_artifactVersion_key"
    ON "career_artifacts"("personId", "artifactType", "artifactVersion");
CREATE INDEX IF NOT EXISTS "career_artifacts_personId_artifactType_createdAt_idx"
    ON "career_artifacts"("personId", "artifactType", "createdAt");
CREATE INDEX IF NOT EXISTS "career_artifacts_supersedesArtifactId_idx"
    ON "career_artifacts"("supersedesArtifactId");
CREATE INDEX IF NOT EXISTS "career_artifacts_sourceChecksumSha256_idx"
    ON "career_artifacts"("sourceChecksumSha256");

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

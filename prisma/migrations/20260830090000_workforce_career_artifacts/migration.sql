-- Additive workforce career evidence persistence.
-- Resume/career artifacts are Person-linked evidence only and never grant professional,
-- clinical, billing, listing, signing, payout, placement, or organization authority.

CREATE TABLE "workforce_career_artifacts" (
  "id" TEXT NOT NULL,
  "personId" TEXT NOT NULL,
  "artifactType" TEXT NOT NULL DEFAULT 'resume',
  "sourceType" TEXT NOT NULL,
  "sourceReference" TEXT NOT NULL,
  "verificationState" TEXT NOT NULL DEFAULT 'claimed',
  "privacy" TEXT NOT NULL DEFAULT 'private',
  "status" TEXT NOT NULL DEFAULT 'active',
  "claims" JSONB NOT NULL,
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "workforce_career_artifacts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "workforce_career_artifacts_person_fkey"
    FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "workforce_career_artifacts_verification_check"
    CHECK ("verificationState" IN ('claimed', 'reviewed', 'rejected', 'expired')),
  CONSTRAINT "workforce_career_artifacts_privacy_check"
    CHECK ("privacy" IN ('private', 'organization_shared')),
  CONSTRAINT "workforce_career_artifacts_status_check"
    CHECK ("status" IN ('active', 'superseded', 'archived'))
);

CREATE UNIQUE INDEX "workforce_career_artifacts_person_type_source_key"
  ON "workforce_career_artifacts" ("personId", "artifactType", "sourceReference");
CREATE INDEX "workforce_career_artifacts_person_status_idx"
  ON "workforce_career_artifacts" ("personId", "status");
CREATE INDEX "workforce_career_artifacts_verification_status_idx"
  ON "workforce_career_artifacts" ("verificationState", "status");

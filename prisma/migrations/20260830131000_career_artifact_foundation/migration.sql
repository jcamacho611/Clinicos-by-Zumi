CREATE TABLE "career_artifacts" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "artifactType" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceReference" TEXT,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "supersedesArtifactId" TEXT,
    "claimState" TEXT NOT NULL DEFAULT 'claimed',
    "educationClaims" JSONB NOT NULL,
    "experienceClaims" JSONB NOT NULL,
    "skillClaims" JSONB NOT NULL,
    "careerGoals" JSONB NOT NULL,
    "roleInterests" JSONB NOT NULL,
    "locationPreferences" JSONB NOT NULL,
    "availabilityPreferences" JSONB NOT NULL,
    "parserProvenance" JSONB,
    "humanConfirmedAt" TIMESTAMP(3),
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "career_artifacts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "career_artifacts_personId_version_key"
ON "career_artifacts"("personId", "version");

CREATE INDEX "career_artifacts_personId_status_idx"
ON "career_artifacts"("personId", "status");

CREATE INDEX "career_artifacts_supersedesArtifactId_idx"
ON "career_artifacts"("supersedesArtifactId");

CREATE INDEX "career_artifacts_effectiveFrom_effectiveTo_idx"
ON "career_artifacts"("effectiveFrom", "effectiveTo");

ALTER TABLE "career_artifacts"
ADD CONSTRAINT "career_artifacts_personId_fkey"
FOREIGN KEY ("personId") REFERENCES "people"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "career_artifacts"
ADD CONSTRAINT "career_artifacts_supersedesArtifactId_fkey"
FOREIGN KEY ("supersedesArtifactId") REFERENCES "career_artifacts"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Immutable BodyMap persistence foundation.
-- Comparison roles such as initial/previous/today are derived at read time and are
-- intentionally absent from persistent clinical state.

CREATE TYPE "BodyMapLaterality" AS ENUM (
  'left',
  'right',
  'bilateral',
  'midline',
  'not_applicable'
);

CREATE TYPE "BodyMapFindingState" AS ENUM (
  'active',
  'resolved'
);

CREATE TYPE "BodyMapCaptureSource" AS ENUM (
  'clinical_capture',
  'staff_intake',
  'provider_review',
  'structured_import'
);

CREATE TABLE "body_map_versions" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "encounterId" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "capturedAt" TIMESTAMP(3) NOT NULL,
  "source" "BodyMapCaptureSource" NOT NULL DEFAULT 'clinical_capture',
  "amendsVersionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "body_map_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "body_map_findings" (
  "id" TEXT NOT NULL,
  "bodyMapVersionId" TEXT NOT NULL,
  "findingKey" TEXT NOT NULL,
  "bodyRegion" TEXT NOT NULL,
  "laterality" "BodyMapLaterality" NOT NULL,
  "symptom" TEXT NOT NULL,
  "severity" INTEGER,
  "clinicalState" "BodyMapFindingState" NOT NULL DEFAULT 'active',
  "functionalImpact" TEXT,
  "radiation" TEXT,
  "annotations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "sourceObservation" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "body_map_findings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "body_map_findings_severity_check"
    CHECK ("severity" IS NULL OR ("severity" >= 0 AND "severity" <= 10)),
  CONSTRAINT "body_map_findings_resolved_severity_check"
    CHECK ("clinicalState" <> 'resolved' OR "severity" IS NULL OR "severity" = 0)
);

CREATE INDEX "body_map_versions_organizationId_patientId_capturedAt_idx"
  ON "body_map_versions"("organizationId", "patientId", "capturedAt");

CREATE INDEX "body_map_versions_organizationId_encounterId_capturedAt_idx"
  ON "body_map_versions"("organizationId", "encounterId", "capturedAt");

CREATE INDEX "body_map_versions_organizationId_amendsVersionId_idx"
  ON "body_map_versions"("organizationId", "amendsVersionId");

CREATE UNIQUE INDEX "body_map_findings_bodyMapVersionId_findingKey_key"
  ON "body_map_findings"("bodyMapVersionId", "findingKey");

CREATE INDEX "body_map_findings_bodyMapVersionId_bodyRegion_laterality_idx"
  ON "body_map_findings"("bodyMapVersionId", "bodyRegion", "laterality");

ALTER TABLE "body_map_versions"
  ADD CONSTRAINT "body_map_versions_amendsVersionId_fkey"
  FOREIGN KEY ("amendsVersionId") REFERENCES "body_map_versions"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "body_map_findings"
  ADD CONSTRAINT "body_map_findings_bodyMapVersionId_fkey"
  FOREIGN KEY ("bodyMapVersionId") REFERENCES "body_map_versions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve durable, ordered decision history for existing provider authority.
--
-- Provider, ProviderCredential, and ProviderFacilityPrivilege remain the current
-- domain authority. The event table is additive, has no cascading foreign keys, and
-- stores only decision snapshots plus evidence references/provenance. Source evidence
-- content remains governed by its own retention, legal-hold, deletion, de-identification,
-- and tombstone policy.

ALTER TABLE "provider_credentials"
    ADD COLUMN IF NOT EXISTS "authorityVersion" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "provider_facility_privileges"
    ADD COLUMN IF NOT EXISTS "authorityVersion" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "providers"
    ADD COLUMN IF NOT EXISTS "malpracticeAuthorityVersion" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS "provider_authority_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "authorityKind" TEXT NOT NULL,
    "authorityRecordId" TEXT NOT NULL,
    "authorityVersion" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT,
    "actorType" TEXT NOT NULL,
    "beforeState" JSONB,
    "afterState" JSONB NOT NULL,
    "evidenceDocumentId" TEXT,
    "evidenceReference" TEXT,
    "provenanceSource" TEXT,
    "note" TEXT,
    "metadata" JSONB,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_authority_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "provider_authority_events_organizationId_authorityKind_authorityRecordId_authorityVersion_key"
    ON "provider_authority_events"("organizationId", "authorityKind", "authorityRecordId", "authorityVersion");
CREATE INDEX IF NOT EXISTS "provider_authority_events_organizationId_providerId_occurredAt_idx"
    ON "provider_authority_events"("organizationId", "providerId", "occurredAt");
CREATE INDEX IF NOT EXISTS "provider_authority_events_authorityKind_authorityRecordId_occurredAt_idx"
    ON "provider_authority_events"("authorityKind", "authorityRecordId", "occurredAt");

-- Establish an honest version-one baseline for every current credential. This does not
-- infer verification or authority; it records exactly the current domain state observed
-- when the migration runs. The event timestamp records when bootstrap occurred; the
-- source record's prior updatedAt is retained separately as metadata provenance.
INSERT INTO "provider_authority_events" (
    "id", "organizationId", "providerId", "authorityKind", "authorityRecordId",
    "authorityVersion", "action", "actorId", "actorType", "beforeState", "afterState",
    "evidenceDocumentId", "evidenceReference", "provenanceSource", "note", "metadata",
    "schemaVersion"
)
SELECT
    'authority_credential_' || "id",
    "organizationId",
    "providerId",
    'credential',
    "id",
    1,
    'history.bootstrap',
    NULL,
    'system_migration',
    NULL,
    jsonb_build_object(
        'id', "id",
        'type', "type",
        'number', "number",
        'state', "state",
        'expiresAt', "expiresAt",
        'status', "status",
        'verificationStatus', "verificationStatus",
        'verificationSource', "verificationSource",
        'primarySourceVerifiedAt', "primarySourceVerifiedAt",
        'evidenceDocumentId', "evidenceDocumentId",
        'evidenceReference', "evidenceReference",
        'exceptionReason', "exceptionReason",
        'verifiedBy', "verifiedBy",
        'reviewNotes', "reviewNotes",
        'authorityVersion', 1
    ),
    "evidenceDocumentId",
    "evidenceReference",
    "verificationSource",
    'Baseline captured from current credential state; no verification inferred.',
    jsonb_build_object(
        'bootstrap', true,
        'retention', 'evidence_reference_only',
        'sourceUpdatedAt', "updatedAt"
    ),
    1
FROM "provider_credentials"
ON CONFLICT ("organizationId", "authorityKind", "authorityRecordId", "authorityVersion") DO NOTHING;

-- Establish the same non-inferential baseline for facility privilege authority.
INSERT INTO "provider_authority_events" (
    "id", "organizationId", "providerId", "authorityKind", "authorityRecordId",
    "authorityVersion", "action", "actorId", "actorType", "beforeState", "afterState",
    "evidenceDocumentId", "evidenceReference", "provenanceSource", "note", "metadata",
    "schemaVersion"
)
SELECT
    'authority_privilege_' || "id",
    "organizationId",
    "providerId",
    'facility_privilege',
    "id",
    1,
    'history.bootstrap',
    NULL,
    'system_migration',
    NULL,
    jsonb_build_object(
        'id', "id",
        'facilityId', "facilityId",
        'status', "status",
        'grantedAt', "grantedAt",
        'expiresAt', "expiresAt",
        'verificationSource', "verificationSource",
        'notes', "notes",
        'authorityVersion', 1
    ),
    NULL,
    NULL,
    "verificationSource",
    'Baseline captured from current facility privilege state; no authority inferred.',
    jsonb_build_object(
        'bootstrap', true,
        'retention', 'authority_decision_only',
        'facilityId', "facilityId",
        'sourceUpdatedAt', "updatedAt"
    ),
    1
FROM "provider_facility_privileges"
ON CONFLICT ("organizationId", "authorityKind", "authorityRecordId", "authorityVersion") DO NOTHING;

-- Malpractice authority currently lives on Provider, so its version is scoped to that
-- coverage decision only. General provider status and identity remain separate domains.
INSERT INTO "provider_authority_events" (
    "id", "organizationId", "providerId", "authorityKind", "authorityRecordId",
    "authorityVersion", "action", "actorId", "actorType", "beforeState", "afterState",
    "evidenceDocumentId", "evidenceReference", "provenanceSource", "note", "metadata",
    "schemaVersion"
)
SELECT
    'authority_malpractice_' || "id",
    "organizationId",
    "id",
    'malpractice',
    "id",
    1,
    'history.bootstrap',
    NULL,
    'system_migration',
    NULL,
    jsonb_build_object(
        'providerId', "id",
        'carrier', "malpracticeCarrier",
        'policyNumber', "malpracticePolicyNumber",
        'expiration', "malpracticeExpiration",
        'coverageAmountCents', "malpracticeCoverageAmountCents",
        'evidenceReference', "malpracticeEvidenceReference",
        'verificationStatus', "malpracticeVerificationStatus",
        'verifiedAt', "malpracticeVerifiedAt",
        'verifiedBy', "malpracticeVerifiedBy",
        'reviewNotes', "malpracticeReviewNotes",
        'authorityVersion', 1,
        'providerVerificationStatus', "verificationStatus"
    ),
    NULL,
    "malpracticeEvidenceReference",
    'provider_current_state',
    'Baseline captured from current malpractice state; no verification inferred.',
    jsonb_build_object(
        'bootstrap', true,
        'retention', 'evidence_reference_only',
        'sourceUpdatedAt', "updatedAt"
    ),
    1
FROM "providers"
ON CONFLICT ("organizationId", "authorityKind", "authorityRecordId", "authorityVersion") DO NOTHING;

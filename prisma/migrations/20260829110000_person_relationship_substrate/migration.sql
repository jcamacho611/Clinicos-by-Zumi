-- Add the durable Person relationship substrate without changing authorization.
--
-- A relationship may describe a Person as a learner, professional, contractor,
-- preceptor, owner, expert, patient, or other participant and may carry an explicit
-- trace to an existing domain record. Relationship or verification metadata is
-- context/evidence only. It does not grant professional, clinical, billing,
-- organization-binding, public-listing, signing, payout, school/site approval, or
-- other consequential authority.
--
-- Additive and idempotent: no legacy domain row is rewritten or inferred here.

CREATE TABLE IF NOT EXISTS "person_relationships" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL,
    "organizationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "verificationState" TEXT NOT NULL DEFAULT 'claimed',
    "domainKind" TEXT,
    "domainRecordId" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'system',
    "sourceReference" TEXT,
    "evidenceReference" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "person_relationships_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "person_relationships_personId_status_idx"
    ON "person_relationships"("personId", "status");
CREATE INDEX IF NOT EXISTS "person_relationships_organizationId_status_idx"
    ON "person_relationships"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "person_relationships_relationshipType_status_idx"
    ON "person_relationships"("relationshipType", "status");
CREATE INDEX IF NOT EXISTS "person_relationships_domainKind_domainRecordId_idx"
    ON "person_relationships"("domainKind", "domainRecordId");
CREATE INDEX IF NOT EXISTS "person_relationships_effectiveFrom_effectiveTo_idx"
    ON "person_relationships"("effectiveFrom", "effectiveTo");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'person_relationships_personId_fkey'
      AND conrelid = '"person_relationships"'::regclass
  ) THEN
    ALTER TABLE "person_relationships"
      ADD CONSTRAINT "person_relationships_personId_fkey"
      FOREIGN KEY ("personId") REFERENCES "people"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Member signup legal evidence binds the existing legal ledger to the canonical
-- Person/Account identity without making legal evidence destructively owned by it.
-- Executed agreement evidence intentionally survives later account/person deletion.
ALTER TABLE "access_gate_acceptances"
  ADD COLUMN IF NOT EXISTS "personId" TEXT,
  ADD COLUMN IF NOT EXISTS "accountId" TEXT;

ALTER TABLE "legal_agreement_events"
  ADD COLUMN IF NOT EXISTS "personId" TEXT,
  ADD COLUMN IF NOT EXISTS "accountId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "access_gate_acceptances_account_active_version_key"
  ON "access_gate_acceptances"("accountId", "documentKey", "documentVersion")
  WHERE "accountId" IS NOT NULL AND "status" = 'active';

CREATE INDEX IF NOT EXISTS "access_gate_acceptances_person_idx"
  ON "access_gate_acceptances"("personId", "acceptedAt");

CREATE INDEX IF NOT EXISTS "access_gate_acceptances_account_idx"
  ON "access_gate_acceptances"("accountId", "acceptedAt");

CREATE INDEX IF NOT EXISTS "legal_agreement_events_person_idx"
  ON "legal_agreement_events"("personId", "occurredAt");

CREATE INDEX IF NOT EXISTS "legal_agreement_events_account_idx"
  ON "legal_agreement_events"("accountId", "occurredAt");

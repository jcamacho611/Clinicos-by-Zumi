-- Where a clinic records that it needs expertise it does not have.
--
-- The Expert Grid engines evaluate eligibility, ranking and staged access, but nothing
-- persisted a request, so a clinic that hit a gap had nowhere for it to go. This is the
-- demand half only. There is no expert supply in this product yet, and this table
-- deliberately does not pretend otherwise: a request is captured, owned and followed up
-- by a person. No matching happens on write.
--
-- `dataAccessClass` defaults to 'none' and is the point of the whole design. Being
-- matched to a request must never convey access to anything — access is a separate,
-- later, explicitly authorized decision, and a default of anything other than 'none'
-- would quietly invert that.

CREATE TABLE IF NOT EXISTS "expert_support_requests" (
  "id"                TEXT PRIMARY KEY,
  "organizationId"    TEXT NOT NULL,
  "requestedByUserId" TEXT,
  "capabilityDomain"  TEXT NOT NULL,
  "outcomeWanted"     TEXT NOT NULL,
  "urgency"           TEXT NOT NULL DEFAULT 'routine',
  "jurisdictionKey"   TEXT,
  "remoteAllowed"     BOOLEAN NOT NULL DEFAULT TRUE,
  "neededBy"          TIMESTAMP(3),
  -- What the requester believes is needed. Never widened without an explicit decision.
  "dataAccessClass"   TEXT NOT NULL DEFAULT 'none',
  "status"            TEXT NOT NULL DEFAULT 'submitted',
  "sourceNeedKey"     TEXT,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "expert_support_requests_urgency_check"
    CHECK ("urgency" IN ('routine', 'priority', 'urgent', 'critical')),
  CONSTRAINT "expert_support_requests_status_check"
    CHECK ("status" IN ('submitted', 'in_review', 'matched', 'declined', 'withdrawn', 'completed')),
  -- Only these four classes exist, and a request may not invent a fifth.
  CONSTRAINT "expert_support_requests_access_check"
    CHECK ("dataAccessClass" IN ('none', 'deidentified', 'limited_phi', 'phi')),
  -- A request that cannot say what outcome it wants is not actionable by anyone.
  CONSTRAINT "expert_support_requests_outcome_check"
    CHECK (length(btrim("outcomeWanted")) >= 10)
);

CREATE INDEX IF NOT EXISTS "expert_support_requests_org_status_idx"
  ON "expert_support_requests" ("organizationId", "status", "createdAt");

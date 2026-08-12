-- Grid participants.
--
-- Grid participation is currently a `Provider` row: a person, inside exactly one
-- organization, with one professional profile. That inherits the whole-system identity
-- constraint — `User.organizationId` is a required scalar — so a clinician who works
-- with two clinics needs two accounts, and an organization or a facility cannot
-- participate in Grid as itself at all.
--
-- GridParticipant is the boundary abstraction. A participant is an actor in the
-- marketplace: a person, an organization, or a facility. Crucially `userId` is NOT
-- unique here — one human may hold several participations, each sponsored by a different
-- organization, which is precisely what the identity schema cannot express and what
-- multi-party composition will require.
--
-- This does not migrate identity. It gives Grid somewhere correct to stand while the
-- wider migration is still a product decision.

CREATE TABLE IF NOT EXISTS "grid_participants" (
  "id"                    TEXT NOT NULL,
  -- person | organization | facility
  "kind"                  TEXT NOT NULL,
  -- Exactly one of the four subject columns is set, matching `kind`. Enforced by the
  -- CHECK below so a malformed participant cannot be written at all.
  "userId"                TEXT,
  "providerId"            TEXT,
  "subjectOrganizationId" TEXT,
  "facilityId"            TEXT,
  -- The organization accountable for this participation, and the tenant scope for every
  -- Grid query about it. Separate from the subject: a person sponsored by a clinic is a
  -- different participation from the same person sponsored by an agency.
  "sponsorOrganizationId" TEXT NOT NULL,
  "displayName"           TEXT NOT NULL,
  "status"                TEXT NOT NULL DEFAULT 'created',
  "statusReason"          TEXT,
  "verifiedAt"            TIMESTAMP(3),
  "verifiedBy"            TEXT,
  "suspendedAt"           TIMESTAMP(3),
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL,
  CONSTRAINT "grid_participants_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "grid_participants"
  ADD CONSTRAINT "grid_participants_sponsorOrganizationId_fkey"
  FOREIGN KEY ("sponsorOrganizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "grid_participants"
  ADD CONSTRAINT "grid_participants_subjectOrganizationId_fkey"
  FOREIGN KEY ("subjectOrganizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "grid_participants"
  ADD CONSTRAINT "grid_participants_providerId_fkey"
  FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "grid_participants"
  ADD CONSTRAINT "grid_participants_facilityId_fkey"
  FOREIGN KEY ("facilityId") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A participant must be exactly the kind of thing it says it is. Written NOT VALID so it
-- governs every new write without a retroactive scan of a table that is empty anyway.
ALTER TABLE "grid_participants"
  ADD CONSTRAINT "grid_participants_kind_subject_check"
  CHECK (
    (kind = 'person'       AND "providerId" IS NOT NULL AND "subjectOrganizationId" IS NULL AND "facilityId" IS NULL)
    OR (kind = 'organization' AND "subjectOrganizationId" IS NOT NULL AND "providerId" IS NULL AND "facilityId" IS NULL)
    OR (kind = 'facility'     AND "facilityId" IS NOT NULL AND "providerId" IS NULL AND "subjectOrganizationId" IS NULL)
  ) NOT VALID;

ALTER TABLE "grid_participants"
  ADD CONSTRAINT "grid_participants_status_check"
  CHECK ("status" IN (
    'created', 'profile_incomplete', 'verification_required', 'in_review',
    'verified', 'active', 'restricted', 'suspended', 'revoked', 'closed'
  )) NOT VALID;

-- One participation per subject per sponsor. A person may be a participant under many
-- sponsors — that is the point — but not twice under the same one. Postgres treats NULLs
-- as distinct in a unique index, so the unused subject columns do not collide.
CREATE UNIQUE INDEX IF NOT EXISTS "grid_participants_person_sponsor_key"
  ON "grid_participants"("providerId", "sponsorOrganizationId");
CREATE UNIQUE INDEX IF NOT EXISTS "grid_participants_org_sponsor_key"
  ON "grid_participants"("subjectOrganizationId", "sponsorOrganizationId");
CREATE UNIQUE INDEX IF NOT EXISTS "grid_participants_facility_sponsor_key"
  ON "grid_participants"("facilityId", "sponsorOrganizationId");

CREATE INDEX IF NOT EXISTS "grid_participants_sponsorOrganizationId_status_idx" ON "grid_participants"("sponsorOrganizationId", "status");
CREATE INDEX IF NOT EXISTS "grid_participants_userId_idx" ON "grid_participants"("userId");
CREATE INDEX IF NOT EXISTS "grid_participants_kind_idx" ON "grid_participants"("kind");

-- Backfill from the Grid providers that already exist, so the abstraction describes the
-- marketplace that is running rather than starting empty beside it. Provider
-- verification states map onto participant states; anything unrecognised becomes
-- `created`, which grants nothing.
INSERT INTO "grid_participants" (
  "id", "kind", "userId", "providerId", "sponsorOrganizationId", "displayName",
  "status", "verifiedAt", "createdAt", "updatedAt"
)
SELECT
  'gp_' || p."id",
  'person',
  p."userId",
  p."id",
  p."organizationId",
  p."displayName",
  CASE p."verificationStatus"
    WHEN 'verified'     THEN 'verified'
    WHEN 'submitted'    THEN 'in_review'
    WHEN 'needs_review' THEN 'in_review'
    WHEN 'rejected'     THEN 'revoked'
    WHEN 'suspended'    THEN 'suspended'
    WHEN 'expired'      THEN 'restricted'
    WHEN 'draft'        THEN 'profile_incomplete'
    ELSE 'created'
  END,
  p."approvedAt",
  p."createdAt",
  CURRENT_TIMESTAMP
FROM "providers" p
WHERE p."engagementType" = 'independent_contractor'
ON CONFLICT DO NOTHING;

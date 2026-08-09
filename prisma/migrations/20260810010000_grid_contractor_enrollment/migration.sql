-- Extend the existing provider-backed Grid with independent-contractor enrollment.
ALTER TABLE "providers"
  ADD COLUMN "engagementType" TEXT NOT NULL DEFAULT 'staff',
  ADD COLUMN "contactEmail" TEXT,
  ADD COLUMN "contactPhone" TEXT,
  ADD COLUMN "malpracticeCoverageAmountCents" INTEGER,
  ADD COLUMN "malpracticeEvidenceReference" TEXT,
  ADD COLUMN "malpracticeVerificationStatus" TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN "malpracticeVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "malpracticeVerifiedBy" TEXT,
  ADD COLUMN "malpracticeReviewNotes" TEXT,
  ADD COLUMN "onCallNow" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "applicationSubmittedAt" TIMESTAMP(3);

-- Existing human-approved synthetic providers already have reviewed coverage.
UPDATE "providers"
SET "malpracticeVerificationStatus" = 'verified',
    "malpracticeVerifiedAt" = COALESCE("approvedAt", CURRENT_TIMESTAMP),
    "malpracticeVerifiedBy" = COALESCE("approvedBy", 'migration_backfill')
WHERE "verificationStatus" = 'verified'
  AND "malpracticeExpiration" IS NOT NULL;

CREATE UNIQUE INDEX "providers_userId_key" ON "providers"("userId");
ALTER TABLE "providers" ADD CONSTRAINT "providers_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "providers" ADD CONSTRAINT "providers_engagement_type_check"
  CHECK ("engagementType" IN ('staff', 'independent_contractor'));
ALTER TABLE "providers" ADD CONSTRAINT "providers_malpractice_verification_status_check"
  CHECK ("malpracticeVerificationStatus" IN ('pending', 'verified', 'rejected', 'expired'));
ALTER TABLE "providers" ADD CONSTRAINT "providers_malpractice_coverage_amount_check"
  CHECK ("malpracticeCoverageAmountCents" IS NULL OR "malpracticeCoverageAmountCents" >= 0);

ALTER TABLE "provider_credentials"
  ADD COLUMN "evidenceReference" TEXT,
  ADD COLUMN "verifiedBy" TEXT,
  ADD COLUMN "reviewNotes" TEXT;

ALTER TABLE "grid_requests" DROP CONSTRAINT "grid_requests_status_check";
ALTER TABLE "grid_requests" ADD CONSTRAINT "grid_requests_status_check"
  CHECK ("status" IN ('draft', 'requested', 'accepted', 'countered', 'provider_review', 'location_review', 'credential_check', 'pending_deposit', 'confirmed', 'completed', 'cancelled', 'declined', 'escalated'));
ALTER TABLE "grid_requests" ADD COLUMN "counterStartAt" TIMESTAMP(3);
ALTER TABLE "grid_requests" ADD CONSTRAINT "grid_requests_counter_time_check"
  CHECK ("status" <> 'countered' OR "counterStartAt" IS NOT NULL);

CREATE TABLE "grid_payouts" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "gridRequestId" TEXT NOT NULL,
  "grossAmountCents" INTEGER NOT NULL,
  "platformFeeCents" INTEGER NOT NULL DEFAULT 0,
  "netAmountCents" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'estimated',
  "approvedAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "externalReference" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "grid_payouts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "grid_payouts_gridRequestId_key" ON "grid_payouts"("gridRequestId");
CREATE INDEX "grid_payouts_organizationId_status_createdAt_idx" ON "grid_payouts"("organizationId", "status", "createdAt");
CREATE INDEX "grid_payouts_providerId_status_createdAt_idx" ON "grid_payouts"("providerId", "status", "createdAt");

ALTER TABLE "grid_payouts" ADD CONSTRAINT "grid_payouts_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "grid_payouts" ADD CONSTRAINT "grid_payouts_providerId_fkey"
  FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grid_payouts" ADD CONSTRAINT "grid_payouts_gridRequestId_fkey"
  FOREIGN KEY ("gridRequestId") REFERENCES "grid_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "grid_payouts" ADD CONSTRAINT "grid_payouts_status_check"
  CHECK ("status" IN ('estimated', 'approved', 'paid', 'hold', 'void'));
ALTER TABLE "grid_payouts" ADD CONSTRAINT "grid_payouts_amounts_check"
  CHECK (
    "grossAmountCents" >= 0
    AND "platformFeeCents" >= 0
    AND "platformFeeCents" <= "grossAmountCents"
    AND "netAmountCents" = "grossAmountCents" - "platformFeeCents"
  );

-- Register the least-privileged contractor role in every existing tenant.
INSERT INTO "roles" ("id", "organizationId", "key", "name", "description", "createdAt", "updatedAt")
SELECT 'grid-contractor-role-' || organization_record."id", organization_record."id", 'contractor',
       'Independent Contractor',
       'GRID contractor access limited to the contractor profile, availability, requests, and payout estimates.',
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "organizations" organization_record
ON CONFLICT ("organizationId", "key") DO NOTHING;

INSERT INTO "permissions" ("id", "roleId", "resource", "action", "allowed", "createdAt", "updatedAt")
SELECT 'grid-contractor-permission-' || md5(role_record."id" || access."action"),
       role_record."id", 'grid', access."action", true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "roles" role_record
CROSS JOIN (VALUES ('read'), ('update')) AS access("action")
WHERE role_record."key" = 'contractor'
  AND NOT EXISTS (
    SELECT 1 FROM "permissions" permission
    WHERE permission."roleId" = role_record."id"
      AND permission."resource" = 'grid'
      AND permission."action" = access."action"
  );

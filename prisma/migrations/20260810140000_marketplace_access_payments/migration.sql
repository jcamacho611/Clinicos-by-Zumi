-- Marketplace access payments and paid onboarding.
--
-- These are one-time review and onboarding fees paid by prospective contractors,
-- location owners, sellers, and clinics. They are deliberately separate from the
-- patient-billing "payments" table, which is clinical revenue cycle scoped to a
-- patient inside a tenant.
--
-- No card data is stored. Only a provider reference to the external transaction.

CREATE TABLE "access_payments" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "organizationId" TEXT,
  "provider" TEXT NOT NULL DEFAULT 'whop',
  "productKey" TEXT NOT NULL,
  "roleTarget" TEXT NOT NULL,
  "buyerEmail" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "externalCheckoutUrl" TEXT,
  "externalPaymentReference" TEXT,
  "status" TEXT NOT NULL DEFAULT 'created',
  "portalAccessStatus" TEXT NOT NULL DEFAULT 'pending',
  "verifiedBy" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "reviewNotes" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "access_payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "access_payments_buyerEmail_status_idx" ON "access_payments"("buyerEmail", "status");
CREATE INDEX "access_payments_status_createdAt_idx" ON "access_payments"("status", "createdAt");
CREATE INDEX "access_payments_roleTarget_portalAccessStatus_idx" ON "access_payments"("roleTarget", "portalAccessStatus");
CREATE INDEX "access_payments_externalPaymentReference_idx" ON "access_payments"("externalPaymentReference");

ALTER TABLE "access_payments"
  ADD CONSTRAINT "access_payments_provider_check"
  CHECK ("provider" IN ('manual', 'whop', 'stripe'));

ALTER TABLE "access_payments"
  ADD CONSTRAINT "access_payments_product_check"
  CHECK ("productKey" IN (
    'clinic_workflow_review', 'founding_clinic_seat', 'contractor_application_review',
    'room_listing_review', 'seller_listing_review', 'ai_consulting_call'
  ));

ALTER TABLE "access_payments"
  ADD CONSTRAINT "access_payments_role_target_check"
  CHECK ("roleTarget" IN ('clinic', 'contractor', 'location_owner', 'seller', 'advisory'));

ALTER TABLE "access_payments"
  ADD CONSTRAINT "access_payments_status_check"
  CHECK ("status" IN (
    'created', 'pending_verification', 'verified_paid', 'failed',
    'refunded', 'disputed', 'held', 'reconciled'
  ));

ALTER TABLE "access_payments"
  ADD CONSTRAINT "access_payments_access_status_check"
  CHECK ("portalAccessStatus" IN ('pending', 'granted', 'suspended', 'revoked'));

-- Price is server-controlled and always positive; a zero-price "purchase" must not
-- be able to open a portal.
ALTER TABLE "access_payments"
  ADD CONSTRAINT "access_payments_amount_check"
  CHECK ("amountCents" > 0);

-- A payment that reads as paid must carry the provider reference that proves it,
-- and a human verifier must be recorded with the time they decided.
ALTER TABLE "access_payments"
  ADD CONSTRAINT "access_payments_paid_provenance_check"
  CHECK ("status" NOT IN ('verified_paid', 'reconciled') OR "externalPaymentReference" IS NOT NULL);

ALTER TABLE "access_payments"
  ADD CONSTRAINT "access_payments_verifier_check"
  CHECK (("verifiedBy" IS NULL) = ("verifiedAt" IS NULL));

-- Portal access may only be granted off a payment that actually settled.
ALTER TABLE "access_payments"
  ADD CONSTRAINT "access_payments_grant_requires_paid_check"
  CHECK ("portalAccessStatus" <> 'granted' OR "status" IN ('verified_paid', 'reconciled'));

CREATE TABLE "paid_onboardings" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "accessPaymentId" TEXT NOT NULL,
  "roleTarget" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "reviewApproved" BOOLEAN NOT NULL DEFAULT false,
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "paid_onboardings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "paid_onboardings_accessPaymentId_key" ON "paid_onboardings"("accessPaymentId");
CREATE INDEX "paid_onboardings_roleTarget_status_idx" ON "paid_onboardings"("roleTarget", "status");
CREATE INDEX "paid_onboardings_userId_idx" ON "paid_onboardings"("userId");

ALTER TABLE "paid_onboardings"
  ADD CONSTRAINT "paid_onboardings_accessPaymentId_fkey"
  FOREIGN KEY ("accessPaymentId") REFERENCES "access_payments"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "paid_onboardings"
  ADD CONSTRAINT "paid_onboardings_status_check"
  CHECK ("status" IN ('pending', 'in_review', 'completed', 'canceled'));

ALTER TABLE "paid_onboardings"
  ADD CONSTRAINT "paid_onboardings_role_target_check"
  CHECK ("roleTarget" IN ('clinic', 'contractor', 'location_owner', 'seller', 'advisory'));

-- An approval is a human act and must record who made it and when.
ALTER TABLE "paid_onboardings"
  ADD CONSTRAINT "paid_onboardings_review_evidence_check"
  CHECK ("reviewApproved" = false OR ("reviewedBy" IS NOT NULL AND "reviewedAt" IS NOT NULL));

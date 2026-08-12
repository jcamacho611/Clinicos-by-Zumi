-- Klinikos commercial truth layer.
--
-- Payment processors/connectors provide evidence. Klinikos-owned subscription,
-- entitlement, allowance, and usage records remain authoritative for product access.
-- These tables are intentionally provider-neutral and additive so GoDaddy manual
-- reconciliation, Whop signed webhooks, and future approved processors can all
-- converge on the same server-side state.

-- An active subscription must be distinguishable from a trial/imported state that
-- has never been backed by verified payment evidence. Prisma does not need to know
-- these columns yet because the commercial repositories intentionally read/write
-- them through audited server-side SQL.
ALTER TABLE "subscriptions"
  ADD COLUMN IF NOT EXISTS "paymentConfirmedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "paymentProvider" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentEvidenceId" TEXT;

CREATE INDEX IF NOT EXISTS "subscriptions_payment_confirmation_idx"
  ON "subscriptions" ("organizationId", "status", "paymentConfirmedAt");

CREATE TABLE IF NOT EXISTS "commercial_checkout_intents" (
  "id" TEXT PRIMARY KEY,
  "state" TEXT NOT NULL UNIQUE,
  "provider" TEXT NOT NULL,
  "productKey" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "organizationId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'created',
  "externalCheckoutId" TEXT,
  "externalCustomerId" TEXT,
  "externalSubscriptionId" TEXT,
  "amountCents" INTEGER,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "commercial_checkout_intents_status_check"
    CHECK ("status" IN ('created', 'completed', 'expired', 'abandoned')),
  CONSTRAINT "commercial_checkout_intents_amount_check"
    CHECK ("amountCents" IS NULL OR "amountCents" >= 0),
  CONSTRAINT "commercial_checkout_intents_org_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "commercial_checkout_intents_org_status_idx"
  ON "commercial_checkout_intents" ("organizationId", "status");
CREATE INDEX IF NOT EXISTS "commercial_checkout_intents_provider_external_idx"
  ON "commercial_checkout_intents" ("provider", "externalCheckoutId");

CREATE TABLE IF NOT EXISTS "commercial_payment_events" (
  "id" TEXT PRIMARY KEY,
  "provider" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "verified" BOOLEAN NOT NULL DEFAULT FALSE,
  "verificationMethod" TEXT NOT NULL DEFAULT 'unverified',
  "processorVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "payloadHash" TEXT NOT NULL,
  "processingStatus" TEXT NOT NULL DEFAULT 'received',
  "externalCustomerId" TEXT,
  "externalSubscriptionId" TEXT,
  "organizationId" TEXT,
  "productKey" TEXT,
  "amountCents" INTEGER,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "payload" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "failureReason" TEXT,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  CONSTRAINT "commercial_payment_events_provider_event_key" UNIQUE ("provider", "eventId"),
  CONSTRAINT "commercial_payment_events_verification_check"
    CHECK ("verificationMethod" IN ('webhook_signature', 'api_verification', 'manual_reconciliation', 'unverified')),
  CONSTRAINT "commercial_payment_events_processing_check"
    CHECK ("processingStatus" IN ('received', 'ignored', 'applied', 'failed')),
  CONSTRAINT "commercial_payment_events_applied_verified_check"
    CHECK ("processingStatus" <> 'applied' OR "verified" = TRUE),
  CONSTRAINT "commercial_payment_events_processor_manual_check"
    CHECK (NOT ("processorVerified" = TRUE AND "verificationMethod" = 'manual_reconciliation')),
  CONSTRAINT "commercial_payment_events_amount_check"
    CHECK ("amountCents" IS NULL OR "amountCents" >= 0),
  CONSTRAINT "commercial_payment_events_org_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "commercial_payment_events_org_received_idx"
  ON "commercial_payment_events" ("organizationId", "receivedAt" DESC);
CREATE INDEX IF NOT EXISTS "commercial_payment_events_subscription_idx"
  ON "commercial_payment_events" ("provider", "externalSubscriptionId");

CREATE TABLE IF NOT EXISTS "commercial_funding_accounts" (
  "organizationId" TEXT PRIMARY KEY,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "prepaidBalanceCents" INTEGER NOT NULL DEFAULT 0,
  "prepaidReservedCents" INTEGER NOT NULL DEFAULT 0,
  "authorizedOverageLimitCents" INTEGER NOT NULL DEFAULT 0,
  "authorizedOverageConsumedCents" INTEGER NOT NULL DEFAULT 0,
  "authorizedOverageReservedCents" INTEGER NOT NULL DEFAULT 0,
  "blockedAt" TIMESTAMP(3),
  "blockReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "commercial_funding_accounts_nonnegative_check"
    CHECK (
      "prepaidBalanceCents" >= 0 AND
      "prepaidReservedCents" >= 0 AND
      "authorizedOverageLimitCents" >= 0 AND
      "authorizedOverageConsumedCents" >= 0 AND
      "authorizedOverageReservedCents" >= 0
    ),
  CONSTRAINT "commercial_funding_accounts_prepaid_reserve_check"
    CHECK ("prepaidReservedCents" <= "prepaidBalanceCents"),
  CONSTRAINT "commercial_funding_accounts_overage_check"
    CHECK ("authorizedOverageConsumedCents" + "authorizedOverageReservedCents" <= "authorizedOverageLimitCents"),
  CONSTRAINT "commercial_funding_accounts_org_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "commercial_usage_allowances" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "billingPeriodKey" TEXT NOT NULL,
  "bucket" TEXT NOT NULL,
  "includedBudgetCents" INTEGER NOT NULL DEFAULT 0,
  "includedConsumedCents" INTEGER NOT NULL DEFAULT 0,
  "includedReservedCents" INTEGER NOT NULL DEFAULT 0,
  "hardLimitCents" INTEGER,
  "periodStartsAt" TIMESTAMP(3) NOT NULL,
  "periodEndsAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "commercial_usage_allowances_org_period_bucket_key"
    UNIQUE ("organizationId", "billingPeriodKey", "bucket"),
  CONSTRAINT "commercial_usage_allowances_nonnegative_check"
    CHECK (
      "includedBudgetCents" >= 0 AND
      "includedConsumedCents" >= 0 AND
      "includedReservedCents" >= 0 AND
      ("hardLimitCents" IS NULL OR "hardLimitCents" >= 0)
    ),
  CONSTRAINT "commercial_usage_allowances_budget_check"
    CHECK ("includedConsumedCents" + "includedReservedCents" <= "includedBudgetCents"),
  CONSTRAINT "commercial_usage_allowances_period_check"
    CHECK ("periodEndsAt" > "periodStartsAt"),
  CONSTRAINT "commercial_usage_allowances_org_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "commercial_usage_allowances_org_period_idx"
  ON "commercial_usage_allowances" ("organizationId", "periodStartsAt", "periodEndsAt");

CREATE TABLE IF NOT EXISTS "commercial_usage_reservations" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "billingPeriodKey" TEXT NOT NULL,
  "bucket" TEXT NOT NULL,
  "capability" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "provider" TEXT,
  "service" TEXT,
  "estimatedCostCents" INTEGER NOT NULL,
  "includedReservedCents" INTEGER NOT NULL DEFAULT 0,
  "prepaidReservedCents" INTEGER NOT NULL DEFAULT 0,
  "overageReservedCents" INTEGER NOT NULL DEFAULT 0,
  "actualCostCents" INTEGER,
  "unfundedOverrunCents" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'reserved',
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "settledAt" TIMESTAMP(3),
  "releasedAt" TIMESTAMP(3),
  CONSTRAINT "commercial_usage_reservations_org_idempotency_key"
    UNIQUE ("organizationId", "idempotencyKey"),
  CONSTRAINT "commercial_usage_reservations_status_check"
    CHECK ("status" IN ('reserved', 'settled', 'released', 'expired', 'settled_with_overrun')),
  CONSTRAINT "commercial_usage_reservations_nonnegative_check"
    CHECK (
      "estimatedCostCents" >= 0 AND
      "includedReservedCents" >= 0 AND
      "prepaidReservedCents" >= 0 AND
      "overageReservedCents" >= 0 AND
      ("actualCostCents" IS NULL OR "actualCostCents" >= 0) AND
      "unfundedOverrunCents" >= 0
    ),
  CONSTRAINT "commercial_usage_reservations_allocation_check"
    CHECK ("includedReservedCents" + "prepaidReservedCents" + "overageReservedCents" = "estimatedCostCents"),
  CONSTRAINT "commercial_usage_reservations_org_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "commercial_usage_reservations_org_status_idx"
  ON "commercial_usage_reservations" ("organizationId", "status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "commercial_usage_reservations_provider_idx"
  ON "commercial_usage_reservations" ("provider", "createdAt" DESC);

CREATE TABLE IF NOT EXISTS "commercial_usage_entries" (
  "id" TEXT PRIMARY KEY,
  "reservationId" TEXT NOT NULL UNIQUE,
  "organizationId" TEXT NOT NULL,
  "bucket" TEXT NOT NULL,
  "capability" TEXT NOT NULL,
  "provider" TEXT,
  "service" TEXT,
  "actualCostCents" INTEGER NOT NULL,
  "fundedCostCents" INTEGER NOT NULL,
  "unfundedOverrunCents" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "commercial_usage_entries_nonnegative_check"
    CHECK (
      "actualCostCents" >= 0 AND
      "fundedCostCents" >= 0 AND
      "unfundedOverrunCents" >= 0 AND
      "fundedCostCents" + "unfundedOverrunCents" = "actualCostCents"
    ),
  CONSTRAINT "commercial_usage_entries_reservation_fkey"
    FOREIGN KEY ("reservationId") REFERENCES "commercial_usage_reservations"("id") ON DELETE RESTRICT,
  CONSTRAINT "commercial_usage_entries_org_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "commercial_usage_entries_org_bucket_idx"
  ON "commercial_usage_entries" ("organizationId", "bucket", "createdAt" DESC);

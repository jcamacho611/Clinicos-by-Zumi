-- Preserve processor environment, external correlation, failures, and refunds as
-- first-class Financial OS facts. These columns extend the existing provider-neutral
-- commercial intent/evidence tables; they do not create a Stripe-specific ledger.

ALTER TABLE "commercial_checkout_intents"
  ADD COLUMN IF NOT EXISTS "processorMode" TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS "externalPaymentIntentId" TEXT,
  ADD COLUMN IF NOT EXISTS "refundedAmountCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "refundedAt" TIMESTAMP(3);

ALTER TABLE "commercial_checkout_intents"
  DROP CONSTRAINT IF EXISTS "commercial_checkout_intents_status_check";

ALTER TABLE "commercial_checkout_intents"
  ADD CONSTRAINT "commercial_checkout_intents_status_check"
    CHECK ("status" IN ('created', 'completed', 'expired', 'abandoned', 'refunded')),
  ADD CONSTRAINT "commercial_checkout_intents_processor_mode_check"
    CHECK ("processorMode" IN ('manual', 'test', 'live')),
  ADD CONSTRAINT "commercial_checkout_intents_refund_check"
    CHECK (
      "refundedAmountCents" >= 0 AND
      ("amountCents" IS NULL OR "refundedAmountCents" <= "amountCents")
    );

CREATE UNIQUE INDEX IF NOT EXISTS "commercial_checkout_intents_provider_payment_intent_key"
  ON "commercial_checkout_intents" ("provider", "externalPaymentIntentId")
  WHERE "externalPaymentIntentId" IS NOT NULL;

ALTER TABLE "commercial_payment_events"
  ADD COLUMN IF NOT EXISTS "processorMode" TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS "outcome" TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS "externalCheckoutId" TEXT,
  ADD COLUMN IF NOT EXISTS "externalPaymentIntentId" TEXT;

-- Preserve what historical processing can actually prove. Applied verified events
-- represent successful evidence, failed events remain failures, and all other old
-- rows stay pending/unknown rather than being invented as successful payments.
UPDATE "commercial_payment_events"
SET "outcome" = CASE
  WHEN "processingStatus" = 'applied' AND "verified" = TRUE THEN 'succeeded'
  WHEN "processingStatus" = 'failed' THEN 'failed'
  ELSE 'pending'
END;

ALTER TABLE "commercial_payment_events"
  ADD CONSTRAINT "commercial_payment_events_processor_mode_check"
    CHECK ("processorMode" IN ('manual', 'test', 'live')),
  ADD CONSTRAINT "commercial_payment_events_outcome_check"
    CHECK ("outcome" IN ('pending', 'succeeded', 'failed', 'refunded'));

-- Existing provider evidence predates explicit environment classification and
-- therefore remains `manual`/unknown. New processor-verified writes are required
-- by the application boundary to declare `test` or `live`; do not invent mode for
-- historical rows or make a populated production migration fail on honest unknowns.

CREATE INDEX IF NOT EXISTS "commercial_payment_events_processor_reference_idx"
  ON "commercial_payment_events" ("provider", "externalCheckoutId", "externalPaymentIntentId");

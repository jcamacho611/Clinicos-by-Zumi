-- Commercial Fabric sales-state forward migration.
--
-- Historical reservation values remain readable for audit/reconciliation. New
-- application writes use first-value / economic-value progression and never need the
-- retired fixed clinic sales funnel. This migration intentionally widens constraints
-- instead of rewriting old evidence.

ALTER TABLE "demo_reservations"
  DROP CONSTRAINT IF EXISTS "demo_reservations_offer_check";

ALTER TABLE "demo_reservations"
  ADD CONSTRAINT "demo_reservations_offer_check" CHECK (
    "selectedOffer" IN (
      'first_value',
      'deep_operating_audit',
      'proof_sprint',
      -- Evidence-only values retained so historical rows remain valid.
      'private_workflow_demo',
      'founding_clinic_evaluation',
      'founding_clinic_program'
    )
  );

ALTER TABLE "demo_reservations"
  DROP CONSTRAINT IF EXISTS "demo_reservations_status_check";

ALTER TABLE "demo_reservations"
  ADD CONSTRAINT "demo_reservations_status_check" CHECK (
    "status" IN (
      'inquiry',
      'qualified',
      'first_value_ready',
      'first_value_delivered',
      'paid_capability_review',
      'proof_in_progress',
      'measured',
      'expansion_ready',
      'closed_lost',
      -- Evidence-only historical states.
      'payment_pending',
      'reserved',
      'scheduled',
      'completed',
      'no_show',
      'moved_to_evaluation',
      'moved_to_founding'
    )
  );

ALTER TABLE "demo_reservations"
  DROP CONSTRAINT IF EXISTS "demo_reservations_payment_status_check";

ALTER TABLE "demo_reservations"
  ADD CONSTRAINT "demo_reservations_payment_status_check" CHECK (
    "paymentStatus" IN (
      'not_requested',
      'scope_pending',
      'payment_pending',
      'payment_recorded',
      'waived',
      'refunded',
      -- Evidence-only historical values.
      'not_started',
      'manual_link_required',
      'credited_forward'
    )
  );

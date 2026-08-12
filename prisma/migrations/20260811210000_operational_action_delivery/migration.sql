-- Delivery evidence for operational actions.
--
-- Before this, a patient message became `executed` by writing a state string. Nothing
-- recorded that a provider had accepted it, because nothing had asked one. These
-- columns are the evidence that makes `executed` mean an operation occurred: the
-- service refuses to write that state for a patient message without a provider
-- reference, so the column and the state stay honest together.
--
-- Additive and nullable throughout. Existing rows keep their meaning; the actions the
-- old code marked `executed` were internal tasks, which legitimately have no provider.

ALTER TABLE "operational_actions"
  ADD COLUMN IF NOT EXISTS "deliveryProvider" TEXT,
  ADD COLUMN IF NOT EXISTS "deliveryReference" TEXT,
  ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deliveryFailure" TEXT;

CREATE INDEX IF NOT EXISTS "operational_actions_deliveryReference_idx"
  ON "operational_actions"("deliveryReference");

-- Activation delivery evidence.
--
-- A provisioned buyer who never receives their activation link owns a subscription in
-- an organization they cannot sign in to. Recording whether the send succeeded turns
-- that from a silent dead end into something an operator can see and reissue.
--
-- Additive and nullable. Existing runs read as "not delivered", which is accurate:
-- before this migration nothing was delivered.

ALTER TABLE "provisioning_runs"
  ADD COLUMN IF NOT EXISTS "activationDeliveredAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "activationDeliveryFailure" TEXT;

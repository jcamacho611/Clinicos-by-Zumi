-- Separate approval from completion.
--
-- Confirming a patient message used to write `decidedAt`, which is the column both the
-- command centre and the sweep read as "finished". So a message approved while no
-- provider was configured became permanently unsendable: the owner was told it would
-- send once a channel connected, and nothing could ever send it.
--
-- Approval and completion are now different facts. `approvedAt` records that a person
-- said yes; `decidedAt` records that the action reached a terminal outcome. An
-- unsuccessful delivery keeps `decidedAt` null so it stays retryable, while `approvedAt`
-- stops the owner being asked to approve the same message again.
--
-- Additive and nullable. Existing rows are backfilled only where the two facts were
-- unambiguously the same event: an action a person decided, which was not a message
-- still waiting to go out.

ALTER TABLE "operational_actions"
  ADD COLUMN IF NOT EXISTS "approvedByUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);

UPDATE "operational_actions"
   SET "approvedByUserId" = "decidedByUserId",
       "approvedAt"       = "decidedAt"
 WHERE "decidedAt" IS NOT NULL
   AND "approvedAt" IS NULL
   AND "state" <> 'dismissed';

-- A message that was approved but never actually delivered was recorded as decided by
-- the old code. Clearing that lets the retry path pick it up, which is the whole point.
UPDATE "operational_actions"
   SET "decidedAt" = NULL,
       "decidedByUserId" = NULL
 WHERE "actionKind" = 'patient_message'
   AND "state" IN ('awaiting_connection', 'awaiting_delivery')
   AND "deliveredAt" IS NULL;

CREATE INDEX IF NOT EXISTS "operational_actions_organizationId_approvedAt_deliveredAt_idx"
  ON "operational_actions"("organizationId", "approvedAt", "deliveredAt");

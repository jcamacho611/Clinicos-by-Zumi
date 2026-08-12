-- Serialize work on a provisioning run.
--
-- Two concurrent deliveries of the same webhook both observed the run as pending and
-- both executed its steps. Each created an organization; one attached the buyer and the
-- other failed the unique email constraint, then wrote its orphaned organization id onto
-- the shared run. Every later retry then read that orphan and failed permanently on the
-- cross-organization identity check, leaving a paid buyer with no reachable tenant.
--
-- The claim makes execution single-writer. `claimedAt` is also the abandonment signal:
-- a process that dies mid-run leaves a stale claim, and a claim older than the service's
-- timeout is reclaimable, so a crash delays a purchase rather than stranding it.
--
-- Additive and nullable. Existing runs read as unclaimed, which is accurate.

ALTER TABLE "provisioning_runs"
  ADD COLUMN IF NOT EXISTS "claimedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "claimedBy" TEXT;

CREATE INDEX IF NOT EXISTS "provisioning_runs_status_claimedAt_idx"
  ON "provisioning_runs"("status", "claimedAt");

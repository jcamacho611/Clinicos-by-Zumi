-- Onboarding answers that had nowhere to go.
--
-- Guided setup collected provider count, location count, and the system the clinic is
-- leaving, summarised them back to the owner, and then wrote none of them. Completing
-- onboarding clears `demoMode`, which closes the page, so those answers were lost
-- permanently the moment they were given.
--
-- Additive and nullable: organizations created before this keep working and simply
-- have nothing recorded, which is the truth about them.

ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "providerCount" TEXT,
  ADD COLUMN IF NOT EXISTS "locationCount" TEXT,
  ADD COLUMN IF NOT EXISTS "currentSystem" TEXT;

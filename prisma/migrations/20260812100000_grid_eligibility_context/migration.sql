-- Grid eligibility context.
--
-- Eligibility is decided against an activity, a jurisdiction and a time window. The
-- schema could express none of those, so the marketplace fell back to a single boolean
-- that asked only whether a provider was verified at all.
--
-- Two nullable columns, both additive. Nothing is made NOT NULL: a listing or request
-- that cannot state its activity or jurisdiction is refused at the eligibility gate,
-- which is a refusal a person can act on, rather than a failed deploy.

-- What activity a service listing actually is. Backfilled from the free-text category
-- for the categories in use; anything unrecognised stays null and is refused rather than
-- guessed, because a marketplace that matches work it cannot describe has stopped
-- checking.
ALTER TABLE "grid_service_listings" ADD COLUMN IF NOT EXISTS "activityKey" TEXT;

UPDATE "grid_service_listings" SET "activityKey" = CASE
  WHEN lower("category") LIKE '%inject%'      THEN 'perform_aesthetic_injection'
  WHEN lower("serviceName") LIKE '%inject%'   THEN 'perform_aesthetic_injection'
  WHEN lower("category") LIKE '%botox%'       THEN 'perform_aesthetic_injection'
  WHEN lower("category") LIKE '%filler%'      THEN 'perform_aesthetic_injection'
  WHEN lower("category") LIKE '%iv therapy%'  THEN 'perform_rn_service'
  WHEN lower("category") LIKE '%infusion%'    THEN 'perform_rn_service'
  WHEN lower("category") LIKE '%nurse%'       THEN 'perform_rn_service'
  WHEN lower("category") LIKE '%supervis%'    THEN 'supervise_aesthetic_injection'
  WHEN lower("category") LIKE '%medical direction%' THEN 'provide_medical_direction'
  WHEN lower("category") LIKE '%precept%'     THEN 'precept_student'
  WHEN lower("category") LIKE '%placement%'   THEN 'precept_student'
  ELSE NULL
END
WHERE "activityKey" IS NULL;

-- Where the work happens, when it is not at a Klinikos location. Mobile, at-home and
-- virtual work has a jurisdiction the location table cannot supply, and a licence cannot
-- be matched against an unknown one.
ALTER TABLE "grid_requests" ADD COLUMN IF NOT EXISTS "serviceJurisdiction" TEXT;

CREATE INDEX IF NOT EXISTS "grid_service_listings_activityKey_idx" ON "grid_service_listings"("activityKey");

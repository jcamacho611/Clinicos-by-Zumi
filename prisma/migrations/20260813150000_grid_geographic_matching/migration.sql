-- Add an optional, permission-derived origin to saved demand. The pair remains
-- nullable so city/state-only requests continue to work without fake precision.
ALTER TABLE "GridDemandRecord"
ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "longitude" DOUBLE PRECISION;

ALTER TABLE "GridDemandRecord"
ADD CONSTRAINT "GridDemandRecord_coordinate_pair_check"
CHECK (
  ("latitude" IS NULL AND "longitude" IS NULL)
  OR
  ("latitude" BETWEEN -90 AND 90 AND "longitude" BETWEEN -180 AND 180)
);

-- Universal resources already store coordinates. Enforce the same pair and
-- range invariant at the transactional boundary for all future writes.
ALTER TABLE "GridResourceRecord"
ADD CONSTRAINT "GridResourceRecord_coordinate_pair_check"
CHECK (
  ("latitude" IS NULL AND "longitude" IS NULL)
  OR
  ("latitude" BETWEEN -90 AND 90 AND "longitude" BETWEEN -180 AND 180)
);

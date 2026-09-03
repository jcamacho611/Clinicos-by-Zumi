-- Privacy-minimized aggregate funnel evidence for public Person growth.
-- One row represents a day/event/canonical-Path bucket; no visitor identity
-- or free-form interaction content is stored here.

CREATE TABLE "public_growth_daily_counters" (
  "day" DATE NOT NULL,
  "eventType" TEXT NOT NULL,
  "pathId" TEXT NOT NULL DEFAULT '',
  "count" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "public_growth_daily_counters_pkey"
    PRIMARY KEY ("day", "eventType", "pathId"),
  CONSTRAINT "public_growth_daily_counters_count_check"
    CHECK ("count" >= 0),
  CONSTRAINT "public_growth_daily_counters_event_type_check"
    CHECK ("eventType" IN (
      'PUBLIC_FIRST_VALUE',
      'PUBLIC_NO_RESULT',
      'FREE_SIGNUP_COMPLETED',
      'PERSON_PATH_RESUMED'
    )),
  CONSTRAINT "public_growth_daily_counters_path_length_check"
    CHECK (char_length("pathId") <= 160)
);

CREATE INDEX "public_growth_daily_counters_event_day_idx"
  ON "public_growth_daily_counters"("eventType", "day");

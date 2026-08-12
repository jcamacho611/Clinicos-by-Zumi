CREATE TABLE "GridResourceRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "subtype" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "policyClass" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'matched_only',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "city" TEXT,
    "state" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "pricingModel" TEXT NOT NULL DEFAULT 'quote',
    "priceCents" INTEGER,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "requiresHumanReview" BOOLEAN NOT NULL DEFAULT true,
    "reviewStatus" TEXT NOT NULL DEFAULT 'not_submitted',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GridResourceRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GridResourceRecord_org_status_idx"
ON "GridResourceRecord"("organizationId", "status");

CREATE INDEX "GridResourceRecord_type_status_visibility_idx"
ON "GridResourceRecord"("resourceType", "status", "visibility");

CREATE INDEX "GridResourceRecord_state_city_idx"
ON "GridResourceRecord"("state", "city");

ALTER TABLE "GridResourceRecord"
ADD CONSTRAINT "GridResourceRecord_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "GridResourceAvailabilityRecord" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GridResourceAvailabilityRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GridResourceAvailabilityRecord_resource_start_idx"
ON "GridResourceAvailabilityRecord"("resourceId", "startsAt", "status");

ALTER TABLE "GridResourceAvailabilityRecord"
ADD CONSTRAINT "GridResourceAvailabilityRecord_resourceId_fkey"
FOREIGN KEY ("resourceId") REFERENCES "GridResourceRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "GridResourceReviewEventRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "note" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GridResourceReviewEventRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GridResourceReviewEventRecord_resource_created_idx"
ON "GridResourceReviewEventRecord"("resourceId", "createdAt");

ALTER TABLE "GridResourceReviewEventRecord"
ADD CONSTRAINT "GridResourceReviewEventRecord_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GridResourceReviewEventRecord"
ADD CONSTRAINT "GridResourceReviewEventRecord_resourceId_fkey"
FOREIGN KEY ("resourceId") REFERENCES "GridResourceRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

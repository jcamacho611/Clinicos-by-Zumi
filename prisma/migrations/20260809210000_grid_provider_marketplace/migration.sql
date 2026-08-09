-- Expand existing provider and location records into a governed Grid marketplace.
ALTER TABLE "providers"
  ADD COLUMN "displayName" TEXT,
  ADD COLUMN "legalName" TEXT,
  ADD COLUMN "providerType" TEXT,
  ADD COLUMN "malpracticeCarrier" TEXT,
  ADD COLUMN "malpracticePolicyNumber" TEXT,
  ADD COLUMN "malpracticeExpiration" TIMESTAMP(3),
  ADD COLUMN "certifications" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "servicesOffered" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "experienceLevel" TEXT NOT NULL DEFAULT 'Entry',
  ADD COLUMN "bio" TEXT,
  ADD COLUMN "profilePhoto" TEXT,
  ADD COLUMN "serviceLocations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "mobileServiceAllowed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "chairRentalAllowed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "atHomeAllowed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "travelRadiusMiles" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "verificationStatus" TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN "approvedBy" TEXT,
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "renewalDueAt" TIMESTAMP(3);

UPDATE "providers"
SET
  "displayName" = "name",
  "legalName" = "name",
  "providerType" = CASE
    WHEN UPPER("credential") IN ('NP', 'FNP', 'DNP') THEN 'Nurse Practitioner'
    WHEN UPPER("credential") IN ('PA', 'PA-C') THEN 'Physician Assistant'
    WHEN UPPER("credential") IN ('MD', 'DO') THEN 'Physician'
    WHEN UPPER("credential") IN ('RN', 'BSN') THEN 'Registered Nurse'
    ELSE 'Registered Nurse'
  END,
  "servicesOffered" = "services";

ALTER TABLE "providers"
  ALTER COLUMN "displayName" SET NOT NULL,
  ALTER COLUMN "legalName" SET NOT NULL,
  ALTER COLUMN "providerType" SET NOT NULL,
  ADD CONSTRAINT "providers_verification_status_check" CHECK ("verificationStatus" IN ('draft', 'submitted', 'needs_review', 'verified', 'rejected', 'expired', 'suspended')),
  ADD CONSTRAINT "providers_experience_level_check" CHECK ("experienceLevel" IN ('Entry', 'Intermediate', 'Experienced', 'OG / Master Provider')),
  ADD CONSTRAINT "providers_travel_radius_check" CHECK ("travelRadiusMiles" BETWEEN 0 AND 500);

DROP INDEX IF EXISTS "providers_organizationId_idx";
CREATE INDEX "providers_organizationId_status_verificationStatus_idx" ON "providers"("organizationId", "status", "verificationStatus");
CREATE INDEX "providers_providerType_verificationStatus_idx" ON "providers"("providerType", "verificationStatus");

ALTER TABLE "locations"
  ADD COLUMN "city" TEXT,
  ADD COLUMN "state" TEXT,
  ADD COLUMN "zip" TEXT,
  ADD COLUMN "locationType" TEXT NOT NULL DEFAULT 'clinic',
  ADD COLUMN "roomTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "chairRentalAvailable" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "hourlyRateCents" INTEGER,
  ADD COLUMN "dailyRateCents" INTEGER,
  ADD COLUMN "servicesAllowed" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "credentialRequirements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "insuranceRequirements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "marketplaceVisible" BOOLEAN NOT NULL DEFAULT false,
  ADD CONSTRAINT "locations_hourly_rate_check" CHECK ("hourlyRateCents" IS NULL OR "hourlyRateCents" >= 0),
  ADD CONSTRAINT "locations_daily_rate_check" CHECK ("dailyRateCents" IS NULL OR "dailyRateCents" >= 0);

UPDATE "locations"
SET
  "city" = "address"->>'city',
  "state" = "address"->>'state',
  "zip" = COALESCE("address"->>'postalCode', "address"->>'zip');

ALTER TABLE "provider_availability"
  ADD COLUMN "locationType" TEXT NOT NULL DEFAULT 'clinic_location',
  ADD COLUMN "mobileRadius" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "onCall" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active',
  ADD CONSTRAINT "provider_availability_weekday_check" CHECK ("weekday" BETWEEN 0 AND 6),
  ADD CONSTRAINT "provider_availability_mobile_radius_check" CHECK ("mobileRadius" BETWEEN 0 AND 500),
  ADD CONSTRAINT "provider_availability_status_check" CHECK ("status" IN ('draft', 'active', 'paused', 'archived'));

DROP INDEX IF EXISTS "provider_availability_providerId_idx";
CREATE INDEX "provider_availability_organizationId_providerId_status_idx" ON "provider_availability"("organizationId", "providerId", "status");
CREATE INDEX "provider_availability_locationId_weekday_status_idx" ON "provider_availability"("locationId", "weekday", "status");

CREATE TABLE "grid_service_listings" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "serviceName" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "priceLowCents" INTEGER NOT NULL,
  "priceHighCents" INTEGER NOT NULL,
  "requiresMedicalReview" BOOLEAN NOT NULL DEFAULT false,
  "requiresConsent" BOOLEAN NOT NULL DEFAULT true,
  "requiresDeposit" BOOLEAN NOT NULL DEFAULT false,
  "mobileAllowed" BOOLEAN NOT NULL DEFAULT false,
  "clinicLocationAllowed" BOOLEAN NOT NULL DEFAULT true,
  "chairRentalAllowed" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "createdBy" TEXT,
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "grid_service_listings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "grid_service_listings_price_check" CHECK ("priceLowCents" >= 0 AND "priceHighCents" >= "priceLowCents"),
  CONSTRAINT "grid_service_listings_status_check" CHECK ("status" IN ('draft', 'active', 'paused', 'archived'))
);

CREATE TABLE "grid_requests" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "destinationOrganizationId" TEXT NOT NULL,
  "requesterId" TEXT NOT NULL,
  "patientId" TEXT,
  "syntheticClientLabel" TEXT NOT NULL,
  "syntheticClientReference" TEXT NOT NULL,
  "serviceListingId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "locationId" TEXT,
  "requestedStartAt" TIMESTAMP(3) NOT NULL,
  "requestedEndAt" TIMESTAMP(3),
  "locationType" TEXT NOT NULL,
  "safetyFlags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "requiredDocuments" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "requiredConsent" BOOLEAN NOT NULL DEFAULT true,
  "consentStatus" TEXT NOT NULL DEFAULT 'pending',
  "depositStatus" TEXT NOT NULL DEFAULT 'not_started',
  "paymentStatus" TEXT NOT NULL DEFAULT 'not_started',
  "status" TEXT NOT NULL DEFAULT 'draft',
  "notes" TEXT,
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "confirmedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "grid_requests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "grid_requests_status_check" CHECK ("status" IN ('draft', 'requested', 'provider_review', 'location_review', 'credential_check', 'pending_deposit', 'confirmed', 'completed', 'cancelled', 'declined', 'escalated')),
  CONSTRAINT "grid_requests_consent_status_check" CHECK ("consentStatus" IN ('not_required', 'pending', 'confirmed', 'blocked')),
  CONSTRAINT "grid_requests_deposit_status_check" CHECK ("depositStatus" IN ('not_required', 'not_started', 'manual_link_required', 'pending', 'recorded', 'waived', 'refunded')),
  CONSTRAINT "grid_requests_payment_status_check" CHECK ("paymentStatus" IN ('not_started', 'manual_link_required', 'pending', 'recorded', 'waived', 'refunded')),
  CONSTRAINT "grid_requests_time_check" CHECK ("requestedEndAt" IS NULL OR "requestedEndAt" > "requestedStartAt")
);

CREATE TABLE "grid_request_events" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "gridRequestId" TEXT NOT NULL,
  "actorId" TEXT,
  "actorType" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "fromStatus" TEXT,
  "toStatus" TEXT,
  "note" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "grid_request_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "grid_request_events_actor_type_check" CHECK ("actorType" IN ('user', 'system', 'manual_partner'))
);

CREATE INDEX "grid_service_listings_organizationId_status_category_idx" ON "grid_service_listings"("organizationId", "status", "category");
CREATE INDEX "grid_service_listings_providerId_status_idx" ON "grid_service_listings"("providerId", "status");
CREATE INDEX "grid_requests_organizationId_status_createdAt_idx" ON "grid_requests"("organizationId", "status", "createdAt");
CREATE INDEX "grid_requests_destinationOrganizationId_status_createdAt_idx" ON "grid_requests"("destinationOrganizationId", "status", "createdAt");
CREATE INDEX "grid_requests_providerId_requestedStartAt_status_idx" ON "grid_requests"("providerId", "requestedStartAt", "status");
CREATE INDEX "grid_requests_patientId_createdAt_idx" ON "grid_requests"("patientId", "createdAt");
CREATE INDEX "grid_request_events_organizationId_createdAt_idx" ON "grid_request_events"("organizationId", "createdAt");
CREATE INDEX "grid_request_events_gridRequestId_createdAt_idx" ON "grid_request_events"("gridRequestId", "createdAt");

ALTER TABLE "providers" ADD CONSTRAINT "providers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provider_availability" ADD CONSTRAINT "provider_availability_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provider_availability" ADD CONSTRAINT "provider_availability_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provider_availability" ADD CONSTRAINT "provider_availability_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "grid_service_listings" ADD CONSTRAINT "grid_service_listings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "grid_service_listings" ADD CONSTRAINT "grid_service_listings_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "grid_requests" ADD CONSTRAINT "grid_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "grid_requests" ADD CONSTRAINT "grid_requests_destinationOrganizationId_fkey" FOREIGN KEY ("destinationOrganizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grid_requests" ADD CONSTRAINT "grid_requests_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "grid_requests" ADD CONSTRAINT "grid_requests_serviceListingId_fkey" FOREIGN KEY ("serviceListingId") REFERENCES "grid_service_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grid_requests" ADD CONSTRAINT "grid_requests_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grid_requests" ADD CONSTRAINT "grid_requests_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "grid_request_events" ADD CONSTRAINT "grid_request_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "grid_request_events" ADD CONSTRAINT "grid_request_events_gridRequestId_fkey" FOREIGN KEY ("gridRequestId") REFERENCES "grid_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Providers and operating staff need controlled create/update access for Grid requests.
WITH grants(role_key, action) AS (
  VALUES
    ('provider', 'update'),
    ('clinical_staff', 'create'),
    ('clinical_staff', 'update'),
    ('front_desk', 'create'),
    ('front_desk', 'update')
)
INSERT INTO "permissions" ("id", "roleId", "resource", "action", "allowed", "createdAt", "updatedAt")
SELECT
  'permission-' || md5(role.id || ':network:' || grants.action),
  role.id,
  'network',
  grants.action,
  TRUE,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "roles" role
JOIN grants ON grants.role_key = role.key
WHERE NOT EXISTS (
  SELECT 1
  FROM "permissions" permission
  WHERE permission."roleId" = role.id
    AND permission.resource = 'network'
    AND permission.action = grants.action
);

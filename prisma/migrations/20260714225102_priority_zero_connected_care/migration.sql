-- CreateTable
CREATE TABLE "facilities" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "locationId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "npi" TEXT,
    "specialty" TEXT,
    "address" JSONB,
    "verifiedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "network_connections" (
    "id" TEXT NOT NULL,
    "sourceOrganizationId" TEXT NOT NULL,
    "targetOrganizationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "trustLevel" TEXT NOT NULL DEFAULT 'standard',
    "allowedPurposes" TEXT[],
    "requestedBy" TEXT,
    "approvedBy" TEXT,
    "activatedAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "network_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_sharing_agreements" (
    "id" TEXT NOT NULL,
    "sourceOrganizationId" TEXT NOT NULL,
    "targetOrganizationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "allowedPurposes" TEXT[],
    "dataCategories" TEXT[],
    "effectiveAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_sharing_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_identifiers" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "system" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sourceOrganizationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_identifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_matches" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "candidatePatientId" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "matchedFields" JSONB,
    "status" TEXT NOT NULL DEFAULT 'possible',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_grants" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "granteeOrganizationId" TEXT,
    "granteeUserId" TEXT,
    "purposeOfUse" TEXT NOT NULL,
    "dataCategories" TEXT[],
    "accessLevel" TEXT NOT NULL DEFAULT 'read_only',
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "consentId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "record_requests" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "requestingOrganizationId" TEXT NOT NULL,
    "receivingOrganizationId" TEXT NOT NULL,
    "purposeOfUse" TEXT NOT NULL,
    "dataCategories" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'requested',
    "deliveryStatus" TEXT NOT NULL DEFAULT 'not_started',
    "requestedBy" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "record_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "locationId" TEXT,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "planKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'trialing',
    "modules" TEXT[],
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodEndsAt" TIMESTAMP(3),
    "externalCustomerId" TEXT,
    "externalSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_team_rooms" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "sharedPlan" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_team_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_team_members" (
    "id" TEXT NOT NULL,
    "careTeamRoomId" TEXT NOT NULL,
    "representedOrganizationId" TEXT NOT NULL,
    "userId" TEXT,
    "providerId" TEXT,
    "role" TEXT NOT NULL,
    "accessLevel" TEXT NOT NULL DEFAULT 'minimum_necessary',
    "status" TEXT NOT NULL DEFAULT 'invited',
    "joinedAt" TIMESTAMP(3),
    "removedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episode_rooms" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "caseId" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "readinessScore" INTEGER NOT NULL DEFAULT 0,
    "nextAction" TEXT,
    "responsibleRole" TEXT,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'NORMAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "episode_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_passports" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "summary" JSONB NOT NULL,
    "lastConfirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_passports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_wallets" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "sharingDefaults" JSONB NOT NULL,
    "emergencyPreference" TEXT,
    "recoveryStatus" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consent_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intake_passports" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "reusableFields" JSONB NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intake_passports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_handoffs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "summary" JSONB NOT NULL,
    "requestedAction" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "dueAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'sent',
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_handoffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capacity_listings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "locationId" TEXT,
    "facilityId" TEXT,
    "type" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "acceptedPayers" TEXT[],
    "urgencyLevels" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'open',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capacity_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_consultations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT,
    "requestingProviderId" TEXT NOT NULL,
    "consultantProviderId" TEXT,
    "specialty" TEXT NOT NULL,
    "clinicalQuestion" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'routine',
    "status" TEXT NOT NULL DEFAULT 'requested',
    "scheduledAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_items" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "layer" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceDate" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "effectiveAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "supersedesId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_reviews" (
    "id" TEXT NOT NULL,
    "knowledgeItemId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "notes" TEXT,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remote_observations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT,
    "source" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "qualityFlag" TEXT,
    "reviewStatus" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "remote_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "locationId" TEXT,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "lotNumber" TEXT,
    "expiresAt" TIMESTAMP(3),
    "quantityOnHand" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "quantityReserved" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "reorderPoint" DECIMAL(12,3),
    "unitCostCents" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voice_sessions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "patientId" TEXT,
    "purpose" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en-US',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "transcript" TEXT,
    "transcriptConfidence" DOUBLE PRECISION,
    "provider" TEXT NOT NULL,
    "consentConfirmedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "retentionExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voice_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_registry_sections" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "mandate" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'P0',
    "deliveryStatus" TEXT NOT NULL,
    "deliveryMode" TEXT NOT NULL,
    "interfaceRoute" TEXT NOT NULL,
    "ownerRoles" TEXT[],
    "databaseObjects" TEXT[],
    "featureCount" INTEGER NOT NULL,
    "canonVersion" TEXT NOT NULL,
    "immutable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_registry_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_registry_capabilities" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'P0',
    "deliveryStatus" TEXT NOT NULL,
    "deliveryMode" TEXT NOT NULL,
    "completionPlan" JSONB NOT NULL,
    "canonVersion" TEXT NOT NULL,
    "immutable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_registry_capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "facilities_organizationId_type_status_idx" ON "facilities"("organizationId", "type", "status");

-- CreateIndex
CREATE INDEX "network_connections_targetOrganizationId_status_idx" ON "network_connections"("targetOrganizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "network_connections_sourceOrganizationId_targetOrganization_key" ON "network_connections"("sourceOrganizationId", "targetOrganizationId");

-- CreateIndex
CREATE INDEX "data_sharing_agreements_sourceOrganizationId_targetOrganiza_idx" ON "data_sharing_agreements"("sourceOrganizationId", "targetOrganizationId", "status");

-- CreateIndex
CREATE INDEX "patient_identifiers_organizationId_patientId_idx" ON "patient_identifiers"("organizationId", "patientId");

-- CreateIndex
CREATE UNIQUE INDEX "patient_identifiers_system_value_key" ON "patient_identifiers"("system", "value");

-- CreateIndex
CREATE INDEX "patient_matches_organizationId_status_confidenceScore_idx" ON "patient_matches"("organizationId", "status", "confidenceScore");

-- CreateIndex
CREATE UNIQUE INDEX "patient_matches_patientId_candidatePatientId_key" ON "patient_matches"("patientId", "candidatePatientId");

-- CreateIndex
CREATE INDEX "access_grants_organizationId_patientId_purposeOfUse_idx" ON "access_grants"("organizationId", "patientId", "purposeOfUse");

-- CreateIndex
CREATE INDEX "access_grants_granteeOrganizationId_granteeUserId_revokedAt_idx" ON "access_grants"("granteeOrganizationId", "granteeUserId", "revokedAt");

-- CreateIndex
CREATE INDEX "record_requests_organizationId_patientId_status_idx" ON "record_requests"("organizationId", "patientId", "status");

-- CreateIndex
CREATE INDEX "record_requests_requestingOrganizationId_receivingOrganizat_idx" ON "record_requests"("requestingOrganizationId", "receivingOrganizationId");

-- CreateIndex
CREATE INDEX "resources_organizationId_locationId_type_status_idx" ON "resources"("organizationId", "locationId", "type", "status");

-- CreateIndex
CREATE INDEX "subscriptions_organizationId_status_idx" ON "subscriptions"("organizationId", "status");

-- CreateIndex
CREATE INDEX "care_team_rooms_organizationId_patientId_status_idx" ON "care_team_rooms"("organizationId", "patientId", "status");

-- CreateIndex
CREATE INDEX "care_team_members_careTeamRoomId_status_idx" ON "care_team_members"("careTeamRoomId", "status");

-- CreateIndex
CREATE INDEX "episode_rooms_organizationId_patientId_status_idx" ON "episode_rooms"("organizationId", "patientId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "health_passports_patientId_key" ON "health_passports"("patientId");

-- CreateIndex
CREATE INDEX "health_passports_organizationId_status_idx" ON "health_passports"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "consent_wallets_patientId_key" ON "consent_wallets"("patientId");

-- CreateIndex
CREATE INDEX "consent_wallets_organizationId_idx" ON "consent_wallets"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "intake_passports_patientId_key" ON "intake_passports"("patientId");

-- CreateIndex
CREATE INDEX "intake_passports_organizationId_status_idx" ON "intake_passports"("organizationId", "status");

-- CreateIndex
CREATE INDEX "care_handoffs_organizationId_patientId_status_dueAt_idx" ON "care_handoffs"("organizationId", "patientId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "capacity_listings_organizationId_type_service_startsAt_stat_idx" ON "capacity_listings"("organizationId", "type", "service", "startsAt", "status");

-- CreateIndex
CREATE INDEX "provider_consultations_organizationId_status_specialty_idx" ON "provider_consultations"("organizationId", "status", "specialty");

-- CreateIndex
CREATE INDEX "knowledge_items_organizationId_layer_status_idx" ON "knowledge_items"("organizationId", "layer", "status");

-- CreateIndex
CREATE INDEX "knowledge_reviews_knowledgeItemId_reviewedAt_idx" ON "knowledge_reviews"("knowledgeItemId", "reviewedAt");

-- CreateIndex
CREATE INDEX "remote_observations_organizationId_patientId_type_observedA_idx" ON "remote_observations"("organizationId", "patientId", "type", "observedAt");

-- CreateIndex
CREATE INDEX "inventory_items_organizationId_locationId_status_expiresAt_idx" ON "inventory_items"("organizationId", "locationId", "status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_organizationId_sku_lotNumber_key" ON "inventory_items"("organizationId", "sku", "lotNumber");

-- CreateIndex
CREATE INDEX "voice_sessions_organizationId_userId_status_createdAt_idx" ON "voice_sessions"("organizationId", "userId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "feature_registry_sections_number_key" ON "feature_registry_sections"("number");

-- CreateIndex
CREATE UNIQUE INDEX "feature_registry_sections_slug_key" ON "feature_registry_sections"("slug");

-- CreateIndex
CREATE INDEX "feature_registry_capabilities_deliveryStatus_priority_idx" ON "feature_registry_capabilities"("deliveryStatus", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "feature_registry_capabilities_sectionId_slug_key" ON "feature_registry_capabilities"("sectionId", "slug");

-- AddForeignKey
ALTER TABLE "facilities" ADD CONSTRAINT "facilities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facilities" ADD CONSTRAINT "facilities_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_connections" ADD CONSTRAINT "network_connections_sourceOrganizationId_fkey" FOREIGN KEY ("sourceOrganizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_connections" ADD CONSTRAINT "network_connections_targetOrganizationId_fkey" FOREIGN KEY ("targetOrganizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_sharing_agreements" ADD CONSTRAINT "data_sharing_agreements_sourceOrganizationId_fkey" FOREIGN KEY ("sourceOrganizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_sharing_agreements" ADD CONSTRAINT "data_sharing_agreements_targetOrganizationId_fkey" FOREIGN KEY ("targetOrganizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_identifiers" ADD CONSTRAINT "patient_identifiers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_identifiers" ADD CONSTRAINT "patient_identifiers_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_matches" ADD CONSTRAINT "patient_matches_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_matches" ADD CONSTRAINT "patient_matches_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_matches" ADD CONSTRAINT "patient_matches_candidatePatientId_fkey" FOREIGN KEY ("candidatePatientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_grants" ADD CONSTRAINT "access_grants_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_grants" ADD CONSTRAINT "access_grants_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record_requests" ADD CONSTRAINT "record_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record_requests" ADD CONSTRAINT "record_requests_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_team_rooms" ADD CONSTRAINT "care_team_rooms_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_team_rooms" ADD CONSTRAINT "care_team_rooms_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_team_members" ADD CONSTRAINT "care_team_members_careTeamRoomId_fkey" FOREIGN KEY ("careTeamRoomId") REFERENCES "care_team_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episode_rooms" ADD CONSTRAINT "episode_rooms_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episode_rooms" ADD CONSTRAINT "episode_rooms_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_passports" ADD CONSTRAINT "health_passports_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_passports" ADD CONSTRAINT "health_passports_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_wallets" ADD CONSTRAINT "consent_wallets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_wallets" ADD CONSTRAINT "consent_wallets_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_passports" ADD CONSTRAINT "intake_passports_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_passports" ADD CONSTRAINT "intake_passports_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_handoffs" ADD CONSTRAINT "care_handoffs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_handoffs" ADD CONSTRAINT "care_handoffs_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capacity_listings" ADD CONSTRAINT "capacity_listings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capacity_listings" ADD CONSTRAINT "capacity_listings_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capacity_listings" ADD CONSTRAINT "capacity_listings_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "facilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_consultations" ADD CONSTRAINT "provider_consultations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_reviews" ADD CONSTRAINT "knowledge_reviews_knowledgeItemId_fkey" FOREIGN KEY ("knowledgeItemId") REFERENCES "knowledge_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_observations" ADD CONSTRAINT "remote_observations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_observations" ADD CONSTRAINT "remote_observations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_sessions" ADD CONSTRAINT "voice_sessions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_sessions" ADD CONSTRAINT "voice_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_sessions" ADD CONSTRAINT "voice_sessions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_registry_capabilities" ADD CONSTRAINT "feature_registry_capabilities_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "feature_registry_sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Priority Zero is a product-law invariant. Canon records may be advanced or corrected,
-- but they cannot be deleted, downgraded, or marked mutable through ordinary writes.
ALTER TABLE "feature_registry_sections"
  ADD CONSTRAINT "feature_registry_sections_priority_zero_check"
  CHECK ("priority" = 'P0' AND "immutable" = true);

ALTER TABLE "feature_registry_capabilities"
  ADD CONSTRAINT "feature_registry_capabilities_priority_zero_check"
  CHECK ("priority" = 'P0' AND "immutable" = true);

CREATE OR REPLACE FUNCTION protect_priority_zero_registry()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Priority Zero registry records cannot be deleted';
  END IF;

  IF NEW."priority" <> 'P0' OR NEW."immutable" IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Priority Zero registry records cannot be downgraded or made mutable';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "protect_priority_zero_sections"
BEFORE UPDATE OR DELETE ON "feature_registry_sections"
FOR EACH ROW EXECUTE FUNCTION protect_priority_zero_registry();

CREATE TRIGGER "protect_priority_zero_capabilities"
BEFORE UPDATE OR DELETE ON "feature_registry_capabilities"
FOR EACH ROW EXECUTE FUNCTION protect_priority_zero_registry();

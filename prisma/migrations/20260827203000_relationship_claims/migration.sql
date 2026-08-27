CREATE TABLE "relationship_claims" (
  "id" TEXT NOT NULL,
  "personId" TEXT NOT NULL,
  "legacyUserId" TEXT,
  "claimType" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetOrganizationId" TEXT,
  "targetProviderId" TEXT,
  "claimedOrganizationName" TEXT,
  "claimedRoleKey" TEXT,
  "lifecycleStatus" TEXT NOT NULL DEFAULT 'active',
  "verificationStatus" TEXT NOT NULL DEFAULT 'submitted',
  "sourceType" TEXT NOT NULL DEFAULT 'user_assertion',
  "sourceReference" TEXT,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "reviewedBy" TEXT,
  "reviewNote" TEXT,
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "relationship_claims_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "relationship_claims_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "relationship_claims_personId_lifecycleStatus_verificationStatus_idx" ON "relationship_claims"("personId", "lifecycleStatus", "verificationStatus");
CREATE INDEX "relationship_claims_targetOrganizationId_lifecycleStatus_verificationStatus_idx" ON "relationship_claims"("targetOrganizationId", "lifecycleStatus", "verificationStatus");
CREATE INDEX "relationship_claims_targetProviderId_lifecycleStatus_verificationStatus_idx" ON "relationship_claims"("targetProviderId", "lifecycleStatus", "verificationStatus");
CREATE INDEX "relationship_claims_legacyUserId_idx" ON "relationship_claims"("legacyUserId");
CREATE INDEX "relationship_claims_claimType_targetType_idx" ON "relationship_claims"("claimType", "targetType");

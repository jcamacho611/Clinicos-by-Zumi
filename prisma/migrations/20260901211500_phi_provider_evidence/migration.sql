CREATE TABLE "phi_provider_evidence" (
    "id" TEXT NOT NULL,
    "providerKey" TEXT NOT NULL,
    "deploymentKey" TEXT NOT NULL,
    "endpointOrigin" TEXT NOT NULL,
    "accountReference" TEXT NOT NULL,
    "projectReference" TEXT NOT NULL,
    "capabilityKey" TEXT NOT NULL DEFAULT 'phi_inference',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "baaStatus" TEXT NOT NULL DEFAULT 'unverified',
    "retentionPolicyStatus" TEXT NOT NULL DEFAULT 'unverified',
    "trainingUseStatus" TEXT NOT NULL DEFAULT 'unverified',
    "approvedModelIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "verifiedAt" TIMESTAMP(3),
    "effectiveAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "evidenceReference" TEXT NOT NULL,
    "authorityVersion" INTEGER NOT NULL,
    "recordedBy" TEXT NOT NULL,
    "revokedBy" TEXT,
    "revocationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "phi_provider_evidence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "phi_provider_evidence_providerKey_deploymentKey_accountReference_projectReference_capabilityKey_authorityVersion_key"
ON "phi_provider_evidence"("providerKey", "deploymentKey", "accountReference", "projectReference", "capabilityKey", "authorityVersion");

CREATE INDEX "phi_provider_evidence_providerKey_deploymentKey_accountReference_projectReference_capabilityKey_status_idx"
ON "phi_provider_evidence"("providerKey", "deploymentKey", "accountReference", "projectReference", "capabilityKey", "status");

CREATE INDEX "phi_provider_evidence_effectiveAt_expiresAt_revokedAt_idx"
ON "phi_provider_evidence"("effectiveAt", "expiresAt", "revokedAt");

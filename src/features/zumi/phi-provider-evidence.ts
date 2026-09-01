export type PhiProviderRuntimeIdentity = {
  providerKey: string;
  deploymentKey: string;
  endpointOrigin: string;
  accountReference: string;
  projectReference: string;
  modelId: string;
};

export type PhiProviderEvidence = {
  providerKey: string;
  deploymentKey: string;
  endpointOrigin: string;
  accountReference: string;
  projectReference: string;
  capabilityKey: "phi_inference";
  status: "pending" | "verified" | "rejected" | "expired" | "revoked";
  baaStatus: "unverified" | "verified";
  retentionPolicyStatus: "unverified" | "verified";
  trainingUseStatus: "unverified" | "verified_disabled";
  approvedModelIds: readonly string[];
  verifiedAt: Date | null;
  effectiveAt: Date | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
  evidenceReference: string;
  authorityVersion: number;
};

export type PhiProviderEligibilityReason =
  | "verified"
  | "evidence_missing"
  | "runtime_identity_mismatch"
  | "evidence_not_verified"
  | "baa_not_verified"
  | "retention_not_verified"
  | "training_use_not_verified"
  | "model_not_approved"
  | "evidence_not_effective"
  | "evidence_expired"
  | "evidence_revoked"
  | "runtime_baa_not_confirmed"
  | "deployment_not_approved"
  | "evidence_invalid";

export type PhiProviderEligibility =
  | { permitted: false; reason: Exclude<PhiProviderEligibilityReason, "verified"> }
  | {
      permitted: true;
      reason: "verified";
      evidenceReference: string;
      authorityVersion: number;
    };

function sameRuntimeIdentity(runtime: PhiProviderRuntimeIdentity, evidence: PhiProviderEvidence) {
  return (
    evidence.providerKey === runtime.providerKey &&
    evidence.deploymentKey === runtime.deploymentKey &&
    evidence.endpointOrigin === runtime.endpointOrigin &&
    evidence.accountReference === runtime.accountReference &&
    evidence.projectReference === runtime.projectReference
  );
}

/**
 * Evaluate corroborating evidence for one exact provider deployment.
 *
 * This is deliberately narrower than PHI authorization. It does not inspect patient
 * data, purpose of use, consent, tenant entitlement, clinical authority, or minimum-
 * necessary disclosure. It only answers whether the exact runtime provider identity
 * has current provider-level evidence and the independent runtime gates still agree.
 */
export function evaluatePhiProviderEligibility(input: {
  runtime: PhiProviderRuntimeIdentity;
  evidence: PhiProviderEvidence | null;
  adapterBaaOnFile: boolean;
  deploymentPhiApprovalFlag: boolean;
  now?: Date;
}): PhiProviderEligibility {
  const { runtime, evidence, adapterBaaOnFile, deploymentPhiApprovalFlag } = input;
  const now = input.now ?? new Date();

  if (!evidence) return { permitted: false, reason: "evidence_missing" };
  if (!sameRuntimeIdentity(runtime, evidence)) {
    return { permitted: false, reason: "runtime_identity_mismatch" };
  }
  if (evidence.capabilityKey !== "phi_inference") {
    return { permitted: false, reason: "evidence_not_verified" };
  }
  if (evidence.status !== "verified" || !evidence.verifiedAt) {
    return { permitted: false, reason: "evidence_not_verified" };
  }
  if (evidence.baaStatus !== "verified") {
    return { permitted: false, reason: "baa_not_verified" };
  }
  if (evidence.retentionPolicyStatus !== "verified") {
    return { permitted: false, reason: "retention_not_verified" };
  }
  if (evidence.trainingUseStatus !== "verified_disabled") {
    return { permitted: false, reason: "training_use_not_verified" };
  }
  if (!evidence.approvedModelIds.includes(runtime.modelId)) {
    return { permitted: false, reason: "model_not_approved" };
  }
  if (!evidence.effectiveAt || evidence.effectiveAt.getTime() > now.getTime()) {
    return { permitted: false, reason: "evidence_not_effective" };
  }
  if (evidence.expiresAt && evidence.expiresAt.getTime() <= now.getTime()) {
    return { permitted: false, reason: "evidence_expired" };
  }
  if (evidence.revokedAt && evidence.revokedAt.getTime() <= now.getTime()) {
    return { permitted: false, reason: "evidence_revoked" };
  }
  if (!adapterBaaOnFile) {
    return { permitted: false, reason: "runtime_baa_not_confirmed" };
  }
  if (!deploymentPhiApprovalFlag) {
    return { permitted: false, reason: "deployment_not_approved" };
  }
  if (
    !evidence.evidenceReference.trim() ||
    !Number.isInteger(evidence.authorityVersion) ||
    evidence.authorityVersion < 1
  ) {
    return { permitted: false, reason: "evidence_invalid" };
  }

  return {
    permitted: true,
    reason: "verified",
    evidenceReference: evidence.evidenceReference,
    authorityVersion: evidence.authorityVersion,
  };
}

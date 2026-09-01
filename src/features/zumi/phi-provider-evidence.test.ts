import { describe, expect, it } from "vitest";
import {
  evaluatePhiProviderEligibility,
  type PhiProviderEvidence,
  type PhiProviderRuntimeIdentity,
} from "@/features/zumi/phi-provider-evidence";

const runtime: PhiProviderRuntimeIdentity = {
  providerKey: "openai",
  deploymentKey: "production-primary",
  endpointOrigin: "https://api.openai.com",
  accountReference: "acct_klinikos_prod",
  projectReference: "proj_klinikos_phi",
  modelId: "gpt-5.6",
};

function evidence(overrides: Partial<PhiProviderEvidence> = {}): PhiProviderEvidence {
  return {
    providerKey: "openai",
    deploymentKey: "production-primary",
    endpointOrigin: "https://api.openai.com",
    accountReference: "acct_klinikos_prod",
    projectReference: "proj_klinikos_phi",
    capabilityKey: "phi_inference",
    status: "verified",
    baaStatus: "verified",
    retentionPolicyStatus: "verified",
    trainingUseStatus: "verified_disabled",
    approvedModelIds: ["gpt-5.6"],
    verifiedAt: new Date("2026-08-30T12:00:00.000Z"),
    effectiveAt: new Date("2026-08-30T12:00:00.000Z"),
    expiresAt: new Date("2027-08-30T12:00:00.000Z"),
    revokedAt: null,
    evidenceReference: "security/openai/phi-production-approval/v1",
    authorityVersion: 1,
    ...overrides,
  };
}

const now = new Date("2026-09-01T12:00:00.000Z");

describe("PHI provider evidence gate", () => {
  it("fails closed when durable evidence is absent even if runtime flags claim approval", () => {
    expect(evaluatePhiProviderEligibility({
      runtime,
      evidence: null,
      adapterBaaOnFile: true,
      deploymentPhiApprovalFlag: true,
      now,
    })).toEqual({
      permitted: false,
      reason: "evidence_missing",
    });
  });

  it("requires proof to match the exact provider deployment identity", () => {
    for (const mismatched of [
      evidence({ providerKey: "other" }),
      evidence({ deploymentKey: "sandbox" }),
      evidence({ endpointOrigin: "https://example.invalid" }),
      evidence({ accountReference: "acct_other" }),
      evidence({ projectReference: "proj_other" }),
    ]) {
      expect(evaluatePhiProviderEligibility({
        runtime,
        evidence: mismatched,
        adapterBaaOnFile: true,
        deploymentPhiApprovalFlag: true,
        now,
      })).toMatchObject({ permitted: false, reason: "runtime_identity_mismatch" });
    }
  });

  it("requires verified BAA, retention, training-use and model evidence", () => {
    const cases: Array<[PhiProviderEvidence, string]> = [
      [evidence({ status: "pending" }), "evidence_not_verified"],
      [evidence({ baaStatus: "unverified" }), "baa_not_verified"],
      [evidence({ retentionPolicyStatus: "unverified" }), "retention_not_verified"],
      [evidence({ trainingUseStatus: "unverified" }), "training_use_not_verified"],
      [evidence({ approvedModelIds: ["gpt-other"] }), "model_not_approved"],
    ];

    for (const [record, reason] of cases) {
      expect(evaluatePhiProviderEligibility({
        runtime,
        evidence: record,
        adapterBaaOnFile: true,
        deploymentPhiApprovalFlag: true,
        now,
      })).toEqual({ permitted: false, reason });
    }
  });

  it("rejects evidence that is not yet effective, expired, or revoked", () => {
    expect(evaluatePhiProviderEligibility({
      runtime,
      evidence: evidence({ effectiveAt: new Date("2026-09-02T00:00:00.000Z") }),
      adapterBaaOnFile: true,
      deploymentPhiApprovalFlag: true,
      now,
    })).toEqual({ permitted: false, reason: "evidence_not_effective" });

    expect(evaluatePhiProviderEligibility({
      runtime,
      evidence: evidence({ expiresAt: new Date("2026-08-31T23:59:59.000Z") }),
      adapterBaaOnFile: true,
      deploymentPhiApprovalFlag: true,
      now,
    })).toEqual({ permitted: false, reason: "evidence_expired" });

    expect(evaluatePhiProviderEligibility({
      runtime,
      evidence: evidence({ revokedAt: new Date("2026-08-31T12:00:00.000Z") }),
      adapterBaaOnFile: true,
      deploymentPhiApprovalFlag: true,
      now,
    })).toEqual({ permitted: false, reason: "evidence_revoked" });
  });

  it("keeps runtime BAA/config flags as independent gates instead of allowing durable evidence to override them", () => {
    expect(evaluatePhiProviderEligibility({
      runtime,
      evidence: evidence(),
      adapterBaaOnFile: false,
      deploymentPhiApprovalFlag: true,
      now,
    })).toEqual({ permitted: false, reason: "runtime_baa_not_confirmed" });

    expect(evaluatePhiProviderEligibility({
      runtime,
      evidence: evidence(),
      adapterBaaOnFile: true,
      deploymentPhiApprovalFlag: false,
      now,
    })).toEqual({ permitted: false, reason: "deployment_not_approved" });
  });

  it("permits only when runtime configuration and current durable evidence all agree", () => {
    expect(evaluatePhiProviderEligibility({
      runtime,
      evidence: evidence(),
      adapterBaaOnFile: true,
      deploymentPhiApprovalFlag: true,
      now,
    })).toEqual({
      permitted: true,
      reason: "verified",
      evidenceReference: "security/openai/phi-production-approval/v1",
      authorityVersion: 1,
    });
  });
});

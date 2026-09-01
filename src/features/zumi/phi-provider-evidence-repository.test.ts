import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  getCurrentPhiProviderEvidence,
  listPhiProviderEvidenceHistory,
  recordPhiProviderEvidence,
  revokePhiProviderEvidence,
} from "@/features/zumi/phi-provider-evidence-repository";

const providerKey = "synthetic-phi-provider";
const deploymentKey = "production-test";
const endpointOrigin = "https://provider.example.test";
const accountReference = "acct_synthetic_test";
const projectReference = "proj_synthetic_test";

const identity = {
  providerKey,
  deploymentKey,
  endpointOrigin,
  accountReference,
  projectReference,
  capabilityKey: "phi_inference" as const,
};

afterAll(async () => {
  await db.$executeRawUnsafe(
    `DELETE FROM "phi_provider_evidence" WHERE "providerKey" = $1 AND "deploymentKey" = $2`,
    providerKey,
    deploymentKey,
  );
});

describe("durable PHI provider evidence", () => {
  it("records exact platform evidence without secret material and returns the current verified version", async () => {
    const first = await recordPhiProviderEvidence({
      ...identity,
      status: "verified",
      baaStatus: "verified",
      retentionPolicyStatus: "verified",
      trainingUseStatus: "verified_disabled",
      approvedModelIds: ["model-a"],
      verifiedAt: new Date("2026-09-01T12:00:00.000Z"),
      effectiveAt: new Date("2026-09-01T12:00:00.000Z"),
      expiresAt: new Date("2027-09-01T12:00:00.000Z"),
      evidenceReference: "security/synthetic/provider-evidence/v1",
      recordedBy: "security-review",
    });

    expect(first).toMatchObject({
      ...identity,
      authorityVersion: 1,
      status: "verified",
      evidenceReference: "security/synthetic/provider-evidence/v1",
    });
    expect(JSON.stringify(first)).not.toMatch(/apiKey|secret|token|credential/i);

    const current = await getCurrentPhiProviderEvidence({
      ...identity,
      modelId: "model-a",
      now: new Date("2026-09-02T00:00:00.000Z"),
    });

    expect(current).toMatchObject({ authorityVersion: 1, status: "verified" });
  });

  it("creates a new authority version without overwriting prior evidence", async () => {
    const second = await recordPhiProviderEvidence({
      ...identity,
      status: "verified",
      baaStatus: "verified",
      retentionPolicyStatus: "verified",
      trainingUseStatus: "verified_disabled",
      approvedModelIds: ["model-a", "model-b"],
      verifiedAt: new Date("2026-09-03T12:00:00.000Z"),
      effectiveAt: new Date("2026-09-03T12:00:00.000Z"),
      expiresAt: new Date("2027-09-03T12:00:00.000Z"),
      evidenceReference: "security/synthetic/provider-evidence/v2",
      recordedBy: "security-review",
    });

    expect(second.authorityVersion).toBe(2);

    const history = await listPhiProviderEvidenceHistory(identity);
    expect(history.map((entry) => entry.authorityVersion)).toEqual([2, 1]);
    expect(history.map((entry) => entry.evidenceReference)).toEqual([
      "security/synthetic/provider-evidence/v2",
      "security/synthetic/provider-evidence/v1",
    ]);
  });

  it("fails closed for an unapproved model and after current evidence is revoked", async () => {
    await expect(
      getCurrentPhiProviderEvidence({
        ...identity,
        modelId: "model-not-approved",
        now: new Date("2026-09-04T00:00:00.000Z"),
      }),
    ).resolves.toBeNull();

    const current = await getCurrentPhiProviderEvidence({
      ...identity,
      modelId: "model-b",
      now: new Date("2026-09-04T00:00:00.000Z"),
    });
    expect(current).not.toBeNull();

    await revokePhiProviderEvidence({
      evidenceId: current!.id,
      revokedAt: new Date("2026-09-04T12:00:00.000Z"),
      revokedBy: "security-review",
      revocationReason: "Synthetic policy change",
    });

    await expect(
      getCurrentPhiProviderEvidence({
        ...identity,
        modelId: "model-b",
        now: new Date("2026-09-05T00:00:00.000Z"),
      }),
    ).resolves.toBeNull();

    const history = await listPhiProviderEvidenceHistory(identity);
    expect(history[0]).toMatchObject({
      authorityVersion: 2,
      status: "revoked",
      revokedBy: "security-review",
      revocationReason: "Synthetic policy change",
    });
    expect(history[1]).toMatchObject({ authorityVersion: 1, status: "verified" });
  });
});

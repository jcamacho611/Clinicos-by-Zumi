import { describe, expect, it } from "vitest";
import { buildNdaPackage, type NdaGeneratorInput } from "@/lib/legal/nda-generator";
import {
  buildLegalDocumentRecord,
  canTransitionLegalDocument,
  executionGuard,
  signatureReadiness,
  transitionLegalDocument,
  type LegalDocumentRecord,
} from "@/lib/legal/legal-document-lifecycle";

const floridaPartner: NdaGeneratorInput = {
  recipientName: "Melissa Example",
  recipientState: "FL",
  relationshipType: "strategic_partner",
  permittedPurpose: "Evaluate a strategic clinic-network and business-development relationship involving Klinikos.",
  disclosureLevel: 2,
};

describe("jurisdiction-aware NDA generator", () => {
  it("adds the Florida module and preserves the limited non-circumvention posture", () => {
    const result = buildNdaPackage(floridaPartner);

    expect(result.governingLawRecommendation).toContain("Florida");
    expect(result.modules).toContain("Florida legitimate-business-interest / restrictive-covenant module");
    expect(result.modules).toContain("Limited non-circumvention for specifically introduced opportunities");
    expect(result.nonCircumventionMonths).toBe(18);
    expect(result.confidentialityYears).toBe(5);
    expect(result.companionAgreements).toContain(
      "Strategic Partner / Referral Agreement before compensation, exclusivity, or authority is granted",
    );
  });

  it("does not treat an NDA as authorization for crown-jewel or PHI access", () => {
    const result = buildNdaPackage(floridaPartner);

    expect(result.disclosurePlan.level).toBe("Level 2");
    expect(result.disclosurePlan.prohibited).toContain("Unrestricted source code");
    expect(result.disclosurePlan.prohibited).toContain("Production credentials or API secrets");
    expect(result.disclosurePlan.prohibited).toContain("PHI or patient databases");
    expect(result.warnings.some((warning) => warning.includes("Do not treat the NDA as authorization"))).toBe(true);
  });

  it("flags California restrictive-covenant risk rather than pretending the same module works everywhere", () => {
    const result = buildNdaPackage({ ...floridaPartner, recipientState: "CA" });

    expect(result.governingLawRecommendation).toContain("California");
    expect(result.warnings.some((warning) => warning.includes("California can materially limit restrictive covenants"))).toBe(true);
    expect(result.modules).not.toContain("Florida legitimate-business-interest / restrictive-covenant module");
  });

  it("keeps damages as review-dependent drafting targets", () => {
    const result = buildNdaPackage(floridaPartner);

    expect(result.damages.categoryI).toBe(25_000);
    expect(result.damages.categoryII).toBe(50_000);
    expect(result.damages.categoryIII).toBe(75_000);
    expect(result.warnings.some((warning) => warning.includes("drafting targets, not guaranteed recoveries"))).toBe(true);
  });
});

describe("legal document lifecycle", () => {
  it("starts generated documents in review and blocks premature signature/execution", () => {
    const ndaPackage = buildNdaPackage(floridaPartner);
    const record = buildLegalDocumentRecord("legal_nda_001", floridaPartner, ndaPackage, [
      { role: "KLINIKOS", name: "Justin Camacho", authorityConfirmed: true },
      { role: "RECIPIENT", name: "Melissa Example", authorityConfirmed: true },
    ]);

    expect(record.status).toBe("NEEDS_REVIEW");
    expect(signatureReadiness(record).ready).toBe(false);
    expect(executionGuard(record).canRenderFinalPdf).toBe(false);
    expect(executionGuard(record).canSendForSignature).toBe(false);
    expect(executionGuard(record).canMarkExecuted).toBe(false);
    expect(canTransitionLegalDocument(record, "EXECUTED")).toBe(false);
  });

  it("requires signer authority and a frozen artifact hash before sending", () => {
    const ndaPackage = buildNdaPackage(floridaPartner);
    const base = buildLegalDocumentRecord("legal_nda_002", floridaPartner, ndaPackage, [
      { role: "KLINIKOS", name: "Justin Camacho", authorityConfirmed: true },
      { role: "RECIPIENT", name: "Melissa Example", authorityConfirmed: true },
    ]);

    const approved: LegalDocumentRecord = {
      ...base,
      status: "APPROVED_FOR_SIGNATURE",
      package: {
        ...base.package,
        venueInstruction: "Venue confirmed in the signed jurisdiction schedule.",
        warnings: base.package.warnings.filter((warning) => !warning.includes("state-specific review")),
      },
    };

    expect(signatureReadiness(approved).ready).toBe(true);
    expect(executionGuard(approved).canRenderFinalPdf).toBe(true);
    expect(executionGuard(approved).canSendForSignature).toBe(false);

    const frozen: LegalDocumentRecord = {
      ...approved,
      artifact: {
        fileName: "klinicos-nda-melissa-example-v1.pdf",
        mimeType: "application/pdf",
        sha256: "a".repeat(64),
        storageKey: "legal/nda/legal_nda_002/v1.pdf",
        renderedAt: new Date().toISOString(),
      },
    };

    expect(executionGuard(frozen).canSendForSignature).toBe(true);
    expect(canTransitionLegalDocument(frozen, "SENT_FOR_SIGNATURE")).toBe(true);
  });

  it("requires verified signed-artifact evidence before execution", () => {
    const ndaPackage = buildNdaPackage(floridaPartner);
    const base = buildLegalDocumentRecord("legal_nda_003", floridaPartner, ndaPackage, [
      { role: "KLINIKOS", name: "Justin Camacho", authorityConfirmed: true },
      { role: "RECIPIENT", name: "Melissa Example", authorityConfirmed: true },
    ]);

    const sent: LegalDocumentRecord = {
      ...base,
      status: "SENT_FOR_SIGNATURE",
      package: {
        ...base.package,
        venueInstruction: "Venue confirmed in the signed jurisdiction schedule.",
        warnings: base.package.warnings.filter((warning) => !warning.includes("state-specific review")),
      },
      artifact: {
        fileName: "klinicos-nda-melissa-example-v1.pdf",
        mimeType: "application/pdf",
        sha256: "a".repeat(64),
      },
    };

    expect(executionGuard(sent).canMarkExecuted).toBe(false);
    expect(canTransitionLegalDocument(sent, "EXECUTED")).toBe(false);

    const evidenced: LegalDocumentRecord = {
      ...sent,
      executionEvidence: {
        source: "ESIGN_PROVIDER",
        verified: true,
        evidenceId: "envelope-proof-123",
        providerEnvelopeId: "envelope-123",
        signedArtifactSha256: "b".repeat(64),
        verifiedAt: new Date().toISOString(),
      },
    };

    expect(executionGuard(evidenced).canMarkExecuted).toBe(true);
    expect(canTransitionLegalDocument(evidenced, "EXECUTED")).toBe(true);

    const executed = transitionLegalDocument(evidenced, "EXECUTED", {
      type: "EXECUTED",
      occurredAt: new Date().toISOString(),
      actor: "verified-esign-webhook",
      evidenceId: "envelope-proof-123",
    });

    expect(executed.status).toBe("EXECUTED");
    expect(executed.events.at(-1)?.evidenceId).toBe("envelope-proof-123");
  });

  it("throws on illegal state jumps", () => {
    const ndaPackage = buildNdaPackage(floridaPartner);
    const record = buildLegalDocumentRecord("legal_nda_004", floridaPartner, ndaPackage);

    expect(() => transitionLegalDocument(record, "EXECUTED", {
      type: "EXECUTED",
      occurredAt: new Date().toISOString(),
    })).toThrow("Illegal legal-document transition");
  });
});

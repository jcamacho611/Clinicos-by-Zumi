import { describe, expect, it } from "vitest";
import { buildNdaDraftPackage } from "@/lib/legal/generated/nda-drafting";
import {
  addVerifiedExecutionEvidence,
  buildGeneratedLegalDocument,
  resolveLegalReviewItem,
  signatureReadiness,
  transitionGeneratedLegalDocument,
  type GeneratedLegalSigner,
} from "@/lib/legal/generated/legal-document-lifecycle";

const input = {
  recipientName: "Melissa Example",
  recipientEntity: "Example Health Group",
  recipientState: "FL",
  relationshipType: "strategic_partner" as const,
  permittedPurpose: "Evaluate a potential clinic-network relationship",
  disclosureLevel: 2 as const,
};

const signers: GeneratedLegalSigner[] = [
  { role: "KLINIKOS", name: "Klinikos Authorized Signer", authorityConfirmed: true },
  { role: "RECIPIENT", name: "Melissa Example", entity: "Example Health Group", authorityConfirmed: true },
];

function resolveAllBlocking(record: ReturnType<typeof buildGeneratedLegalDocument>) {
  return record.reviewItems
    .filter((item) => item.required && item.severity === "blocking")
    .reduce((current, item) => resolveLegalReviewItem(current, {
      key: item.key,
      resolution: {
        outcome: "approved",
        resolvedAt: "2026-08-23T05:00:00.000Z",
        resolvedBy: "authorized-reviewer",
        note: `Reviewed ${item.key}`,
      },
    }), record);
}

describe("generated legal document lifecycle", () => {
  it("requires organization scope and starts in review without production approval", () => {
    const record = buildGeneratedLegalDocument({
      id: "legal_nda_1",
      organizationId: "org-bfm",
      input,
      packageResult: buildNdaDraftPackage(input),
      signers,
      now: "2026-08-23T04:55:00.000Z",
    });
    expect(record.organizationId).toBe("org-bfm");
    expect(record.status).toBe("NEEDS_REVIEW");
    expect(record.counselReviewRequired).toBe(true);
    expect(record.productionApproved).toBe(false);
  });

  it("does not allow approval while any blocking review item is unresolved", () => {
    const record = buildGeneratedLegalDocument({ id: "legal_nda_2", organizationId: "org-bfm", input, packageResult: buildNdaDraftPackage(input), signers });
    expect(signatureReadiness(record).ready).toBe(false);
    expect(() => transitionGeneratedLegalDocument(record, "APPROVED_FOR_SIGNATURE", { type: "APPROVED", actor: "reviewer" }))
      .toThrow(/review|ready/i);
  });

  it("requires both Klinikos and recipient signers with confirmed authority", () => {
    const noRecipient = resolveAllBlocking(buildGeneratedLegalDocument({
      id: "legal_nda_3",
      organizationId: "org-bfm",
      input,
      packageResult: buildNdaDraftPackage(input),
      signers: [{ role: "KLINIKOS", name: "Signer", authorityConfirmed: true }],
    }));
    expect(signatureReadiness(noRecipient).blockers.join(" ")).toMatch(/recipient signer/i);

    const unconfirmed = resolveAllBlocking(buildGeneratedLegalDocument({
      id: "legal_nda_4",
      organizationId: "org-bfm",
      input,
      packageResult: buildNdaDraftPackage(input),
      signers: [signers[0], { ...signers[1], authorityConfirmed: false }],
    }));
    expect(signatureReadiness(unconfirmed).blockers.join(" ")).toMatch(/authority/i);
  });

  it("allows approval only after explicit blocking resolutions and signer authority", () => {
    const record = resolveAllBlocking(buildGeneratedLegalDocument({
      id: "legal_nda_5",
      organizationId: "org-bfm",
      input,
      packageResult: buildNdaDraftPackage(input),
      signers,
    }));
    expect(signatureReadiness(record)).toEqual({ ready: true, blockers: [] });
    const approved = transitionGeneratedLegalDocument(record, "APPROVED_FOR_SIGNATURE", { type: "APPROVED", actor: "reviewer" });
    expect(approved.status).toBe("APPROVED_FOR_SIGNATURE");
    expect(approved.productionApproved).toBe(false);
  });

  it("rejects illegal lifecycle transitions", () => {
    const record = buildGeneratedLegalDocument({ id: "legal_nda_6", organizationId: "org-bfm", input, packageResult: buildNdaDraftPackage(input), signers });
    expect(() => transitionGeneratedLegalDocument(record, "EXECUTED", { type: "EXECUTED", actor: "operator" }))
      .toThrow(/illegal/i);
  });

  it("requires a frozen artifact before send and exact artifact-hash evidence before execution", () => {
    let record = resolveAllBlocking(buildGeneratedLegalDocument({ id: "legal_nda_7", organizationId: "org-bfm", input, packageResult: buildNdaDraftPackage(input), signers }));
    record = transitionGeneratedLegalDocument(record, "APPROVED_FOR_SIGNATURE", { type: "APPROVED", actor: "reviewer" });
    expect(() => transitionGeneratedLegalDocument(record, "FROZEN", { type: "PDF_FROZEN", actor: "operator" })).toThrow(/artifact/i);

    record = {
      ...record,
      artifact: {
        organizationId: "org-bfm",
        documentId: record.id,
        version: 1,
        fileName: "nda.pdf",
        mimeType: "application/pdf",
        sha256: "a".repeat(64),
        byteLength: 100,
        storageKey: "legal/generated/org-bfm/nda/legal_nda_7/v1/nda.pdf",
        renderedAt: "2026-08-23T05:10:00.000Z",
      },
    };
    record = transitionGeneratedLegalDocument(record, "FROZEN", { type: "PDF_FROZEN", actor: "operator" });
    record = transitionGeneratedLegalDocument(record, "SENT_FOR_SIGNATURE", { type: "SIGNATURE_REQUESTED", actor: "operator" });

    expect(() => addVerifiedExecutionEvidence(record, {
      kind: "ESIGN_PROVIDER",
      verified: true,
      verifiedAt: "2026-08-23T05:20:00.000Z",
      verifiedBy: "webhook",
      signedArtifactSha256: "b".repeat(64),
    })).toThrow(/artifact/i);

    record = addVerifiedExecutionEvidence(record, {
      kind: "ESIGN_PROVIDER",
      verified: true,
      verifiedAt: "2026-08-23T05:21:00.000Z",
      verifiedBy: "webhook",
      providerEventId: "evt_123",
      signedArtifactSha256: "a".repeat(64),
    });
    record = transitionGeneratedLegalDocument(record, "EXECUTED", { type: "EXECUTED", actor: "system" });
    expect(record.status).toBe("EXECUTED");
  });
});

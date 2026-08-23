import { describe, expect, it } from "vitest";
import {
  buildConsultationDocumentEvidence,
  type ConsultationDocumentCandidate,
} from "@/lib/referral-consultation-evidence";

const now = new Date("2026-08-23T17:00:00.000Z");

function document(overrides: Partial<ConsultationDocumentCandidate> = {}): ConsultationDocumentCandidate {
  return {
    id: "doc-1",
    organizationId: "org-destination",
    patientId: "patient-1",
    referralId: null,
    name: "Cardiology consultation report",
    version: 2,
    sourceType: "upload",
    status: "active",
    reviewStatus: "approved",
    expiresAt: null,
    ...overrides,
  };
}

describe("referral consultation document evidence", () => {
  it("accepts an approved active destination document and marks an unbound document for referral binding", () => {
    expect(buildConsultationDocumentEvidence(document(), {
      referralId: "referral-1",
      patientId: "patient-1",
      destinationOrganizationId: "org-destination",
      now,
    })).toEqual({
      documentId: "doc-1",
      name: "Cardiology consultation report",
      version: 2,
      sourceType: "upload",
      reviewStatus: "approved",
      referralBinding: "bind_on_receipt",
    });
  });

  it("accepts a document already bound to the exact referral without creating a second binding", () => {
    expect(buildConsultationDocumentEvidence(document({ referralId: "referral-1" }), {
      referralId: "referral-1",
      patientId: "patient-1",
      destinationOrganizationId: "org-destination",
      now,
    }).referralBinding).toBe("already_linked");
  });

  it("fails closed for the wrong patient or destination organization", () => {
    expect(() => buildConsultationDocumentEvidence(document({ patientId: "patient-2" }), {
      referralId: "referral-1",
      patientId: "patient-1",
      destinationOrganizationId: "org-destination",
      now,
    })).toThrow("patient");
    expect(() => buildConsultationDocumentEvidence(document({ organizationId: "org-other" }), {
      referralId: "referral-1",
      patientId: "patient-1",
      destinationOrganizationId: "org-destination",
      now,
    })).toThrow("organization");
  });

  it("rejects a document already bound to another referral", () => {
    expect(() => buildConsultationDocumentEvidence(document({ referralId: "referral-other" }), {
      referralId: "referral-1",
      patientId: "patient-1",
      destinationOrganizationId: "org-destination",
      now,
    })).toThrow("another referral");
  });

  it("rejects unreviewed, rejected, archived, superseded, or expired evidence", () => {
    const context = {
      referralId: "referral-1",
      patientId: "patient-1",
      destinationOrganizationId: "org-destination",
      now,
    };

    expect(() => buildConsultationDocumentEvidence(document({ reviewStatus: "needs_review" }), context)).toThrow("approved review");
    expect(() => buildConsultationDocumentEvidence(document({ reviewStatus: "rejected" }), context)).toThrow("approved review");
    expect(() => buildConsultationDocumentEvidence(document({ status: "archived" }), context)).toThrow("active");
    expect(() => buildConsultationDocumentEvidence(document({ status: "superseded" }), context)).toThrow("active");
    expect(() => buildConsultationDocumentEvidence(document({ expiresAt: new Date("2026-08-22T00:00:00.000Z") }), context)).toThrow("expired");
  });

  it("projects only minimum-necessary evidence metadata and never file-storage internals", () => {
    const evidence = buildConsultationDocumentEvidence(document(), {
      referralId: "referral-1",
      patientId: "patient-1",
      destinationOrganizationId: "org-destination",
      now,
    });

    expect(evidence).not.toHaveProperty("organizationId");
    expect(evidence).not.toHaveProperty("patientId");
    expect(evidence).not.toHaveProperty("storageKey");
    expect(evidence).not.toHaveProperty("originalFileName");
    expect(evidence).not.toHaveProperty("patientVisible");
  });
});

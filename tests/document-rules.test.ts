import { describe, expect, it } from "vitest";
import {
  createDocumentCategorySchema,
  createDocumentMetadataSchema,
  createDocumentVersionMetadataSchema,
  documentPacketSchema,
  documentTransitionSchema,
  nextDocumentState,
} from "@/lib/document-rules";

describe("governed document lifecycle rules", () => {
  const active = {
    status: "active", reviewStatus: "needs_review", releaseStatus: "pending", reviewRequired: true,
    patientId: "pt-1", patientVisible: false, expiresAt: null, lockedAt: null,
  };

  it("requires valid patient/workflow link pairs and normalized category policy", () => {
    expect(createDocumentMetadataSchema.safeParse({ patientId: "pt-1", categoryId: "cat-1", name: "Insurance card", caseType: "nofault" }).success).toBe(false);
    expect(createDocumentMetadataSchema.safeParse({ patientId: "pt-1", categoryId: "cat-1", name: "Insurance card", caseType: "nofault", caseId: "case-1" }).success).toBe(true);
    expect(createDocumentCategorySchema.safeParse({ code: "Insurance Card", name: "Insurance card" }).success).toBe(false);
    expect(createDocumentCategorySchema.safeParse({ code: "insurance_card", name: "Insurance card", retentionDays: 2555 }).success).toBe(true);
  });

  it("keeps review separate from patient portal release", () => {
    expect(() => nextDocumentState(active, "approve_release")).toThrow("review");
    expect(nextDocumentState(active, "approve_review")).toEqual({ reviewStatus: "approved" });
    expect(nextDocumentState({ ...active, reviewStatus: "approved" }, "approve_release")).toMatchObject({ releaseStatus: "approved", patientVisible: true, internalOnly: false });
  });

  it("requires a patient binding for portal release", () => {
    expect(() => nextDocumentState({ ...active, patientId: null, reviewStatus: "approved" }, "approve_release")).toThrow("patient-bound");
  });

  it("revokes portal access when rejecting, archiving, or explicitly revoking", () => {
    expect(nextDocumentState(active, "reject_review")).toMatchObject({ reviewStatus: "rejected", patientVisible: false });
    const visible = { ...active, reviewStatus: "approved", releaseStatus: "approved", patientVisible: true };
    expect(nextDocumentState(visible, "revoke_release")).toMatchObject({ releaseStatus: "revoked", patientVisible: false });
    expect(nextDocumentState(visible, "archive")).toMatchObject({ status: "archived", releaseStatus: "revoked", patientVisible: false });
  });

  it("blocks routine processing for expired or superseded records", () => {
    const expired = { ...active, status: "archived", expiresAt: new Date("2020-01-01T00:00:00.000Z") };
    expect(() => nextDocumentState(expired, "restore", new Date("2026-01-01T00:00:00.000Z"))).toThrow("Expired");
    expect(nextDocumentState({ ...expired, status: "active" }, "archive", new Date("2026-01-01T00:00:00.000Z"))).toMatchObject({ status: "archived" });
    expect(() => nextDocumentState({ ...active, status: "superseded" }, "approve_review")).toThrow("immutable");
  });

  it("locks an active document exactly once", () => {
    expect(nextDocumentState(active, "lock")).toEqual({ locked: true });
    expect(() => nextDocumentState({ ...active, lockedAt: new Date() }, "lock")).toThrow("already locked");
  });

  it("requires human notes for consequential review and archival actions", () => {
    expect(documentTransitionSchema.safeParse({ action: "reject_review" }).success).toBe(false);
    expect(documentTransitionSchema.safeParse({ action: "reject_review", note: "Wrong patient association confirmed." }).success).toBe(true);
    expect(documentTransitionSchema.safeParse({ action: "approve_release" }).success).toBe(true);
  });

  it("requires a reason for replacement versions and a purpose-bound packet", () => {
    expect(createDocumentVersionMetadataSchema.safeParse({ name: "Care plan", reason: "typo" }).success).toBe(false);
    expect(createDocumentVersionMetadataSchema.safeParse({ name: "Care plan", reason: "Corrected source document supplied." }).success).toBe(true);
    expect(documentPacketSchema.safeParse({ documentIds: ["doc-1"], purpose: "records" }).success).toBe(false);
    expect(documentPacketSchema.safeParse({ documentIds: ["doc-1", "doc-2"], purpose: "Authorized treatment coordination export." }).success).toBe(true);
  });
});

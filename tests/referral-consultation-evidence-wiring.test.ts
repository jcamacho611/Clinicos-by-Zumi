import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const repositorySource = readFileSync(
  new URL("../src/lib/repositories/referral-repository.ts", import.meta.url),
  "utf8",
);

describe("consultation evidence repository wiring", () => {
  it("requires document authority before binding a consultation document", () => {
    expect(repositorySource).toContain('can(session.role, "documents", "read")');
    expect(repositorySource).toContain('can(session.role, "documents", "update")');
  });

  it("uses the governed consultation evidence guard instead of patient-only document matching", () => {
    expect(repositorySource).toContain('buildConsultationDocumentEvidence');
    expect(repositorySource).toContain('referralId: true');
    expect(repositorySource).toContain('reviewStatus: true');
    expect(repositorySource).toContain('expiresAt: true');
  });

  it("atomically binds an unbound approved document to the exact referral", () => {
    expect(repositorySource).toContain('evidence.referralBinding === "bind_on_receipt"');
    expect(repositorySource).toContain('referralId: null');
    expect(repositorySource).toContain('data: { referralId: referral.id }');
    expect(repositorySource).toContain('Consultation document changed. Refresh and try again.');
  });

  it("audits the cross-domain evidence binding without exposing document content", () => {
    expect(repositorySource).toContain('eventType: "referral_linked"');
    expect(repositorySource).toContain('action: "document.referral_linked"');
    expect(repositorySource).not.toContain('encryptedContent: true');
  });
});

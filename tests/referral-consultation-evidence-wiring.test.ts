import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const consultationRepositorySource = readFileSync(
  new URL("../src/lib/repositories/referral-consultation-repository.ts", import.meta.url),
  "utf8",
);
const transitionRouteSource = readFileSync(
  new URL("../src/app/api/referrals/[referralId]/transition/route.ts", import.meta.url),
  "utf8",
);

describe("consultation evidence repository wiring", () => {
  it("routes consultation receipt through the dedicated governed transaction", () => {
    expect(transitionRouteSource).toContain("recordReferralConsultation");
    expect(transitionRouteSource).toContain('body.action === "consultation_received"');
  });

  it("requires referral and document authority before binding a consultation document", () => {
    expect(consultationRepositorySource).toContain('can(session.role, "referrals", "update")');
    expect(consultationRepositorySource).toContain('can(session.role, "documents", "read")');
    expect(consultationRepositorySource).toContain('can(session.role, "documents", "update")');
  });

  it("revalidates connected treatment authority before accepting the returned consultation", () => {
    expect(consultationRepositorySource).toContain("requireActiveConnection");
    expect(consultationRepositorySource).toContain("requireActiveAgreement");
    expect(consultationRepositorySource).toContain("requireActiveAccessConsent");
    expect(consultationRepositorySource).toContain('["demographics", "referrals"]');
  });

  it("uses the governed evidence guard and atomically binds only an unbound approved document", () => {
    expect(consultationRepositorySource).toContain("buildConsultationDocumentEvidence");
    expect(consultationRepositorySource).toContain('evidence.referralBinding === "bind_on_receipt"');
    expect(consultationRepositorySource).toContain('referralId: null');
    expect(consultationRepositorySource).toContain('data: { referralId: referral.id }');
    expect(consultationRepositorySource).toContain('Consultation document changed. Refresh and try again.');
  });

  it("keeps consultation received separate from referral closure and records both domain audits", () => {
    expect(consultationRepositorySource).toContain('status: "consultation_received"');
    expect(consultationRepositorySource).not.toContain('status: "closed"');
    expect(consultationRepositorySource).toContain('eventType: "referral_linked"');
    expect(consultationRepositorySource).toContain('action: "document.referral_linked"');
    expect(consultationRepositorySource).toContain('action: "referral.consultation_received"');
    expect(consultationRepositorySource).not.toContain('encryptedContent: true');
  });
});

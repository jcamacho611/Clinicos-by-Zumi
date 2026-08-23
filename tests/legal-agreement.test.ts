import { describe, expect, it } from "vitest";
import {
  agreementPlainText,
  agreementSha256,
  buildGlobalAgreement,
  normalizeSignatureText,
  requiredAcknowledgmentsForRole,
  validateRequiredAcknowledgments,
} from "@/lib/legal/global-agreement";

const config = {
  entityName: "Klinikos Test Entity, Inc.",
  legalContactEmail: "legal@example.test",
  governingLaw: "the laws of Test State",
  forum: "the state and federal courts located in Test County",
};

describe("Klinikos global agreement", () => {
  it("produces a stable 64-character SHA-256 hash for the exact snapshot", () => {
    const agreement = buildGlobalAgreement(config);
    const first = agreementSha256(agreement);
    const second = agreementSha256(buildGlobalAgreement(config));
    expect(first).toMatch(/^[a-f0-9]{64}$/u);
    expect(first).toBe(second);
  });

  it("changes the hash when a legally material configured party changes", () => {
    const first = agreementSha256(buildGlobalAgreement(config));
    const second = agreementSha256(buildGlobalAgreement({ ...config, entityName: "Different Entity, Inc." }));
    expect(second).not.toBe(first);
  });

  it("contains confidentiality, trade-secret, healthcare, AI, Grid, payment, and BAA safeguards", () => {
    const text = agreementPlainText(buildGlobalAgreement(config));
    expect(text).toContain("Confidential, Proprietary, and Trade-Secret Information");
    expect(text).toContain("Ordinary acceptance of these Terms does not create HIPAA compliance");
    expect(text).toContain("AI output does not independently establish");
    expect(text).toContain("Discovery is not eligibility");
    expect(text).toContain("A checkout redirect or browser success screen is not payment evidence");
    expect(text).toContain("does not impose an arbitrary punitive 'fine'");
  });

  it("requires extra professional and Grid acknowledgments without weakening base assent", () => {
    const owner = requiredAcknowledgmentsForRole("clinic_owner");
    const provider = requiredAcknowledgmentsForRole("provider");
    const contractor = requiredAcknowledgmentsForRole("contractor");
    expect(owner.map(({ key }) => key)).toEqual(["terms", "confidentiality", "electronic_signature", "ai_authority"]);
    expect(provider.map(({ key }) => key)).toContain("professional_truth");
    expect(contractor.map(({ key }) => key)).toEqual(expect.arrayContaining(["terms", "confidentiality", "electronic_signature", "ai_authority", "professional_truth", "grid_truth"]));
  });

  it("never treats partial acknowledgments as complete assent", () => {
    const required = requiredAcknowledgmentsForRole("clinic_owner");
    expect(validateRequiredAcknowledgments(required, { terms: true, confidentiality: true, electronic_signature: true, ai_authority: false })).toBe(false);
    expect(validateRequiredAcknowledgments(required, Object.fromEntries(required.map(({ key }) => [key, true])))).toBe(true);
  });

  it("normalizes typed signatures without silently changing their substantive name", () => {
    expect(normalizeSignatureText("  Jane   Doe ")).toBe("jane doe");
    expect(normalizeSignatureText("Jane Doe")).toBe(normalizeSignatureText("JANE DOE"));
    expect(normalizeSignatureText("Jane Q Doe")).not.toBe(normalizeSignatureText("Jane Doe"));
  });
});

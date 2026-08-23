import { describe, expect, it } from "vitest";
import { buildNdaDraftPackage } from "@/lib/legal/generated/nda-drafting";

const base = {
  recipientName: "Melissa Example",
  recipientEntity: "Example Health Group",
  recipientState: "FL",
  relationshipType: "strategic_partner" as const,
  permittedPurpose: "Evaluate a potential Klinikos clinic-network relationship",
};

describe("generated NDA drafting package", () => {
  it("keeps every disclosure level outside crown-jewel access authority", () => {
    for (const disclosureLevel of [1, 2, 3] as const) {
      const result = buildNdaDraftPackage({ ...base, disclosureLevel });
      expect(result.productionApproved).toBe(false);
      expect(result.counselReviewRequired).toBe(true);
      expect(result.disclosurePlan.prohibited).toContain("PHI or patient databases without separate lawful authority");
      expect(result.disclosurePlan.prohibited).toContain("Production credentials, API secrets, signing keys, or encryption keys");
      expect(result.disclosurePlan.prohibited).toContain("Unrestricted source code or unrestricted database/admin access");
    }
  });

  it("adds limited introduced-opportunity terms only for relationships that call for them", () => {
    const partner = buildNdaDraftPackage({ ...base, disclosureLevel: 2 });
    expect(partner.modules).toContain("Limited non-circumvention for specifically introduced opportunities");
    expect(partner.draftingTargets.nonCircumventionMonths).toBe(18);
    expect(partner.companionAgreements).toContain("Strategic Partner / Referral Agreement before compensation, exclusivity, or authority is granted");

    const investor = buildNdaDraftPackage({ ...base, relationshipType: "investor", disclosureLevel: 2 });
    expect(investor.modules).not.toContain("Limited non-circumvention for specifically introduced opportunities");
    expect(investor.draftingTargets.nonCircumventionMonths).toBeNull();
  });

  it("turns recipient-state concerns into review items rather than automated enforceability conclusions", () => {
    const florida = buildNdaDraftPackage({ ...base, disclosureLevel: 2 });
    const restrictive = florida.reviewItems.find((item) => item.category === "restrictive_covenant");
    expect(restrictive).toMatchObject({ required: true, severity: "blocking" });
    expect(restrictive?.rationale).toContain("Florida");
    expect(restrictive?.rationale.toLowerCase()).toContain("review");
    expect(restrictive?.rationale).not.toMatch(/is enforceable|is unenforceable/i);

    const california = buildNdaDraftPackage({ ...base, recipientState: "CA", disclosureLevel: 2 });
    expect(california.reviewItems.find((item) => item.key === "restrictive-covenant-jurisdiction-review")?.rationale).toContain("California");
  });

  it("labels liquidated-damages values as review-required drafting targets", () => {
    const result = buildNdaDraftPackage({ ...base, disclosureLevel: 2 });
    expect(result.draftingTargets.liquidatedDamagesUsd).toEqual({
      categoryI: 25000,
      categoryII: 50000,
      categoryIII: 75000,
      reviewRequired: true,
    });
    expect(result.reviewItems).toContainEqual(expect.objectContaining({
      key: "liquidated-damages-review",
      category: "liquidated_damages",
      required: true,
      severity: "blocking",
    }));
    expect(result.warnings.join(" ")).toContain("drafting targets");
    expect(result.warnings.join(" ")).toContain("not guaranteed penalties or recoveries");
  });

  it("creates stable blocking review items for final law/venue, disclosure scope and signer authority", () => {
    const result = buildNdaDraftPackage({ ...base, disclosureLevel: 2 });
    expect(result.reviewItems).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "governing-law-venue-review", category: "governing_law_venue", required: true, severity: "blocking" }),
      expect.objectContaining({ key: "disclosure-scope-review", category: "disclosure_scope", required: true, severity: "blocking" }),
      expect.objectContaining({ key: "signer-authority-review", category: "signer_authority", required: true, severity: "blocking" }),
    ]));
  });

  it("adds relationship-specific companion agreement and privacy review prompts without granting authority", () => {
    const clinic = buildNdaDraftPackage({ ...base, relationshipType: "clinic", disclosureLevel: 3 });
    expect(clinic.companionAgreements).toContain("Clinic Master Services Agreement");
    expect(clinic.companionAgreements).toContain("Business Associate Agreement analysis before any PHI access");
    expect(clinic.reviewItems).toContainEqual(expect.objectContaining({ category: "privacy_data", required: true }));
    expect(clinic.warnings.join(" ")).toContain("does not authorize PHI");
  });
});

import { describe, expect, it } from "vitest";
import {
  KLINIKOS_SCREEN_EXPERIENCE_CONTRACTS,
  REQUIRED_SCREEN_FAMILIES,
} from "@/lib/screen-experience-contracts";

const requiredFamilies = [
  "public-discovery",
  "auth-signup",
  "grid-professional",
  "grid-organization",
  "edu-learner",
  "edu-instructor",
  "patient-home",
  "provider-home",
  "current-visit",
  "clinical-handoff",
  "biller-money-readiness",
  "clinic-owner-operations",
  "enterprise-admin",
  "organization-claim-verification",
  "telemedicine-encounter",
] as const;

describe("Klinikos screen experience contracts", () => {
  it("registers every priority screen family", () => {
    expect(REQUIRED_SCREEN_FAMILIES).toEqual(expect.arrayContaining([...requiredFamilies]));
    const ids = KLINIKOS_SCREEN_EXPERIENCE_CONTRACTS.map((contract) => contract.id);
    for (const family of requiredFamilies) expect(ids).toContain(family);
  });

  it("requires every screen family to declare visibility, authority, Zumi and AI-processing truth", () => {
    for (const contract of KLINIKOS_SCREEN_EXPERIENCE_CONTRACTS) {
      expect(contract.routePatterns.length).toBeGreaterThan(0);
      expect(contract.audiences.length).toBeGreaterThan(0);
      expect(contract.contextRequirements.length).toBeGreaterThan(0);
      expect(contract.visibleByDefault.length).toBeGreaterThan(0);
      expect(contract.intentionallyHidden.length).toBeGreaterThan(0);
      expect(contract.eligibility.length).toBeGreaterThan(0);
      expect(contract.entitlement.length).toBeGreaterThan(0);
      expect(contract.authority.length).toBeGreaterThan(0);
      expect(contract.dataProjection.length).toBeGreaterThan(0);
      expect(contract.minimumNecessary.length).toBeGreaterThan(0);
      expect(contract.actions.length).toBeGreaterThan(0);
      expect(contract.zumi.readScope.length).toBeGreaterThan(0);
      expect(contract.zumi.inferScope.length).toBeGreaterThan(0);
      expect(contract.zumi.recommend.length).toBeGreaterThan(0);
      expect(contract.zumi.prepareDraft.length).toBeGreaterThan(0);
      expect(contract.zumi.forbidden.length).toBeGreaterThan(0);
      expect(contract.aiProcessing.allowedDataClasses.length).toBeGreaterThan(0);
      expect(contract.aiProcessing.prohibitedDataClasses.length).toBeGreaterThan(0);
      expect(contract.aiProcessing.purpose.length).toBeGreaterThan(0);
      expect(contract.aiProcessing.processingBasis.length).toBeGreaterThan(0);
      expect(contract.aiProcessing.agreementKey.length).toBeGreaterThan(0);
      expect(contract.audit.length).toBeGreaterThan(0);
      expect(contract.provenance.length).toBeGreaterThan(0);
      expect(contract.commercialTargetingBoundary.length).toBeGreaterThan(0);
      expect(contract.states.denied.length).toBeGreaterThan(0);
      expect(contract.states.blocked.length).toBeGreaterThan(0);
      expect(contract.states.loading.length).toBeGreaterThan(0);
      expect(contract.states.empty.length).toBeGreaterThan(0);
      expect(contract.states.error.length).toBeGreaterThan(0);
      expect(contract.mobile.length).toBeGreaterThan(0);
      expect(contract.accessibility.length).toBeGreaterThan(0);
      expect(contract.aiProcessing.modelTraining).toBe("not-permitted-by-default");
      expect(contract.commercialTargetingBoundary.join(" ").toLowerCase()).not.toContain("phi allowed");
    }
  });

  it("forbids PHI on public discovery and gates PHI-capable healthcare surfaces", () => {
    const publicContract = KLINIKOS_SCREEN_EXPERIENCE_CONTRACTS.find((contract) => contract.id === "public-discovery");
    expect(publicContract?.aiProcessing.phiGate).toBe("forbidden");

    const phiCapable = ["patient-home", "provider-home", "current-visit", "clinical-handoff", "biller-money-readiness", "telemedicine-encounter"];
    for (const id of phiCapable) {
      const contract = KLINIKOS_SCREEN_EXPERIENCE_CONTRACTS.find((item) => item.id === id);
      expect(["hipaa-gated", "minimum-necessary"]).toContain(contract?.aiProcessing.phiGate);
    }
  });

  it("never lets Zumi promotion, inference or convenience manufacture authority", () => {
    for (const contract of KLINIKOS_SCREEN_EXPERIENCE_CONTRACTS) {
      expect(contract.zumi.forbidden).toEqual(expect.arrayContaining([
        "grant-authority",
        "manufacture-verified-facts",
      ]));
    }
  });
});

import { describe, expect, it } from "vitest";
import { KLINIKOS_OPERATING_NETWORK_CANON } from "@/lib/operating-network-canon";

describe("Klinikos operating-network canon", () => {
  it("locks the approved company and experience laws", () => {
    expect(KLINIKOS_OPERATING_NETWORK_CANON.brand).toBe("Klinikos. The clinic operations ecosystem, powered by Zumi.");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.laws).toContain("free-participation-is-distribution-infrastructure");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.laws).toContain("land-without-displacement");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.laws).toContain("founder-omission-does-not-equal-engineering-omission");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.laws).toContain("no-known-failure-disappears-silently");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.laws).toContain("market-category-terms-are-capability-labels-not-parent-definitions");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.laws).toContain("one-identity-many-governed-experiences");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.laws).toContain("signup-promotes-relevant-experience-not-the-whole-platform");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.laws).toContain("experience-is-continuously-composed-not-assigned-once");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.laws).toContain("every-screen-declares-visible-hidden-and-zumi-boundaries");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.laws).toContain("ai-processing-requires-purpose-data-class-and-agreement-basis");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.laws).toContain("clinical-data-is-not-commercial-targeting-context");
  });

  it("keeps familiar market categories subordinate to the operating network", () => {
    expect(KLINIKOS_OPERATING_NETWORK_CANON.parentDefinition).toBe("governed-healthcare-operating-network");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.marketCapabilityLabels).toEqual(expect.arrayContaining([
      "ehr-emr",
      "practice-management",
      "scheduling",
      "telemedicine",
      "billing-revenue-cycle",
      "patient-portal",
      "crm",
      "staffing-marketplace",
      "professional-network",
      "education-workforce",
      "ai-copilot",
      "analytics",
      "payments",
      "resource-marketplace",
    ]));
    expect(KLINIKOS_OPERATING_NETWORK_CANON.marketCapabilityLabels).not.toContain(KLINIKOS_OPERATING_NETWORK_CANON.parentDefinition);
  });

  it("keeps the growth journey value-first and identity-later", () => {
    expect(KLINIKOS_OPERATING_NETWORK_CANON.userOrder.slice(0, 4)).toEqual([
      "discover",
      "receive-value",
      "express-intent",
      "create-identity-when-persistence-matters",
    ]);
    expect(KLINIKOS_OPERATING_NETWORK_CANON.userOrder.indexOf("enter-grid-or-relevant-network")).toBeLessThan(
      KLINIKOS_OPERATING_NETWORK_CANON.userOrder.indexOf("paid-implementation-subscription-or-contract"),
    );
  });

  it("routes one identity into a continuously recomputed bounded experience", () => {
    expect(KLINIKOS_OPERATING_NETWORK_CANON.experienceRouting.identityModel).toBe("one-person-one-persistent-identity-many-contextual-relationships");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.experienceRouting.experienceModel).toBe("continuously-recomputed-active-experience-envelope");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.experienceRouting.defaultOperationalAccess).toBe("locked-unless-authorized");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.experienceRouting.signupPurpose).toBe("resolve-and-promote-the-most-relevant-starting-experience");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.experienceRouting.promotionIsAuthority).toBe(false);
    expect(KLINIKOS_OPERATING_NETWORK_CANON.experienceRouting.rules).toEqual(expect.arrayContaining([
      "show-only-what-is-relevant-now",
      "hide-irrelevant-systems-from-primary-experience",
      "deny-operational-access-without-authority",
      "expand-experience-when-new-relationships-needs-or-entitlements-justify-it",
      "context-switch-recomputes-navigation-data-projection-zumi-scope-and-actions",
      "every-user-facing-screen-resolves-to-a-screen-experience-contract",
    ]));
  });

  it("keeps consequential truth states separate", () => {
    expect(KLINIKOS_OPERATING_NETWORK_CANON.truthSeparations).toContain("claim!=verified-fact!=authority");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.truthSeparations).toContain("exists!=discoverable!=promoted!=eligible!=entitled!=authorized!=visible-data!=actionable-now");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.truthSeparations).toContain("booking!=fulfillment");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.truthSeparations).toContain("payment-intent!=payment");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.truthSeparations).toContain("deployed!=production-verified");
  });

  it("keeps the surface simple while retaining explicit backend kernel ownership", () => {
    expect(KLINIKOS_OPERATING_NETWORK_CANON.roleSurface.provider).toBe("one-visit");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.roleSurface.patient).toBe("one-next-action");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.roleSurface.owner).toBe("one-operating-picture");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.backendKernels).toEqual(expect.arrayContaining([
      "identity",
      "experience-envelope",
      "screen-contracts",
      "grid",
      "financial",
      "reliability",
    ]));
  });

  it("makes screen contracts and AI processing policies release authorities", () => {
    expect(KLINIKOS_OPERATING_NETWORK_CANON.screenContractAuthority.unclassifiedRoute).toBe("block-production-release-until-classified");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.aiProcessingAuthority.defaultModelTraining).toBe("not-permitted-by-default");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.aiProcessingAuthority.publicPhi).toBe("forbidden");
  });
});

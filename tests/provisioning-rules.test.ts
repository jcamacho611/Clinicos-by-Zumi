import { describe, expect, it } from "vitest";
import {
  MAPPED_PLAN_KEYS,
  modulesForPlan,
  modulesForTier,
  PAYMENT_DOES_NOT_GRANT,
  planProvisioning,
  provisioningKey,
  provisioningSteps,
  stepCompletableByPayment,
  subscriptionModules,
} from "@/lib/provisioning/provisioning-rules";
import { accessTierKeys } from "@/lib/commerce/whop-catalog";
import { zumiCapabilities } from "@/features/zumi/schemas";

/**
 * Provisioning is where "someone paid" becomes "their clinic can use it". These tests
 * defend the two ways that goes wrong: granting less than was bought, and granting
 * more than payment can lawfully grant.
 */

describe("module mapping", () => {
  it("maps every access tier", () => {
    for (const tier of accessTierKeys) {
      expect({ tier, mapped: Array.isArray(modulesForTier(tier)) }).toEqual({ tier, mapped: true });
    }
  });

  it("maps every plan sold through the Growth Engine", () => {
    for (const plan of MAPPED_PLAN_KEYS) {
      expect({ plan, modules: modulesForPlan(plan).length > 0 }).toEqual({ plan, modules: true });
    }
  });

  it("grants an evaluator no operational modules", () => {
    // Evaluation access buys materials, not a workspace. An evaluator quietly given
    // operational modules is an evaluator using the product for free.
    expect(modulesForTier("evaluator_pass")).toEqual([]);
  });

  it("gives a paying clinic the workspace it bought", () => {
    const modules = modulesForTier("clinic_operator");
    expect(modules).toContain("clinic_workspace");
    expect(modules).toContain("scheduling");
    expect(modules).toContain("billing_readiness");
  });

  it("does not give a GRID provider a clinic workspace", () => {
    // A provider bought marketplace access, not somebody's practice management.
    expect(modulesForTier("grid_provider")).not.toContain("clinic_workspace");
    expect(modulesForTier("grid_provider")).toContain("grid");
  });

  it("returns nothing for a tier or plan nobody declared", () => {
    expect(modulesForTier("made_up_tier")).toEqual([]);
    expect(modulesForPlan("made_up_plan")).toEqual([]);
  });

  it("uses module names Zumi's capability catalog actually checks", () => {
    // The bug this closes: entitlements were granted in one vocabulary and read in
    // another, so a paying customer was still refused with a 402.
    const required = zumiCapabilities
      .map((capability) => capability.requiresEntitlement)
      .filter((entitlement): entitlement is string => entitlement !== null);

    for (const entitlement of new Set(required)) {
      expect({ entitlement, declared: (subscriptionModules as readonly string[]).includes(entitlement) })
        .toEqual({ entitlement, declared: true });
    }
  });

  it("actually delivers those modules to a paying clinic", () => {
    const modules = modulesForPlan("klinikos_multi");
    expect(modules).toContain("grid");
    expect(modules).toContain("billing_readiness");
    expect(modules).toContain("revenue_recovery");
    expect(modules).toContain("advanced_reports");
  });
});

describe("what payment can and cannot finish", () => {
  it("lets payment create the workspace, subscription, entitlements, and onboarding", () => {
    for (const step of ["organization", "subscription", "entitlements", "onboarding"] as const) {
      expect({ step, completable: stepCompletableByPayment(step) }).toEqual({ step, completable: true });
    }
  });

  it("never lets payment finish a connection or a human review", () => {
    // One needs an account the clinic owns; the other needs a person. Marking either
    // complete on payment is the fake instant activation the constitution forbids.
    for (const step of ["connections", "regulated_review"] as const) {
      expect({ step, completable: stepCompletableByPayment(step) }).toEqual({ step, completable: false });
    }
  });

  it("enumerates what a purchase does not buy", () => {
    expect(PAYMENT_DOES_NOT_GRANT).toContain("Credential or licence verification");
    expect(PAYMENT_DOES_NOT_GRANT).toContain("A signed Business Associate Agreement");
    expect(PAYMENT_DOES_NOT_GRANT).toContain("Approval to process protected health information");
  });

  it("covers every declared step in the plan it builds", () => {
    const plan = planProvisioning({ tierKey: "clinic_operator", hasOrganization: false });
    expect(plan.steps.map((entry) => entry.step)).toEqual([...provisioningSteps]);
  });
});

describe("the provisioning plan", () => {
  it("creates a workspace for a clinic that does not have one", () => {
    const plan = planProvisioning({ tierKey: "clinic_operator", hasOrganization: false });
    expect(plan.steps.find((entry) => entry.step === "organization")?.state).toBe("pending");
  });

  it("links to an existing clinic rather than making a second one", () => {
    const plan = planProvisioning({ tierKey: "clinic_operator", hasOrganization: true });
    expect(plan.steps.find((entry) => entry.step === "organization")?.state).toBe("complete");
  });

  it("provisions no workspace for an evaluation pass", () => {
    const plan = planProvisioning({ tierKey: "evaluator_pass", hasOrganization: false });
    expect(plan.steps.find((entry) => entry.step === "organization")?.state).toBe("not_applicable");
    expect(plan.steps.find((entry) => entry.step === "onboarding")?.state).toBe("not_applicable");
    expect(plan.modules).toEqual([]);
  });

  it("leaves connections blocked and says why", () => {
    const plan = planProvisioning({ tierKey: "clinic_operator", hasOrganization: false });
    const connections = plan.steps.find((entry) => entry.step === "connections");
    expect(connections?.state).toBe("blocked");
    expect(connections?.detail).toContain("accounts your clinic owns");
  });

  it("keeps a GRID provider's credential review blocked after payment", () => {
    // Paying to join the marketplace is not the same as having a verified licence.
    const plan = planProvisioning({ tierKey: "grid_provider", hasOrganization: false });
    const review = plan.steps.find((entry) => entry.step === "regulated_review");
    expect(review?.state).toBe("blocked");
    expect(review?.detail).toContain("human verification");
  });

  it("raises no review for an evaluation pass, which has none to raise", () => {
    const plan = planProvisioning({ tierKey: "evaluator_pass", hasOrganization: false });
    expect(plan.steps.find((entry) => entry.step === "regulated_review")?.state).toBe("not_applicable");
  });

  it("states everything still outstanding in words a customer can read", () => {
    const plan = planProvisioning({ tierKey: "clinic_operator", hasOrganization: false });
    expect(plan.outstanding.length).toBeGreaterThan(0);
    for (const entry of plan.outstanding) expect(entry.length).toBeGreaterThan(20);
  });

  it("plans a Growth Engine plan purchase the same way", () => {
    const plan = planProvisioning({ planKey: "klinikos", hasOrganization: false });
    expect(plan.steps.find((entry) => entry.step === "organization")?.state).toBe("pending");
    expect(plan.modules).toContain("clinic_workspace");
  });
});

describe("idempotency", () => {
  it("derives the same key from the same payment", () => {
    // Whop redelivers. If the key were generated rather than derived, a redelivery
    // would provision a second workspace for one purchase.
    const first = provisioningKey({ source: "whop_membership", reference: "mem_123" });
    const second = provisioningKey({ source: "whop_membership", reference: " mem_123 " });
    expect(first).toBe(second);
  });

  it("separates the two payment sources", () => {
    expect(provisioningKey({ source: "whop_membership", reference: "abc" })).not.toBe(
      provisioningKey({ source: "access_payment", reference: "abc" }),
    );
  });
});

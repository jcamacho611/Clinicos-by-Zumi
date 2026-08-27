import { describe, expect, it } from "vitest";
import { KLINIKOS_EXPERIENCE_ENVELOPE_CANON } from "@/lib/experience-envelope-canon";

describe("Klinikos active experience envelope", () => {
  it("keeps visibility and authority states explicitly separate", () => {
    expect(KLINIKOS_EXPERIENCE_ENVELOPE_CANON.stateLadder).toEqual([
      "exists",
      "discoverable",
      "promoted",
      "eligible",
      "entitled",
      "authorized",
      "visible-data",
      "actionable-now",
    ]);
  });

  it("composes the experience from the full active context instead of role alone", () => {
    expect(KLINIKOS_EXPERIENCE_ENVELOPE_CANON.inputs).toEqual(expect.arrayContaining([
      "identity",
      "active-relationship",
      "organization",
      "location",
      "role",
      "verified-credentials",
      "authority",
      "purpose",
      "entitlements",
      "current-intent",
      "current-workflow",
      "current-resource",
      "authorized-patient-or-case-context",
      "network-state",
      "temporal-context",
      "jurisdiction",
      "policy",
      "risk-state",
    ]));
  });

  it("produces a bounded surface rather than exposing the whole platform", () => {
    expect(KLINIKOS_EXPERIENCE_ENVELOPE_CANON.outputs).toEqual(expect.arrayContaining([
      "primary-workspace",
      "primary-action",
      "navigation",
      "secondary-capabilities",
      "data-projection",
      "actions",
      "zumi-tools",
      "notifications",
      "promotions",
      "verification-requests",
      "blocked-states",
      "context-switches",
      "audit-requirements",
    ]));
  });

  it("recomputes context without allowing cross-context data bleed", () => {
    expect(KLINIKOS_EXPERIENCE_ENVELOPE_CANON.laws).toEqual(expect.arrayContaining([
      "signup-seeds-envelope-not-permanent-classification",
      "envelope-recomputes-when-context-changes",
      "least-privilege-and-minimum-necessary",
      "promotion-does-not-grant-entitlement-or-authority",
      "same-identity-may-switch-contexts-without-data-bleed",
      "clinical-context-cannot-leak-into-grid-or-commercial-targeting",
      "visibility-is-not-authority",
      "zumi-interprets-context-policy-engines-authorize",
    ]));
  });
});

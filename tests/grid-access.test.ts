import { describe, expect, it } from "vitest";
import type { EntitlementRecord } from "@/lib/commerce/whop-rules";
import { evaluateGridMarketplaceAccess, gridMarketplaceActions, summarizeGridMarketplaceAccess } from "@/lib/grid-access";

const NOW = new Date("2026-08-10T12:00:00.000Z");

function entitlement(tierKey: string, overrides: Partial<EntitlementRecord> = {}): EntitlementRecord {
  return {
    tierKey,
    state: "active",
    validUntil: new Date("2026-12-01T00:00:00.000Z"),
    revokedAt: null,
    lastVerifiedAt: NOW,
    ...overrides,
  };
}

describe("GRID marketplace access layer", () => {
  it("blocks every marketplace action when nothing was purchased", () => {
    for (const action of gridMarketplaceActions) {
      const decision = evaluateGridMarketplaceAccess({ action, entitlement: null, providerReady: true, now: NOW });
      expect(decision).toMatchObject({ allowed: false, reason: "no_entitlement", paymentRequired: true });
    }
  });

  it("lets a verified provider publish, receive requests, and hold payout records", () => {
    for (const action of ["publish_listing", "receive_request", "receive_payout", "browse"] as const) {
      expect(evaluateGridMarketplaceAccess({ action, entitlement: entitlement("grid_provider"), providerReady: true, now: NOW }).allowed).toBe(true);
    }
  });

  it("keeps payment and credential review as separate gates", () => {
    const paidButUnverified = evaluateGridMarketplaceAccess({
      action: "publish_listing",
      entitlement: entitlement("grid_provider"),
      providerReady: false,
      now: NOW,
    });
    expect(paidButUnverified).toMatchObject({ allowed: false, reason: "credential_review_pending", paymentRequired: false });

    // Browsing is not credential-gated, so a paid but unverified provider keeps it.
    expect(evaluateGridMarketplaceAccess({ action: "browse", entitlement: entitlement("grid_provider"), providerReady: false, now: NOW }).allowed).toBe(true);
  });

  it("does not let a credential-verified provider act without a current pass", () => {
    const expired = entitlement("grid_provider", { validUntil: new Date("2026-08-01T00:00:00.000Z") });
    expect(evaluateGridMarketplaceAccess({ action: "receive_request", entitlement: expired, providerReady: true, now: NOW }))
      .toMatchObject({ allowed: false, reason: "entitlement_expired", paymentRequired: true });
  });

  it("confines each tier to the actions its pass covers", () => {
    const clinic = entitlement("clinic_operator");
    expect(evaluateGridMarketplaceAccess({ action: "send_request", entitlement: clinic, now: NOW }).allowed).toBe(true);
    expect(evaluateGridMarketplaceAccess({ action: "list_location", entitlement: clinic, now: NOW }).allowed).toBe(true);
    expect(evaluateGridMarketplaceAccess({ action: "publish_listing", entitlement: clinic, providerReady: true, now: NOW }))
      .toMatchObject({ allowed: false, reason: "capability_not_included" });

    const partner = entitlement("grid_location_partner");
    expect(evaluateGridMarketplaceAccess({ action: "list_location", entitlement: partner, now: NOW }).allowed).toBe(true);
    expect(evaluateGridMarketplaceAccess({ action: "send_request", entitlement: partner, now: NOW }))
      .toMatchObject({ allowed: false, reason: "capability_not_included" });
  });

  it("gives an evaluation pass no marketplace access whatsoever", () => {
    const summary = summarizeGridMarketplaceAccess({ entitlement: entitlement("evaluator_pass"), providerReady: true, now: NOW });
    expect(summary.allowed).toEqual([]);
    expect(summary.paymentRequired).toBe(true);
  });

  it("treats a past-due pass as grace, not access, and points at billing", () => {
    const grace = entitlement("grid_provider", { state: "grace" });
    const decision = evaluateGridMarketplaceAccess({ action: "receive_request", entitlement: grace, providerReady: true, now: NOW });
    expect(decision).toMatchObject({ allowed: false, reason: "entitlement_grace", paymentRequired: true });
  });

  it("does not offer a purchase path out of a revocation", () => {
    const revoked = entitlement("grid_provider", { state: "revoked", revokedAt: new Date("2026-08-05T00:00:00.000Z") });
    expect(evaluateGridMarketplaceAccess({ action: "browse", entitlement: revoked, providerReady: true, now: NOW }))
      .toMatchObject({ allowed: false, reason: "entitlement_revoked", paymentRequired: false });
  });

  it("summarises exactly the actions the guard would allow", () => {
    const summary = summarizeGridMarketplaceAccess({ entitlement: entitlement("grid_provider"), providerReady: false, now: NOW });
    expect(summary.allowed).toEqual(["browse"]);
    expect(summary.credentialReviewPending).toBe(true);
    expect(summary.blocked.map((entry) => entry.action)).toContain("publish_listing");
    for (const blocked of summary.blocked) {
      expect(blocked.remediation.length).toBeGreaterThan(10);
    }
  });
});

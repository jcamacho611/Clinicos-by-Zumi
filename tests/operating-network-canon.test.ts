import { describe, expect, it } from "vitest";
import { KLINIKOS_OPERATING_NETWORK_CANON } from "@/lib/operating-network-canon";

describe("Klinikos operating-network canon", () => {
  it("locks the approved company and experience laws", () => {
    expect(KLINIKOS_OPERATING_NETWORK_CANON.brand).toBe("Klinikos. The clinic operations ecosystem, powered by Zumi.");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.laws).toContain("free-participation-is-distribution-infrastructure");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.laws).toContain("land-without-displacement");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.laws).toContain("founder-omission-does-not-equal-engineering-omission");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.laws).toContain("no-known-failure-disappears-silently");
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

  it("keeps consequential truth states separate", () => {
    expect(KLINIKOS_OPERATING_NETWORK_CANON.truthSeparations).toContain("claim!=verified-fact!=authority");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.truthSeparations).toContain("booking!=fulfillment");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.truthSeparations).toContain("payment-intent!=payment");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.truthSeparations).toContain("deployed!=production-verified");
  });

  it("keeps the surface simple while retaining explicit backend kernel ownership", () => {
    expect(KLINIKOS_OPERATING_NETWORK_CANON.roleSurface.provider).toBe("one-visit");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.roleSurface.patient).toBe("one-next-action");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.roleSurface.owner).toBe("one-operating-picture");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.backendKernels).toContain("identity");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.backendKernels).toContain("grid");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.backendKernels).toContain("financial");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.backendKernels).toContain("reliability");
  });
});

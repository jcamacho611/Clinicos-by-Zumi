import { describe, expect, it } from "vitest";
import { buildStripeCatalogManifest } from "@/lib/commercial/stripe-catalog-manifest";

describe("Stripe catalog verification manifest", () => {
  it("projects environment-neutral lookup keys from current commercial truth", () => {
    const manifest = buildStripeCatalogManifest();

    expect(manifest.length).toBeGreaterThan(0);
    expect(new Set(manifest.map((entry) => entry.lookupKey)).size).toBe(manifest.length);

    for (const entry of manifest) {
      expect(entry.lookupKey).toMatch(/^klinikos_/);
      expect(entry.lookupKey).not.toMatch(/^(price_|prod_|plink_)/);
      expect(entry.currency).toBe("usd");
      expect(entry.pricingVersion).toBeTruthy();
      expect(entry.offerKey).toBeTruthy();
      expect(["one_time", "month", "year"]).toContain(entry.cadence);
    }
  });

  it("keeps exact clinic subscription amounts and recurrence server-owned", () => {
    const manifest = buildStripeCatalogManifest();
    const coreMonthly = manifest.find((entry) => entry.lookupKey === "klinikos_clinic_core_monthly_v1");
    const coreAnnual = manifest.find((entry) => entry.lookupKey === "klinikos_clinic_core_annual_v1");

    expect(coreMonthly).toMatchObject({
      offerKey: "clinic_core",
      amountCents: 99_500,
      cadence: "month",
      recurringInterval: "month",
    });
    expect(coreAnnual).toMatchObject({
      offerKey: "clinic_core",
      amountCents: 1_014_900,
      cadence: "year",
      recurringInterval: "year",
    });
  });

  it("never converts a starting-at implementation anchor into an exact direct price", () => {
    const manifest = buildStripeCatalogManifest();
    const implementation = manifest.find(
      (entry) => entry.lookupKey === "klinikos_founding_implementation_starting_v1",
    );

    expect(implementation).toMatchObject({
      offerKey: "founding_clinic_implementation",
      treatment: "private_quoted",
      amountCents: null,
      publicLinkEligible: false,
      recurringInterval: null,
    });
  });
});

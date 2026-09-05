import { describe, expect, it } from "vitest";
import { commercialProducts } from "@/lib/commercial/product-catalog";

const allowed = new Set([
  "ACTIVE_PUBLIC",
  "ACTIVE_PRIVATE",
  "LEGACY_QUOTED",
  "GRANDFATHERED",
  "TARGET",
  "SCENARIO",
  "RETIRED",
]);

describe("commercial pricing status", () => {
  it("classifies every offer using the Master Canon pricing vocabulary", () => {
    expect(commercialProducts.length).toBeGreaterThan(0);
    for (const product of commercialProducts) {
      expect(allowed.has(product.pricingStatus)).toBe(true);
    }
  });

  it("keeps active public, active private, and retired history distinct", () => {
    expect(commercialProducts.find((product) => product.key === "clinic_core")?.pricingStatus).toBe("ACTIVE_PUBLIC");
    expect(commercialProducts.find((product) => product.key === "clinic_enterprise")?.pricingStatus).toBe("ACTIVE_PRIVATE");
    expect(commercialProducts.find((product) => product.key === "grid_professional")?.pricingStatus).toBe("RETIRED");
  });
});

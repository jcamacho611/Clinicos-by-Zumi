import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  canStartNewCommercialCheckout,
  getCommercialProduct,
} from "@/lib/commercial/product-catalog";

describe("commercial product lifecycle", () => {
  it("keeps current clinic products active and historical aliases evidence-only", () => {
    for (const key of ["operational_audit", "clinic_core", "clinic_growth", "clinic_scale"] as const) {
      const product = getCommercialProduct(key);
      expect(product?.lifecycle).toBe("active");
      expect(product && canStartNewCommercialCheckout(product)).toBe(true);
    }

    for (const key of ["clinic_operator", "grid_professional", "grid_facility"] as const) {
      const product = getCommercialProduct(key);
      expect(product?.lifecycle).toBe("legacy_evidence_only");
      expect(product && canStartNewCommercialCheckout(product)).toBe(false);
    }
  });

  it("blocks non-direct offers before checkout intent persistence", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src/lib/commercial/checkout-service.ts"), "utf8");
    const guard = source.indexOf("canStartDirectCommercialCheckout(product)");
    const persistence = source.indexOf("createCommercialCheckoutIntent({");

    expect(guard).toBeGreaterThan(-1);
    expect(persistence).toBeGreaterThan(-1);
    expect(guard).toBeLessThan(persistence);
    expect(source).toContain("requires its governed sales or qualification path and cannot start a direct checkout");
  });
});

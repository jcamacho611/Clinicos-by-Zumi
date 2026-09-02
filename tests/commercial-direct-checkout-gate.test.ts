import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  canStartDirectCommercialCheckout,
  getCommercialProduct,
} from "@/lib/commercial/product-catalog";

function requireOffer(key: string) {
  const offer = getCommercialProduct(key);
  expect(offer, `missing offer ${key}`).toBeDefined();
  return offer!;
}

describe("governed direct commercial checkout", () => {
  it("allows the fixed $500 Clinic Operating Analysis direct checkout path", () => {
    expect(canStartDirectCommercialCheckout(requireOffer("operational_audit"))).toBe(true);
  });

  it("blocks qualified, starting-at, recurring-reviewed, enterprise, and historical offers from blind direct checkout", () => {
    for (const key of [
      "implementation_blueprint",
      "founding_clinic_implementation",
      "clinic_core",
      "clinic_growth",
      "clinic_scale",
      "clinic_enterprise",
      "clinic_operator",
      "grid_professional",
      "grid_facility",
    ]) {
      expect(canStartDirectCommercialCheckout(requireOffer(key)), key).toBe(false);
    }
  });

  it("keeps the real checkout service bound to the direct-checkout gate", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src/lib/commercial/checkout-service.ts"), "utf8");
    expect(source).toContain("canStartDirectCommercialCheckout");
    expect(source).toContain("if (!canStartDirectCommercialCheckout(product))");
  });
});

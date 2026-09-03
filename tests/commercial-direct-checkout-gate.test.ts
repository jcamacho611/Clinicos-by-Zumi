import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  canStartDirectCommercialCheckout,
  commercialProducts,
  getCommercialProduct,
} from "@/lib/commercial/product-catalog";

function requireOffer(key: string) {
  const offer = getCommercialProduct(key);
  expect(offer, `missing offer ${key}`).toBeDefined();
  return offer!;
}

describe("governed direct commercial checkout", () => {
  it("blocks the retired $500 Clinic Operating Analysis from new direct checkout", () => {
    const audit = requireOffer("operational_audit");
    expect(audit.lifecycle).toBe("retired");
    expect(audit.publicPurchasable).toBe(false);
    expect(audit.directPublicCheckoutEligible).toBe(false);
    expect(canStartDirectCommercialCheckout(audit)).toBe(false);
  });

  it("blocks every currently registered non-direct or historical offer from blind direct checkout", () => {
    for (const offer of commercialProducts) {
      expect(canStartDirectCommercialCheckout(offer), offer.key).toBe(false);
    }
  });

  it("keeps the real checkout service bound to the direct-checkout gate", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src/lib/commercial/checkout-service.ts"), "utf8");
    expect(source).toContain("canStartDirectCommercialCheckout");
    expect(source).toContain("if (!canStartDirectCommercialCheckout(product))");
  });
});

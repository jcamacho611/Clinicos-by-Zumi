import { describe, expect, it } from "vitest";
import {
  accessPaymentReferenceSchema,
  accessPaymentVerificationSchema,
  canTransitionAccessPayment,
  createAccessPaymentSchema,
  derivePortalAccess,
  manualVerificationRequiresReference,
  paymentGrantsAccess,
  summarizeAccessPayment,
  verificationTargetStatus,
} from "@/lib/commerce/access-payment-rules";
import {
  accessProductCatalog,
  accessProductCatalogView,
  checkoutLinkForProduct,
  getAccessProduct,
  productEnvVar,
} from "@/lib/commerce/access-product-catalog";

describe("marketplace product catalog", () => {
  it("prices every product on the server, above zero", () => {
    for (const product of accessProductCatalog) {
      expect(product.amountCents).toBeGreaterThan(0);
      expect(product.currency).toBe("USD");
    }
  });

  it("states what every product does not include", () => {
    for (const product of accessProductCatalog) {
      expect(product.doesNotInclude.length).toBeGreaterThan(0);
    }
  });

  it("derives each product's environment variable from its key", () => {
    expect(productEnvVar("contractor_application_review")).toBe("WHOP_PRODUCTS_CONTRACTOR_APPLICATION_REVIEW");
  });

  it("treats a product with no configured link as not purchasable", () => {
    const product = getAccessProduct("room_listing_review")!;
    expect(checkoutLinkForProduct(product, {})).toBeNull();
    expect(checkoutLinkForProduct(product, { WHOP_PRODUCTS_ROOM_LISTING_REVIEW: "https://whop.com/checkout/x" })).toBe("https://whop.com/checkout/x");
  });

  it("marks purchasability per product in the catalog view", () => {
    const view = accessProductCatalogView({ WHOP_PRODUCTS_AI_CONSULTING_CALL: "https://whop.com/checkout/y" });
    expect(view.find((entry) => entry.key === "ai_consulting_call")?.purchasable).toBe(true);
    expect(view.find((entry) => entry.key === "founding_clinic_seat")?.purchasable).toBe(false);
  });
});

describe("access payment lifecycle", () => {
  it("allows the expected forward transitions", () => {
    expect(canTransitionAccessPayment("created", "pending_verification")).toBe(true);
    expect(canTransitionAccessPayment("pending_verification", "verified_paid")).toBe(true);
    expect(canTransitionAccessPayment("verified_paid", "refunded")).toBe(true);
  });

  it("never returns a refunded payment to paid", () => {
    expect(canTransitionAccessPayment("refunded", "verified_paid")).toBe(false);
    expect(canTransitionAccessPayment("refunded", "reconciled")).toBe(false);
  });

  it("rejects unknown statuses instead of allowing them through", () => {
    expect(canTransitionAccessPayment("invented", "verified_paid")).toBe(false);
    expect(canTransitionAccessPayment("created", "granted")).toBe(false);
  });

  it("maps each administrator action to its target status", () => {
    expect(verificationTargetStatus("verify")).toBe("verified_paid");
    expect(verificationTargetStatus("refund")).toBe("refunded");
    expect(verificationTargetStatus("hold")).toBe("held");
  });
});

describe("portal access derivation", () => {
  it("does not open a portal on payment alone when human review is required", () => {
    expect(derivePortalAccess({ status: "verified_paid", productKey: "contractor_application_review" })).toBe("pending");
    expect(derivePortalAccess({ status: "verified_paid", productKey: "contractor_application_review", reviewApproved: true })).toBe("granted");
  });

  it("opens a portal on payment for a product that carries no review gate", () => {
    expect(derivePortalAccess({ status: "verified_paid", productKey: "ai_consulting_call" })).toBe("granted");
  });

  it("revokes access when money moves back out", () => {
    expect(derivePortalAccess({ status: "refunded", productKey: "ai_consulting_call", reviewApproved: true })).toBe("revoked");
    expect(derivePortalAccess({ status: "disputed", productKey: "ai_consulting_call", reviewApproved: true })).toBe("revoked");
  });

  it("suspends rather than revokes while a payment is held or failed", () => {
    expect(derivePortalAccess({ status: "held", productKey: "ai_consulting_call", reviewApproved: true })).toBe("suspended");
    expect(derivePortalAccess({ status: "failed", productKey: "ai_consulting_call", reviewApproved: true })).toBe("suspended");
  });

  it("grants nothing for an unrecognised product", () => {
    expect(derivePortalAccess({ status: "verified_paid", productKey: "not_a_product", reviewApproved: true })).toBe("pending");
  });

  it("requires both the derived grant and the stored access status to agree", () => {
    const paid = { status: "verified_paid", productKey: "ai_consulting_call" };
    expect(paymentGrantsAccess(paid)).toBe(true);
    expect(paymentGrantsAccess({ ...paid, portalAccessStatus: "revoked" })).toBe(false);
    expect(paymentGrantsAccess({ ...paid, portalAccessStatus: "granted" })).toBe(true);
  });

  it("summarises the outstanding review and the disclaimers together", () => {
    const summary = summarizeAccessPayment({ status: "verified_paid", productKey: "room_listing_review" });
    expect(summary.access).toBe("pending");
    expect(summary.awaitingHumanReview).toBe(true);
    expect(summary.portalPath).toBeNull();
    expect(summary.doesNotInclude.length).toBeGreaterThan(0);
  });
});

describe("purchase input validation", () => {
  it("refuses a client-supplied price", () => {
    const parsed = createAccessPaymentSchema.parse({
      productKey: "founding_clinic_seat",
      buyerEmail: "buyer@example.test",
      acceptedTerms: true,
      // A caller may send these; they must not survive into the parsed order.
      amountCents: 1,
      currency: "USD",
    } as Record<string, unknown>);
    expect(parsed).not.toHaveProperty("amountCents");
    expect(parsed).not.toHaveProperty("currency");
  });

  it("requires a known product and explicit acceptance", () => {
    expect(createAccessPaymentSchema.safeParse({ productKey: "made_up", buyerEmail: "a@b.co", acceptedTerms: true }).success).toBe(false);
    expect(createAccessPaymentSchema.safeParse({ productKey: "seller_listing_review", buyerEmail: "a@b.co", acceptedTerms: false }).success).toBe(false);
  });

  it("normalises the buyer email", () => {
    const parsed = createAccessPaymentSchema.parse({ productKey: "seller_listing_review", buyerEmail: " Buyer@Example.Test ", acceptedTerms: true });
    expect(parsed.buyerEmail).toBe("buyer@example.test");
  });

  it("requires a substantive note on every administrator decision", () => {
    expect(accessPaymentVerificationSchema.safeParse({ paymentId: "pay_1", action: "verify", note: "ok" }).success).toBe(false);
    expect(accessPaymentVerificationSchema.safeParse({ paymentId: "pay_1", action: "verify", note: "Confirmed against the Whop invoice." }).success).toBe(true);
  });

  it("requires a reference before a manual payment can be called settled", () => {
    expect(manualVerificationRequiresReference("verify", "manual")).toBe(true);
    expect(manualVerificationRequiresReference("verify", "whop")).toBe(false);
    expect(manualVerificationRequiresReference("fail", "manual")).toBe(false);
  });

  it("validates a buyer-submitted reference", () => {
    expect(accessPaymentReferenceSchema.safeParse({ buyerEmail: "a@b.co", externalPaymentReference: "inv_123" }).success).toBe(true);
    expect(accessPaymentReferenceSchema.safeParse({ buyerEmail: "a@b.co", externalPaymentReference: "x" }).success).toBe(false);
  });
});

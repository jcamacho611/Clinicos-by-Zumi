import { describe, expect, it } from "vitest";
import { allocateFundedUsage, evaluateCustomerFundedAccess } from "@/lib/commercial/customer-funded-access";
import { goDaddyPaymentConnector } from "@/lib/commercial/payment-connectors/godaddy";
import { canStartNewCommercialCheckout, getCommercialProduct, resolveCommercialCheckoutAmount } from "@/lib/commercial/product-catalog";
import { evaluateSalesAuditQualification, salesAuditQualificationSchema } from "@/lib/sales-audit-rules";

describe("Klinikos commercial truth", () => {
  it("allocates customer-backed variable usage in allowance, prepaid, then authorized-overage order", () => {
    expect(allocateFundedUsage(1_000, {
      includedAllowanceRemainingCents: 250,
      prepaidBalanceCents: 500,
      authorizedOverageRemainingCents: 500,
    })).toEqual({
      allocations: [
        { source: "included_allowance", amountCents: 250 },
        { source: "prepaid_balance", amountCents: 500 },
        { source: "authorized_overage", amountCents: 250 },
      ],
      shortfallCents: 0,
    });
  });

  it("refuses unfunded vendor spend even when the subscription is paid", () => {
    const decision = evaluateCustomerFundedAccess({
      subscriptionStatus: "active",
      paymentConfirmed: true,
      entitlements: ["grid"],
      includedAllowanceRemainingCents: 100,
      prepaidBalanceCents: 0,
      authorizedOverageRemainingCents: 0,
      demoMode: false,
      syntheticDataOnly: false,
    }, {
      capability: "maps.route_matrix",
      requiredEntitlement: "grid",
      estimatedVariableCostCents: 250,
      costBucket: "maps",
    });

    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.reason).toBe("funds_required");
      expect(decision.shortfallCents).toBe(150);
    }
  });

  it("never lets payment override a policy block", () => {
    const decision = evaluateCustomerFundedAccess({
      subscriptionStatus: "active",
      paymentConfirmed: true,
      entitlements: ["grid"],
      includedAllowanceRemainingCents: 100_000,
      prepaidBalanceCents: 100_000,
      authorizedOverageRemainingCents: 100_000,
      demoMode: false,
      syntheticDataOnly: false,
    }, {
      capability: "regulated.action",
      requiredEntitlement: "grid",
      estimatedVariableCostCents: 1,
      policyBlocked: true,
    });

    expect(decision).toMatchObject({ allowed: false, reason: "policy_blocked" });
  });

  it("keeps the operational audit separate from production software activation", () => {
    const product = getCommercialProduct("operational_audit");
    expect(product?.label).toBe("Clinic Operating Analysis");
    expect(product?.priceCents).toBe(50_000);
    expect(product?.lifecycle).toBe("active");
    expect(canStartNewCommercialCheckout(product!)).toBe(true);
    expect(product?.modules).toEqual([]);
    expect(product?.postPurchaseBoundary).toMatch(/does not activate production software/i);
  });

  it("keeps obsolete Grid processor products readable but blocks them from new checkout", () => {
    const professional = getCommercialProduct("grid_professional");
    const facility = getCommercialProduct("grid_facility");

    expect(professional).toMatchObject({
      priceCents: 3_900,
      lifecycle: "legacy_evidence_only",
      publicPurchasable: false,
    });
    expect(facility).toMatchObject({
      priceCents: 9_900,
      lifecycle: "legacy_evidence_only",
      publicPurchasable: false,
    });
    expect(professional?.label).toMatch(/legacy Whop evidence/i);
    expect(facility?.label).toMatch(/legacy Whop evidence/i);
    expect(canStartNewCommercialCheckout(professional!)).toBe(false);
    expect(canStartNewCommercialCheckout(facility!)).toBe(false);
  });

  it("refuses to pair a fixed checkout link with a conflicting recorded amount", () => {
    const product = getCommercialProduct("operational_audit");
    expect(product).toBeTruthy();
    expect(resolveCommercialCheckoutAmount(product!, 50_000)).toBe(50_000);
    expect(() => resolveCommercialCheckoutAmount(product!, 75_000)).toThrow(/server-owned price/i);
  });

  it("treats GoDaddy as checkout-only until independently reconciled", async () => {
    const status = goDaddyPaymentConnector.status();
    expect(status.checkoutConfigured).toBe(true);
    expect(status.webhookConfigured).toBe(false);
    expect(status.processorVerification).toBe(false);

    const product = getCommercialProduct("operational_audit");
    expect(product).toBeTruthy();
    const checkout = await goDaddyPaymentConnector.createCheckout?.({
      product: product!,
      organizationId: "org-test",
      email: "buyer@example.com",
      state: "state-test",
      returnUrl: "https://klinikos.io/payments/success",
    });
    expect(checkout?.checkoutUrl).toMatch(/^https:\/\/.+paylinks\.godaddy\.com\/?$/);
    expect(checkout?.processorVerificationAvailable).toBe(false);
  });

  it("requires an auditable buyer email before an operational-audit checkout can be created", () => {
    const base = {
      clinic: "Brooklyn Family Medicine",
      decisionMaker: "Owner",
      locations: 1,
      providers: 3,
      staff: 5,
      encounters: 100,
      revenueBand: "500k-1m",
      insuranceMix: "mixed",
      billing: "internal",
      monthlyTech: 2_000,
      knownLeakage: 5_000,
      ehr: "existing",
      biggestPain: "follow-up",
      afterHours: 12,
      referrals: true,
      labs: true,
      claims: true,
      multiLocation: false,
    } as const;

    expect(salesAuditQualificationSchema.safeParse(base).success).toBe(false);
    expect(salesAuditQualificationSchema.safeParse({ ...base, email: "buyer@clinic.example" }).success).toBe(true);
  });

  it("derives qualification score, status, and audit price from server-owned rules", () => {
    const parsed = salesAuditQualificationSchema.parse({
      clinic: "Brooklyn Family Medicine",
      decisionMaker: "Owner",
      email: "buyer@clinic.example",
      locations: 1,
      providers: 3,
      staff: 5,
      encounters: 100,
      revenueBand: "500k-1m",
      insuranceMix: "mixed",
      billing: "internal",
      monthlyTech: 2_000,
      knownLeakage: 5_000,
      ehr: "existing",
      biggestPain: "follow-up",
      afterHours: 12,
      referrals: true,
      labs: true,
      claims: true,
      multiLocation: false,
      score: 100,
      status: "QUALIFIED",
      auditPrice: 1,
    });

    expect(parsed).not.toHaveProperty("score");
    expect(parsed).not.toHaveProperty("status");
    expect(parsed).not.toHaveProperty("auditPrice");

    const evaluated = evaluateSalesAuditQualification(parsed);
    expect(evaluated.score).toBeGreaterThanOrEqual(70);
    expect(evaluated.status).toBe("QUALIFIED");
    expect(evaluated.auditPrice).toBe(500);
  });
});

import { describe, expect, it, vi } from "vitest";
import { getStripeCommercialProjection } from "@/lib/commercial/stripe-commercial-projection";
import {
  StripeCanonicalPriceError,
  resolveCanonicalStripePrice,
} from "@/lib/commercial/stripe-price-resolver";

function stripePrice(overrides: Record<string, unknown> = {}) {
  return {
    id: "price_test_environment_specific",
    object: "price",
    active: true,
    currency: "usd",
    unit_amount: 99_500,
    lookup_key: "klinikos_clinic_core_monthly_v1",
    livemode: false,
    recurring: { interval: "month", interval_count: 1, usage_type: "licensed" },
    metadata: {
      klinikos_product_key: "clinic_core",
      klinikos_pricing_version: "2026-09-01.v1",
    },
    ...overrides,
  };
}

function clientWith(prices: unknown[]) {
  return {
    prices: {
      list: vi.fn().mockResolvedValue({ object: "list", data: prices, has_more: false }),
    },
  };
}

describe("canonical Stripe price resolver", () => {
  it("resolves the environment-specific Stripe Price ID only after lookup-key and canonical value verification", async () => {
    const projection = getStripeCommercialProjection("clinic_core", "month");
    expect(projection).toBeDefined();
    const client = clientWith([stripePrice()]);

    const result = await resolveCanonicalStripePrice(client, projection!);

    expect(client.prices.list).toHaveBeenCalledWith({
      active: true,
      lookup_keys: ["klinikos_clinic_core_monthly_v1"],
      limit: 2,
    });
    expect(result).toEqual({
      priceId: "price_test_environment_specific",
      lookupKey: "klinikos_clinic_core_monthly_v1",
      amountCents: 99_500,
      currency: "usd",
      cadence: "month",
    });
  });

  it("fails closed when the canonical projection has no reusable lookup key or exact amount", async () => {
    const projection = getStripeCommercialProjection("founding_clinic_implementation", "one_time");
    expect(projection).toBeDefined();

    await expect(resolveCanonicalStripePrice(clientWith([]), projection!)).rejects.toThrow(
      new StripeCanonicalPriceError("This Klinikos commercial offer does not have an exact reusable Stripe price."),
    );
  });

  it("fails closed when Stripe returns zero or multiple active prices for one canonical lookup key", async () => {
    const projection = getStripeCommercialProjection("clinic_core", "month")!;

    await expect(resolveCanonicalStripePrice(clientWith([]), projection)).rejects.toThrow(
      "Stripe does not contain exactly one active price for the canonical Klinikos lookup key.",
    );
    await expect(resolveCanonicalStripePrice(clientWith([stripePrice(), stripePrice({ id: "price_duplicate" })]), projection)).rejects.toThrow(
      "Stripe does not contain exactly one active price for the canonical Klinikos lookup key.",
    );
  });

  it("rejects amount, currency, cadence, lookup-key, product-key, or pricing-version mismatch", async () => {
    const projection = getStripeCommercialProjection("clinic_core", "month")!;
    const invalidPrices = [
      stripePrice({ unit_amount: 99_501 }),
      stripePrice({ currency: "eur" }),
      stripePrice({ recurring: { interval: "year", interval_count: 1, usage_type: "licensed" } }),
      stripePrice({ lookup_key: "klinikos_wrong" }),
      stripePrice({ metadata: { klinikos_product_key: "clinic_growth", klinikos_pricing_version: "2026-09-01.v1" } }),
      stripePrice({ metadata: { klinikos_product_key: "clinic_core", klinikos_pricing_version: "old" } }),
    ];

    for (const price of invalidPrices) {
      await expect(resolveCanonicalStripePrice(clientWith([price]), projection)).rejects.toThrow(
        "Stripe price does not match canonical Klinikos commercial truth.",
      );
    }
  });

  it("accepts different test/live Stripe object IDs when the canonical lookup key and values are identical", async () => {
    const projection = getStripeCommercialProjection("operational_audit", "one_time")!;
    const client = clientWith([
      stripePrice({
        id: "price_live_or_test_can_differ",
        unit_amount: 50_000,
        lookup_key: "klinikos_operational_audit_one_time_v1",
        recurring: null,
        metadata: {
          klinikos_product_key: "operational_audit",
          klinikos_pricing_version: "2026-09-01.v1",
        },
      }),
    ]);

    await expect(resolveCanonicalStripePrice(client, projection)).resolves.toMatchObject({
      priceId: "price_live_or_test_can_differ",
      amountCents: 50_000,
      cadence: "one_time",
    });
  });

  it("does not expose upstream Stripe error details through its public error message", async () => {
    const projection = getStripeCommercialProjection("clinic_core", "month")!;
    const client = {
      prices: {
        list: vi.fn().mockRejectedValue(new Error("sk_live_secret_like_detail request id req_123")),
      },
    };

    await expect(resolveCanonicalStripePrice(client, projection)).rejects.toMatchObject({
      publicMessage: "Stripe pricing is temporarily unavailable.",
    });
  });
});

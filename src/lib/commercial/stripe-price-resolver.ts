import "server-only";

import type {
  StripeCommercialCadence,
  StripeCommercialProjection,
} from "@/lib/commercial/stripe-commercial-projection";

export class StripeCanonicalPriceError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
    this.name = "StripeCanonicalPriceError";
  }

  get publicMessage() {
    return this.message;
  }
}

type StripePriceRecord = {
  id: string;
  active?: boolean;
  currency?: string | null;
  unit_amount?: number | null;
  lookup_key?: string | null;
  recurring?: {
    interval?: string | null;
    interval_count?: number | null;
  } | null;
  metadata?: Record<string, string> | null;
};

type StripePriceLookupClient = {
  prices: {
    list(params: {
      active: true;
      lookup_keys: string[];
      limit: 2;
    }): Promise<{ data: StripePriceRecord[] }>;
  };
};

export type ResolvedCanonicalStripePrice = {
  priceId: string;
  lookupKey: string;
  amountCents: number;
  currency: "usd";
  cadence: StripeCommercialCadence;
};

function cadenceMatches(price: StripePriceRecord, cadence: StripeCommercialCadence) {
  if (cadence === "one_time") return price.recurring == null;
  return price.recurring?.interval === cadence && (price.recurring.interval_count ?? 1) === 1;
}

function matchesCanonicalProjection(price: StripePriceRecord, projection: StripeCommercialProjection) {
  return (
    price.active !== false &&
    price.lookup_key === projection.lookupKey &&
    price.unit_amount === projection.amountCents &&
    price.currency?.toLowerCase() === projection.currency &&
    cadenceMatches(price, projection.cadence) &&
    price.metadata?.klinikos_product_key === projection.offerKey &&
    price.metadata?.klinikos_pricing_version === projection.pricingVersion
  );
}

export async function resolveCanonicalStripePrice(
  client: StripePriceLookupClient,
  projection: StripeCommercialProjection,
): Promise<ResolvedCanonicalStripePrice> {
  if (!projection.lookupKey || projection.amountCents === null) {
    throw new StripeCanonicalPriceError(
      "This Klinikos commercial offer does not have an exact reusable Stripe price.",
    );
  }

  let prices: StripePriceRecord[];
  try {
    const response = await client.prices.list({
      active: true,
      lookup_keys: [projection.lookupKey],
      limit: 2,
    });
    prices = response.data;
  } catch {
    throw new StripeCanonicalPriceError("Stripe pricing is temporarily unavailable.", 503);
  }

  if (prices.length !== 1) {
    throw new StripeCanonicalPriceError(
      "Stripe does not contain exactly one active price for the canonical Klinikos lookup key.",
      503,
    );
  }

  const [price] = prices;
  if (!matchesCanonicalProjection(price, projection)) {
    throw new StripeCanonicalPriceError(
      "Stripe price does not match canonical Klinikos commercial truth.",
      503,
    );
  }

  return {
    priceId: price.id,
    lookupKey: projection.lookupKey,
    amountCents: projection.amountCents,
    currency: projection.currency,
    cadence: projection.cadence,
  };
}

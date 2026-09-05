import "server-only";

import {
  stripeCommercialProjections,
  type StripeCommercialCadence,
  type StripeCommercialTreatment,
} from "@/lib/commercial/stripe-commercial-projection";
import type { CommercialProductKey } from "@/lib/commercial/product-catalog";

export type StripeCatalogManifestEntry = {
  offerKey: CommercialProductKey;
  pricingVersion: string;
  treatment: StripeCommercialTreatment;
  cadence: StripeCommercialCadence;
  currency: "usd";
  amountCents: number | null;
  lookupKey: string;
  publicLinkEligible: boolean;
  automaticCollection: boolean;
  recurringInterval: "month" | "year" | null;
};

function recurringIntervalFor(cadence: StripeCommercialCadence) {
  if (cadence === "month" || cadence === "year") return cadence;
  return null;
}

/**
 * Environment-neutral Stripe catalog contract.
 *
 * This manifest projects current server-owned commercial truth into the minimum
 * information needed to verify a Stripe catalog. It deliberately contains no
 * environment-specific Stripe product, price, payment-link, customer, or account IDs.
 */
export function buildStripeCatalogManifest(): readonly StripeCatalogManifestEntry[] {
  const entries = stripeCommercialProjections.flatMap((projection) => {
    if (!projection.lookupKey) return [];
    return [{
      offerKey: projection.offerKey,
      pricingVersion: projection.pricingVersion,
      treatment: projection.treatment,
      cadence: projection.cadence,
      currency: projection.currency,
      amountCents: projection.amountCents,
      lookupKey: projection.lookupKey,
      publicLinkEligible: projection.publicLinkEligible,
      automaticCollection: projection.automaticCollection,
      recurringInterval: recurringIntervalFor(projection.cadence),
    } satisfies StripeCatalogManifestEntry];
  });

  const lookupKeys = entries.map((entry) => entry.lookupKey);
  if (new Set(lookupKeys).size !== lookupKeys.length) {
    throw new Error("Stripe catalog manifest lookup keys must be unique.");
  }

  return Object.freeze(entries);
}

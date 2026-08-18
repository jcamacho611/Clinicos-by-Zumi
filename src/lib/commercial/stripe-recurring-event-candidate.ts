import type Stripe from "stripe";

const KLINIKOS_METADATA_KEYS = [
  "klinikos_checkout_intent_id",
  "klinikos_checkout_state",
  "klinikos_product_key",
] as const;

type InvoiceCandidateShape = {
  parent?: { subscription_details?: { metadata?: Record<string, string> | null } | null } | null;
  subscription_details?: { metadata?: Record<string, string> | null } | null;
};

type SubscriptionCandidateShape = { metadata?: Record<string, string> | null };

function hasAnyKlinikosKey(metadata: Record<string, string> | null | undefined) {
  return Boolean(metadata && KLINIKOS_METADATA_KEYS.some((key) => typeof metadata[key] === "string" && metadata[key].trim()));
}

/**
 * Distinguish unrelated Stripe account events from malformed Klinikos recurring
 * events. Unrelated events are acknowledged/ignored; an event carrying any Klinikos
 * recurring correlation key is treated as ours and must pass the full fail-closed
 * normalizer/processor.
 */
export function isKlinikosRecurringStripeEventCandidate(event: Stripe.Event) {
  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    const invoice = event.data.object as unknown as InvoiceCandidateShape;
    return hasAnyKlinikosKey(invoice.parent?.subscription_details?.metadata)
      || hasAnyKlinikosKey(invoice.subscription_details?.metadata);
  }
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as unknown as SubscriptionCandidateShape;
    return hasAnyKlinikosKey(subscription.metadata);
  }
  return false;
}

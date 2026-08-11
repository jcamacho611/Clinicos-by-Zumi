import { auditPriceForAnswers } from "@/lib/sales/zumi-command";
import type { ScaleBand } from "@/lib/growth/lead-rules";

/**
 * Operational Audit checkout.
 *
 * The audit is the first thing a clinic can actually buy, and it is deliberately
 * useful whether or not they go on to run Klinikos — a review that only pays off if
 * you buy the software is a sales call with an invoice attached.
 *
 * **Payment verification.** The checkout destination is a hosted payment page. Opening
 * it is not proof of payment and this module never treats it as such: clicking
 * through records intent and nothing more. A human confirms the payment against the
 * payment provider before any audit work begins or any entitlement is granted. There
 * is no code path here that grants access from a redirect.
 *
 * Pure module. No database, no network.
 */

/**
 * Where checkout goes.
 *
 * Configurable so a deployment can point at its own payment page. The default is the
 * Klinikos hosted payment link, which is a public URL rather than a secret — it takes
 * money, it does not grant anything.
 */
const DEFAULT_PAYLINK = "https://f7b959c2-9748-4f7e-9247-7bea69624c5f.paylinks.godaddy.com/";

export function auditCheckoutUrl(env: Record<string, string | undefined> = process.env) {
  return env.KLINIKOS_AUDIT_PAYLINK?.trim() || DEFAULT_PAYLINK;
}

/**
 * Price bands, shown publicly.
 *
 * Published rather than quoted on a call. A clinic that cannot find out what something
 * costs assumes it is expensive and stops reading, and the price genuinely does depend
 * on scale — a five-provider practice is more work to review than a solo one.
 */
export const auditPriceBands: readonly { providers: ScaleBand; label: string; priceUsd: number }[] = [
  { providers: "1", label: "Solo provider", priceUsd: auditPriceForAnswers({ provider_scale: ["1"] }) },
  { providers: "2_5", label: "2–5 providers", priceUsd: auditPriceForAnswers({ provider_scale: ["2_5"] }) },
  { providers: "6_15", label: "6–15 providers", priceUsd: auditPriceForAnswers({ provider_scale: ["6_15"] }) },
  { providers: "16_30", label: "16–30 providers", priceUsd: auditPriceForAnswers({ provider_scale: ["16_30"] }) },
  { providers: "30_plus", label: "30+ providers", priceUsd: auditPriceForAnswers({ provider_scale: ["30_plus"] }) },
];

/** What the audit produces. Deliverables, not adjectives. */
export const auditDeliverables = [
  "A written review of how work actually moves through your clinic today",
  "Lead handling: what arrives, what gets answered, and how fast",
  "Follow-up analysis: what is opened and never closed",
  "Scheduling analysis: no-shows, gaps, and unrecovered cancellations",
  "Revenue leakage review: unbilled encounters, unused packages, missed rebooking",
  "Staff workflow review: what is assigned, what is assumed",
  "Technology stack review: what you pay for, what overlaps, what is replaceable",
  "A prioritised list of changes, ranked by what they are worth",
  "Where Klinikos would and would not help",
] as const;

export const AUDIT_INDEPENDENCE_NOTICE =
  "You receive the findings whether or not you go on to use Klinikos. The review includes where Klinikos would not help.";

/**
 * The sentence that must appear wherever the audit is sold.
 *
 * Opening a payment page is not paying. Making that explicit at the point of purchase
 * is both honest and practical: it sets the expectation that a person will be in
 * touch, rather than that a portal will open.
 */
export const AUDIT_PAYMENT_NOTICE =
  "Opening the payment page does not schedule the audit. Klinikos confirms the payment with the payment provider first, then contacts you to arrange the review. Access is never granted by a browser redirect.";

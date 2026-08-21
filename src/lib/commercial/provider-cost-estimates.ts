export type ProviderCostEnv = Record<string, string | undefined>;

function positiveInteger(value: string | undefined) {
  const parsed = Number.parseInt(value?.trim() ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Conservative SMS segment estimate used only to reserve customer-backed funds.
 *
 * Twilio bills SMS by segment and encoding can change segment length. We deliberately
 * treat every message as Unicode (70 chars for one segment, 67 for concatenated
 * segments), which can over-reserve a GSM-7 message but should not under-reserve a
 * Unicode one. This is a funding estimate, never an invoice claim.
 */
export function conservativeSmsSegmentCount(body: string) {
  const length = body.length;
  if (length <= 0) return 0;
  if (length <= 70) return 1;
  return Math.ceil(length / 67);
}

/**
 * Configured reservation amount per SMS segment, in whole cents.
 *
 * The commercial ledger currently reserves integer cents. Provider pricing can be
 * fractional-cent and can change by destination/carrier/traffic class, so production
 * configuration should round UP to a defensible reservation amount. Actual provider
 * cost is reconciled later from trustworthy billing evidence.
 */
export function estimateTwilioSmsReservationCents(body: string, env: ProviderCostEnv = process.env) {
  const centsPerSegment = positiveInteger(env.KLINIKOS_TWILIO_SMS_RESERVATION_CENTS_PER_SEGMENT);
  const segments = conservativeSmsSegmentCount(body);
  if (!centsPerSegment || segments === 0) return null;
  return { estimatedCostCents: centsPerSegment * segments, segments, centsPerSegment };
}

/**
 * Email is usually priced in pooled monthly/volume tiers rather than a provider-returned
 * synchronous per-message charge. This value is therefore a reservation policy, not an
 * assertion of invoice cost. Leave blank to keep customer-funded email execution closed.
 */
export function estimateResendEmailReservationCents(env: ProviderCostEnv = process.env) {
  const estimatedCostCents = positiveInteger(env.KLINIKOS_RESEND_EMAIL_RESERVATION_CENTS_PER_MESSAGE);
  return estimatedCostCents == null ? null : { estimatedCostCents };
}

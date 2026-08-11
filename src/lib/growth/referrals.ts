import { z } from "zod";

/**
 * Referral attribution and partner commission.
 *
 * Partners — billers, consultants, agencies, credentialing firms — sell Klinikos into
 * relationships Klinikos does not have. The accounting has to be defensible, because a
 * partner who suspects they were not credited stops selling immediately and tells the
 * others.
 *
 * Pure module. No database, no network.
 */

/** Codes are case-insensitive and URL-safe: a partner reads theirs down a phone line. */
export const referralCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(4)
  .max(24)
  .regex(/^[A-Z0-9-]+$/, "Referral codes use letters, numbers, and hyphens only.");

export function normalizeReferralCode(code: string) {
  const parsed = referralCodeSchema.safeParse(code);
  return parsed.success ? parsed.data : null;
}

export const partnerStatuses = ["pending", "active", "paused", "terminated"] as const;
export type PartnerStatus = (typeof partnerStatuses)[number];

/** Only an active partner earns. A paused partner keeps attribution already recorded. */
export function partnerCanEarn(status: PartnerStatus) {
  return status === "active";
}

/**
 * How long a referral click keeps crediting the partner.
 *
 * Ninety days, and measured from first touch rather than last. Last-touch would let a
 * partner's credit be taken by whichever channel the prospect happened to arrive
 * through the day they finally bought — usually a direct visit, which nobody earned.
 */
export const ATTRIBUTION_WINDOW_DAYS = 90;

export type AttributionInput = {
  firstTouchAt: Date;
  convertedAt: Date;
  partnerStatus: PartnerStatus;
};

export type AttributionResult =
  | { credited: true; daysToConversion: number }
  | { credited: false; reason: "window_expired" | "partner_inactive" | "converted_before_touch" };

export function evaluateAttribution(input: AttributionInput): AttributionResult {
  if (input.convertedAt < input.firstTouchAt) {
    // A conversion that predates the referral was not caused by it. This happens when
    // an existing customer clicks a partner link, and crediting it would pay for a
    // sale that was already made.
    return { credited: false, reason: "converted_before_touch" };
  }
  if (!partnerCanEarn(input.partnerStatus)) return { credited: false, reason: "partner_inactive" };

  const days = (input.convertedAt.getTime() - input.firstTouchAt.getTime()) / (24 * 60 * 60 * 1000);
  if (days > ATTRIBUTION_WINDOW_DAYS) return { credited: false, reason: "window_expired" };

  return { credited: true, daysToConversion: Math.floor(days) };
}

/**
 * Commission on a sale.
 *
 * Basis points and integer minor units throughout. Commission is money owed to a real
 * person, and floating-point money is how a partner statement ends up off by a cent
 * and the partner ends up off the programme.
 */
export function commissionCents(saleAmountCents: number, rateBasisPoints: number) {
  if (!Number.isInteger(saleAmountCents) || saleAmountCents < 0) {
    throw new Error("Sale amount must be a non-negative integer number of cents.");
  }
  if (!Number.isInteger(rateBasisPoints) || rateBasisPoints < 0 || rateBasisPoints > 10_000) {
    throw new Error("Commission rate must be between 0 and 10000 basis points.");
  }
  // Floor, not round: never pay out more than the agreed rate on a fractional cent.
  return Math.floor((saleAmountCents * rateBasisPoints) / 10_000);
}

export const commissionStatuses = ["pending", "approved", "paid", "reversed"] as const;
export type CommissionStatus = (typeof commissionStatuses)[number];

/**
 * Whether a commission may be paid out yet.
 *
 * A commission is only payable once the underlying sale is settled and past refund
 * risk. Paying on an unsettled charge means clawing money back from a partner, which
 * costs more goodwill than the delay does.
 */
export function commissionPayable(input: {
  status: CommissionStatus;
  saleSettled: boolean;
  refundWindowClosed: boolean;
}) {
  if (input.status !== "approved") return { payable: false as const, reason: `Commission is ${input.status}.` };
  if (!input.saleSettled) return { payable: false as const, reason: "The underlying sale has not settled." };
  if (!input.refundWindowClosed) return { payable: false as const, reason: "The refund window has not closed." };
  return { payable: true as const };
}

export const PARTNER_DISCLOSURE =
  "Klinikos referral partners are paid a commission on sales they introduce. A partner recommendation is a commercial referral, not a clinical or regulatory endorsement of Klinikos.";

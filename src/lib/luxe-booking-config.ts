import "server-only";

const DEFAULT_REVIEW_MINUTES = 30;

export function configuredLuxeBookingUrl() {
  const raw = process.env.LUXE_MEDI_BOOKING_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

export function configuredLuxeBookingReviewMinutes() {
  const parsed = Number.parseInt(process.env.LUXE_MEDI_BOOKING_REVIEW_MINUTES ?? String(DEFAULT_REVIEW_MINUTES), 10);
  if (!Number.isFinite(parsed)) return DEFAULT_REVIEW_MINUTES;
  return Math.max(10, Math.min(24 * 60, parsed));
}

import { z } from "zod";

/**
 * Buying-intent events and lead scoring.
 *
 * The point of this module is to replace cold outreach with warm outreach. A founder
 * should not open a list of a hundred strangers; they should open six clinics that
 * watched the demonstration, returned twice, and started checkout.
 *
 * Two constraints shape everything here:
 *
 *   1. **No PHI, ever.** These events describe a *prospective buyer's* interest in
 *      software. They are recorded on public marketing pages, which are forbidden from
 *      soliciting patient information at all. The event schema has no free-text field
 *      for that reason — a note box is how PHI ends up somewhere it must never be.
 *
 *   2. **First-party only.** Intent is recorded by Klinikos about its own pages. There
 *      is no third-party tracker, no ad-network pixel, and no cross-site identifier.
 *
 * Pure module. No database, no network.
 */

/**
 * The event vocabulary.
 *
 * Closed on purpose. An open string would let a surface invent an event that scores
 * nothing and means nothing, and the scoring table below would silently ignore it.
 */
export const intentEventTypes = [
  "homepage_viewed",
  "how_it_works_viewed",
  "solution_viewed",
  "zumi_page_viewed",
  "demo_started",
  "demo_completed",
  "pricing_viewed",
  "audit_viewed",
  "audit_checkout_clicked",
  "checkout_started",
  "checkout_abandoned",
  "contact_submitted",
  "overview_requested",
  "referral_visit",
  "account_created",
  "payment_completed",
  "onboarding_started",
  "onboarding_completed",
] as const;
export type IntentEventType = (typeof intentEventTypes)[number];

export const intentEventSchema = z.object({
  type: z.enum(intentEventTypes),
  /** Page the event happened on. Path only — never a full URL with query strings. */
  path: z.string().trim().max(200).regex(/^\//, "Path must be site-relative.").nullable().default(null),
  /** Which solution or product the event referred to, when the event names one. */
  subject: z.string().trim().max(80).nullable().default(null),
});

export type IntentEvent = z.infer<typeof intentEventSchema>;

/**
 * Points per event.
 *
 * Weighted by how much money the action is adjacent to, not by how much traffic it
 * generates. Reading the homepage is not evidence of anything; starting checkout is
 * nearly a purchase.
 */
const EVENT_POINTS: Record<IntentEventType, number> = {
  homepage_viewed: 1,
  how_it_works_viewed: 3,
  solution_viewed: 5,
  zumi_page_viewed: 8,
  demo_started: 8,
  demo_completed: 15,
  pricing_viewed: 10,
  audit_viewed: 15,
  audit_checkout_clicked: 20,
  checkout_started: 30,
  // A started-then-abandoned checkout is still the strongest signal on this list.
  // Scoring it negatively would bury the person most worth calling today.
  checkout_abandoned: 0,
  contact_submitted: 25,
  overview_requested: 12,
  referral_visit: 5,
  account_created: 20,
  payment_completed: 0,
  onboarding_started: 0,
  onboarding_completed: 0,
};

export function pointsForEvent(type: IntentEventType) {
  return EVENT_POINTS[type];
}

/** Events after which a prospect is a customer, and intent scoring stops meaning anything. */
const POST_PURCHASE: readonly IntentEventType[] = [
  "payment_completed",
  "onboarding_started",
  "onboarding_completed",
];

export function isPostPurchaseEvent(type: IntentEventType) {
  return POST_PURCHASE.includes(type);
}

export type ScoredEvent = { type: IntentEventType; occurredAt: Date };

export const RETURN_VISIT_POINTS = 10;
export const MAX_SCORE = 100;

/** A gap this long between events counts as the prospect coming back. */
const RETURN_VISIT_GAP_MS = 6 * 60 * 60 * 1000;

/**
 * Score a prospect from their event history.
 *
 * Each event type counts once. Someone who reloads the pricing page eleven times is
 * interested, not eleven times more interested, and letting repeats accumulate would
 * rank a restless browser above a buyer who read it once and started checkout.
 *
 * Coming back on a separate occasion *is* scored, because returning days later is a
 * different signal from scrolling further in one sitting.
 */
export function scoreProspect(events: readonly ScoredEvent[]): number {
  if (events.length === 0) return 0;

  const counted = new Set<IntentEventType>();
  let score = 0;

  for (const event of events) {
    if (counted.has(event.type)) continue;
    counted.add(event.type);
    score += EVENT_POINTS[event.type] ?? 0;
  }

  score += RETURN_VISIT_POINTS * Math.min(3, countReturnVisits(events));

  return Math.min(MAX_SCORE, score);
}

/** Distinct visits, measured as gaps in the event stream rather than by session cookie. */
export function countReturnVisits(events: readonly ScoredEvent[]): number {
  const times = events.map((event) => event.occurredAt.getTime()).sort((a, b) => a - b);
  let visits = 0;
  for (let index = 1; index < times.length; index += 1) {
    if (times[index] - times[index - 1] >= RETURN_VISIT_GAP_MS) visits += 1;
  }
  return visits;
}

export const intentBands = ["cold", "warm", "high", "urgent"] as const;
export type IntentBand = (typeof intentBands)[number];

/**
 * The band decides whether a human gets involved.
 *
 * `urgent` exists to mean one specific thing: this person tried to buy and did not
 * finish. That is the only state where a same-day personal contact is clearly worth
 * the founder's time.
 */
export function intentBand(score: number, events: readonly ScoredEvent[]): IntentBand {
  const types = new Set(events.map((event) => event.type));
  const startedCheckout = types.has("checkout_started") || types.has("audit_checkout_clicked");
  const purchased = events.some((event) => isPostPurchaseEvent(event.type));

  if (!purchased && startedCheckout) return "urgent";
  if (score >= 60) return "high";
  if (score >= 25) return "warm";
  return "cold";
}

export const bandGuidance: Record<IntentBand, string> = {
  urgent: "Started checkout and did not finish. Contact personally today.",
  high: "Strong repeated interest. Worth a personal message this week.",
  warm: "Engaged but not yet close. Keep the follow-up sequence running.",
  cold: "Early interest only. Nothing to do beyond the sequence.",
};

/**
 * The prospects a founder should actually contact.
 *
 * Deliberately capped. A list of forty "high intent" leads is a list nobody works;
 * the point of scoring is to produce a number of calls a person can make today.
 */
export function prioritizeForOutreach<T extends { score: number; band: IntentBand }>(prospects: readonly T[], limit = 10) {
  const rank: Record<IntentBand, number> = { urgent: 0, high: 1, warm: 2, cold: 3 };
  return [...prospects]
    .filter((prospect) => prospect.band === "urgent" || prospect.band === "high")
    .sort((a, b) => rank[a.band] - rank[b.band] || b.score - a.score)
    .slice(0, limit);
}

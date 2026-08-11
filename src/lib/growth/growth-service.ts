import "server-only";

import { db } from "@/lib/db";
import { advanceStatus, type ProspectStatus } from "@/lib/growth/lead-rules";
import { intentBand, scoreProspect, type IntentEventType, type ScoredEvent } from "@/lib/growth/intent";
import { normalizeReferralCode } from "@/lib/growth/referrals";
import { sequenceForStatus } from "@/lib/growth/sequences";

/**
 * Growth Engine persistence.
 *
 * The one place prospect state is written. Score, band, and status are all
 * *recomputed here from stored events* rather than accepted from a caller — a
 * marketing page that could post its own lead score would be a marketing page that
 * could put itself at the top of the founder's call list.
 */

/** Events kept per prospect when scoring. Enough for the signal, bounded for the query. */
const EVENT_WINDOW = 200;

async function recomputeProspect(prospectId: string) {
  const rows = await db.growthIntentEvent.findMany({
    where: { prospectId },
    select: { eventType: true, occurredAt: true },
    orderBy: { occurredAt: "desc" },
    take: EVENT_WINDOW,
  });

  const events: ScoredEvent[] = rows.map((row) => ({
    type: row.eventType as IntentEventType,
    occurredAt: row.occurredAt,
  }));

  const score = scoreProspect(events);
  const band = intentBand(score, events);
  return { score, band };
}

/**
 * Record an intent event.
 *
 * Accepts an anonymous visitor id so intent can be collected before someone
 * identifies themselves, and stitched to a prospect when they do. The visitor id is
 * first-party and pseudonymous: it identifies a browser to Klinikos and to nothing
 * else.
 */
export async function recordIntentEvent(input: {
  eventType: IntentEventType;
  path: string | null;
  subject: string | null;
  visitorId: string | null;
  prospectId?: string | null;
}) {
  await db.growthIntentEvent.create({
    data: {
      eventType: input.eventType,
      path: input.path,
      subject: input.subject,
      visitorId: input.visitorId,
      prospectId: input.prospectId ?? null,
    },
  });

  if (!input.prospectId) return null;

  const prospect = await db.growthProspect.findUnique({
    where: { id: input.prospectId },
    select: { status: true },
  });
  if (!prospect) return null;

  const { score, band } = await recomputeProspect(input.prospectId);
  const status = advanceStatus(prospect.status as ProspectStatus, input.eventType);

  const updated = await db.growthProspect.update({
    where: { id: input.prospectId },
    data: { score, band, status, lastActivityAt: new Date() },
    select: { id: true, status: true, score: true, band: true },
  });

  await reconcileSequence(updated.id, updated.status as ProspectStatus);
  return updated;
}

/**
 * Put a prospect on the one sequence their status calls for.
 *
 * Enrolling in a second sequence would mean two emails on the same morning, which
 * reads as a system that has lost track of them. Existing enrolments are left in
 * place rather than reset, so a returning prospect does not receive step one again.
 */
async function reconcileSequence(prospectId: string, status: ProspectStatus) {
  const sequenceKey = sequenceForStatus(status);
  if (!sequenceKey) return;

  await db.growthSequenceEnrollment.upsert({
    where: { prospectId_sequenceKey: { prospectId, sequenceKey } },
    create: { prospectId, sequenceKey },
    update: {},
  });
}

/**
 * Create or update a prospect from a public capture form.
 *
 * Upserts on email. Someone who fills the form twice is one prospect with better
 * information, not two rows competing for the same follow-up.
 */
export async function captureProspect(input: {
  email: string;
  contactName: string;
  clinicName: string;
  phone?: string;
  website?: string;
  clinicType: string;
  locationCount: string;
  providerCount: string;
  interest: string;
  referralCode?: string;
  visitorId: string | null;
}) {
  const referralCode = input.referralCode ? normalizeReferralCode(input.referralCode) : null;

  const prospect = await db.growthProspect.upsert({
    where: { email: input.email },
    create: {
      email: input.email,
      contactName: input.contactName,
      clinicName: input.clinicName,
      phone: input.phone,
      website: input.website,
      clinicType: input.clinicType,
      locationCount: input.locationCount,
      providerCount: input.providerCount,
      interest: input.interest,
      referralCode,
      status: "ENGAGED",
    },
    update: {
      contactName: input.contactName,
      clinicName: input.clinicName,
      phone: input.phone,
      website: input.website,
      clinicType: input.clinicType,
      locationCount: input.locationCount,
      providerCount: input.providerCount,
      interest: input.interest,
      lastActivityAt: new Date(),
    },
    select: { id: true, status: true, referralCode: true },
  });

  if (referralCode && !prospect.referralCode) {
    await db.growthProspect.update({ where: { id: prospect.id }, data: { referralCode } });
    await linkAttribution(referralCode, prospect.id, input.visitorId);
  }

  // Stitch any anonymous events from this browser onto the prospect now that they
  // have identified themselves, so their history is not lost at the moment it
  // becomes useful.
  if (input.visitorId) {
    await db.growthIntentEvent.updateMany({
      where: { visitorId: input.visitorId, prospectId: null },
      data: { prospectId: prospect.id },
    });
  }

  await recordIntentEvent({
    eventType: "contact_submitted",
    path: null,
    subject: input.interest,
    visitorId: input.visitorId,
    prospectId: prospect.id,
  });

  return prospect;
}

/** Attach a prospect to the partner whose link they arrived through. */
async function linkAttribution(code: string, prospectId: string, visitorId: string | null) {
  const partner = await db.growthReferralPartner.findUnique({ where: { code }, select: { id: true } });
  if (!partner) return;

  await db.growthReferralAttribution.upsert({
    where: { partnerId_prospectId: { partnerId: partner.id, prospectId } },
    create: { partnerId: partner.id, prospectId, visitorId },
    update: {},
  });
}

/**
 * Record a referral visit before anyone has identified themselves.
 *
 * Held against the visitor id until a prospect exists, which is what makes first-touch
 * attribution possible at all — the click almost always precedes the form.
 */
export async function recordReferralVisit(code: string, visitorId: string | null) {
  const normalized = normalizeReferralCode(code);
  if (!normalized) return { ok: false as const, reason: "invalid_code" as const };

  const partner = await db.growthReferralPartner.findUnique({
    where: { code: normalized },
    select: { id: true, name: true, organizationName: true, status: true },
  });
  if (!partner) return { ok: false as const, reason: "unknown_code" as const };

  await db.growthIntentEvent.create({
    data: { eventType: "referral_visit", visitorId, subject: normalized, path: `/referral/${normalized}` },
  });

  return { ok: true as const, partner };
}

export async function unsubscribeProspect(email: string) {
  const prospect = await db.growthProspect.findUnique({ where: { email }, select: { id: true } });
  if (!prospect) return false;

  await db.$transaction([
    db.growthProspect.update({ where: { id: prospect.id }, data: { unsubscribedAt: new Date() } }),
    db.growthSequenceEnrollment.updateMany({ where: { prospectId: prospect.id }, data: { unsubscribed: true } }),
  ]);
  return true;
}

import "server-only";

import { db } from "@/lib/db";
import { normalizeReferralCode } from "@/lib/growth/referrals";
import { recordIntentEvent } from "@/lib/growth/intent";

export async function captureProspect(input: {
  email: string;
  contactName: string | null;
  clinicName: string | null;
  phone: string | null;
  website: string | null;
  clinicType: string | null;
  locationCount: number | null;
  providerCount: number | null;
  interest: string | null;
  referralCode: string | null;
  visitorId: string | null;
}) {
  const referralCode = input.referralCode ? normalizeReferralCode(input.referralCode) : null;

  const existing = await db.growthProspect.findUnique({
    where: { email: input.email },
    select: { id: true, referralCode: true },
  });

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
      ...(referralCode && !existing?.referralCode ? { referralCode } : {}),
    },
    select: { id: true, status: true, referralCode: true },
  });

  // Attribution is separate from storing the referral code on the prospect. The
  // common first-touch case creates the prospect with referralCode already set, so
  // checking the returned row would incorrectly skip attribution entirely.
  if (referralCode && (!existing || !existing.referralCode)) {
    await linkAttribution(referralCode, prospect.id, input.visitorId);
  }

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

async function linkAttribution(code: string, prospectId: string, visitorId: string | null) {
  const partner = await db.growthReferralPartner.findUnique({ where: { code }, select: { id: true } });
  if (!partner) return;

  await db.growthReferralAttribution.upsert({
    where: { partnerId_prospectId: { partnerId: partner.id, prospectId } },
    create: { partnerId: partner.id, prospectId, visitorId },
    update: {},
  });
}

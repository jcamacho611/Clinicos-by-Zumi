import "server-only";

import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";
import { buildLuxeRecoveryReview } from "@/lib/luxe-recovery-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

const LUXE_ORGANIZATION_SLUG = process.env.LUXE_MEDI_ORGANIZATION_SLUG?.trim() || "luxe-medi";

function configuredStaleDays() {
  const parsed = Number.parseInt(process.env.LUXE_MEDI_REACTIVATION_REVIEW_DAYS ?? "7", 10);
  if (!Number.isFinite(parsed)) return 7;
  return Math.min(365, Math.max(1, parsed));
}

export async function getLuxeRecoveryReview(session: ClinicSession) {
  const organization = await db.organization.findUnique({
    where: { id: session.organizationId },
    select: { slug: true, status: true },
  });
  if (!organization || organization.status !== "active" || organization.slug !== LUXE_ORGANIZATION_SLUG) {
    throw new NetworkAccessError("Luxe recovery review is not available for this organization.", 404);
  }

  const leads = await db.lead.findMany({
    where: { organizationId: session.organizationId },
    select: {
      id: true,
      name: true,
      source: true,
      serviceInterest: true,
      estimatedValueCents: true,
      status: true,
      bookingStatus: true,
      consentStatus: true,
      lostReason: true,
      lastContactedAt: true,
      followUpDueAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "asc" },
    take: 2000,
  });

  const result = buildLuxeRecoveryReview(leads, { now: new Date(), staleAfterDays: configuredStaleDays() });
  await db.auditLog.create({
    data: {
      organizationId: session.organizationId,
      actorId: session.userId,
      actorType: "user",
      action: "luxe.recovery_review_viewed",
      resourceType: "luxe_recovery_review",
      resourceId: session.organizationId,
      metadata: {
        reviewCandidates: result.metrics.reviewCandidates,
        suppressedCandidates: result.metrics.suppressedCandidates,
        estimatedOpportunityCents: result.metrics.reviewEstimatedOpportunityCents,
      },
    },
  });
  return result;
}

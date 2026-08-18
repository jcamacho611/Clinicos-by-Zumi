export type LuxeRecoveryLeadFact = {
  id: string;
  name: string;
  source: string;
  serviceInterest: string | null;
  estimatedValueCents: number;
  status: string;
  bookingStatus: string;
  consentStatus: string;
  lostReason: string | null;
  lastContactedAt: Date | null;
  followUpDueAt: Date | null;
  updatedAt: Date;
};

const BLOCKED_CONSENT = new Set(["opted_out", "do_not_contact", "denied", "revoked", "suppressed"]);
const NON_RECOVERY_LOST_REASON = /\b(spam|duplicate|test|invalid|wrong number|fake|do not contact|dont contact|don't contact|stop contact(?:ing)?)\b/i;

function dollars(cents: number) {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

function daysBetween(earlier: Date, later: Date) {
  return Math.max(0, Math.floor((later.getTime() - earlier.getTime()) / 86_400_000));
}

export function buildLuxeRecoveryReview(
  leads: LuxeRecoveryLeadFact[],
  options: { now?: Date; staleAfterDays?: number } = {},
) {
  const now = options.now ?? new Date();
  const staleAfterDays = Math.max(1, Math.min(365, options.staleAfterDays ?? 7));
  const actionable: Array<{
    id: string;
    name: string;
    source: string;
    serviceInterest: string | null;
    estimatedValueCents: number;
    estimatedOpportunity: string;
    status: string;
    bookingStatus: string;
    reason: "lost_review" | "stale_unbooked";
    lostReason: string | null;
    daysSinceActivity: number;
    communicationEligibility: "review_required";
  }> = [];
  let suppressedCount = 0;
  let suppressedEstimatedCents = 0;

  for (const lead of leads) {
    if (lead.status === "completed" || lead.bookingStatus === "booked") continue;
    const ageDays = daysBetween(lead.updatedAt, now);
    const lostCandidate = lead.status === "lost";
    const staleCandidate = !lostCandidate && ageDays >= staleAfterDays;
    if (!lostCandidate && !staleCandidate) continue;

    const consent = lead.consentStatus.trim().toLowerCase();
    const blockedByConsent = BLOCKED_CONSENT.has(consent);
    const excludedReason = Boolean(lostCandidate && lead.lostReason && NON_RECOVERY_LOST_REASON.test(lead.lostReason));
    if (blockedByConsent || excludedReason) {
      suppressedCount += 1;
      suppressedEstimatedCents += lead.estimatedValueCents;
      continue;
    }

    actionable.push({
      id: lead.id,
      name: lead.name,
      source: lead.source,
      serviceInterest: lead.serviceInterest,
      estimatedValueCents: lead.estimatedValueCents,
      estimatedOpportunity: dollars(lead.estimatedValueCents),
      status: lead.status,
      bookingStatus: lead.bookingStatus,
      reason: lostCandidate ? "lost_review" : "stale_unbooked",
      lostReason: lead.lostReason,
      daysSinceActivity: ageDays,
      communicationEligibility: "review_required",
    });
  }

  actionable.sort((a, b) => b.estimatedValueCents - a.estimatedValueCents || b.daysSinceActivity - a.daysSinceActivity);
  const reviewEstimatedCents = actionable.reduce((sum, lead) => sum + lead.estimatedValueCents, 0);

  return {
    generatedAt: now.toISOString(),
    staleAfterDays,
    metrics: {
      reviewCandidates: actionable.length,
      reviewEstimatedOpportunityCents: reviewEstimatedCents,
      reviewEstimatedOpportunity: dollars(reviewEstimatedCents),
      suppressedCandidates: suppressedCount,
      suppressedEstimatedOpportunityCents: suppressedEstimatedCents,
      suppressedEstimatedOpportunity: dollars(suppressedEstimatedCents),
    },
    queue: actionable.slice(0, 100),
    definitions: {
      reviewCandidate: `Lost leads or non-booked leads with no record update for at least ${staleAfterDays} days, excluding obvious spam/duplicate/test/invalid/do-not-contact reasons.`,
      communicationEligibility: "Recovery candidates require a human review of channel-specific consent and context before outreach. No message is sent automatically.",
      suppressed: "Leads with explicit blocked/suppressed consent states or clearly non-recoverable/do-not-contact lost reasons are excluded from the action queue.",
    },
  };
}

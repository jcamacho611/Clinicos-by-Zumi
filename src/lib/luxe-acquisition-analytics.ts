export type AcquisitionLeadFact = {
  id: string;
  name: string;
  source: string;
  campaignSource: string | null;
  serviceInterest: string | null;
  estimatedValueCents: number;
  status: string;
  pipelineStage: string;
  assignedTo: string | null;
  followUpDueAt: Date | null;
  lastContactedAt: Date | null;
  bookingStatus: string;
  paymentStatus: string;
  createdAt: Date;
  updatedAt: Date;
};

export type LatestTouch = {
  source: string | null;
  campaign: string | null;
  cta: string | null;
  occurredAt: Date;
};

export type LeadCollectedEvidence = {
  manualReconciledCents: number;
  processorVerifiedCents: number;
};

const TERMINAL = new Set(["lost", "completed"]);

function dollars(cents: number) {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

function ageMinutes(date: Date, now: Date) {
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60_000));
}

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[middle - 1] + sorted[middle]) / 2) : sorted[middle];
}

function bucketUnanswered(age: number) {
  if (age < 5) return "under5" as const;
  if (age < 15) return "fiveTo15" as const;
  if (age < 60) return "fifteenTo60" as const;
  if (age < 1440) return "oneTo24Hours" as const;
  return "over24Hours" as const;
}

export function summarizeAcquisitionLeads(
  leads: AcquisitionLeadFact[],
  options: {
    now?: Date;
    slaMinutes?: number;
    latestTouches?: Map<string, LatestTouch>;
    collectedEvidenceByLead?: Map<string, LeadCollectedEvidence>;
  } = {},
) {
  const now = options.now ?? new Date();
  const slaMinutes = Math.max(5, Math.min(1440, options.slaMinutes ?? 15));
  const latestTouches = options.latestTouches ?? new Map<string, LatestTouch>();
  const collectedEvidenceByLead = options.collectedEvidenceByLead ?? new Map<string, LeadCollectedEvidence>();
  const open = leads.filter((lead) => !TERMINAL.has(lead.status));
  const unanswered = open.filter((lead) => !lead.lastContactedAt);
  const overdueFollowUps = open.filter((lead) => Boolean(lead.followUpDueAt && lead.followUpDueAt <= now));
  const bookingStarted = open.filter((lead) => lead.bookingStatus === "started");
  const bookingObserved = open.filter((lead) => lead.bookingStatus === "observed");
  const bookingPendingVerification = open.filter((lead) => ["started", "observed"].includes(lead.bookingStatus));
  const bookingReviewDue = bookingPendingVerification.filter((lead) => Boolean(lead.followUpDueAt && lead.followUpDueAt <= now));
  const atRisk = open.filter((lead) => {
    const overdue = Boolean(lead.followUpDueAt && lead.followUpDueAt <= now);
    const unansweredPastSla = !lead.lastContactedAt && ageMinutes(lead.createdAt, now) >= slaMinutes;
    return overdue || unansweredPastSla;
  });

  const last24HoursStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last24HoursLeads = leads.filter((lead) => lead.createdAt >= last24HoursStart && lead.createdAt <= now);
  const responseMinutes = leads
    .filter((lead) => lead.lastContactedAt && lead.lastContactedAt >= lead.createdAt)
    .map((lead) => Math.max(0, Math.round((lead.lastContactedAt!.getTime() - lead.createdAt.getTime()) / 60_000)));

  const unansweredBuckets = {
    under5: 0,
    fiveTo15: 0,
    fifteenTo60: 0,
    oneTo24Hours: 0,
    over24Hours: 0,
  };
  for (const lead of unanswered) unansweredBuckets[bucketUnanswered(ageMinutes(lead.createdAt, now))] += 1;

  const group = (keyFor: (lead: AcquisitionLeadFact) => string) => {
    const grouped = new Map<string, {
      key: string;
      leads: number;
      openLeads: number;
      estimatedOpportunityCents: number;
      bookedEstimatedCents: number;
      collectedWithEvidenceCents: number;
    }>();
    for (const lead of leads) {
      const key = keyFor(lead) || "unknown";
      const current = grouped.get(key) ?? { key, leads: 0, openLeads: 0, estimatedOpportunityCents: 0, bookedEstimatedCents: 0, collectedWithEvidenceCents: 0 };
      const evidence = collectedEvidenceByLead.get(lead.id);
      current.leads += 1;
      current.estimatedOpportunityCents += lead.estimatedValueCents;
      current.collectedWithEvidenceCents += (evidence?.manualReconciledCents ?? 0) + (evidence?.processorVerifiedCents ?? 0);
      if (!TERMINAL.has(lead.status)) current.openLeads += 1;
      if (["booked", "completed"].includes(lead.status) || lead.bookingStatus === "booked") current.bookedEstimatedCents += lead.estimatedValueCents;
      grouped.set(key, current);
    }
    return Array.from(grouped.values())
      .sort((a, b) => b.collectedWithEvidenceCents - a.collectedWithEvidenceCents || b.estimatedOpportunityCents - a.estimatedOpportunityCents || b.leads - a.leads)
      .map((item) => ({
        ...item,
        estimatedOpportunity: dollars(item.estimatedOpportunityCents),
        bookedEstimated: dollars(item.bookedEstimatedCents),
        collectedWithEvidence: dollars(item.collectedWithEvidenceCents),
      }));
  };

  const actionQueue = open
    .map((lead) => {
      const unansweredAgeMinutes = !lead.lastContactedAt ? ageMinutes(lead.createdAt, now) : null;
      const followUpOverdue = Boolean(lead.followUpDueAt && lead.followUpDueAt <= now);
      const pastSla = unansweredAgeMinutes !== null && unansweredAgeMinutes >= slaMinutes;
      const bookingInProgress = lead.bookingStatus === "started";
      const bookingObservationPending = lead.bookingStatus === "observed";
      const score = (followUpOverdue ? 100 : 0) + (bookingObservationPending ? 90 : 0) + (pastSla ? 80 : 0) + (bookingInProgress ? 60 : 0) + Math.min(50, Math.floor(lead.estimatedValueCents / 10_000));
      const latest = latestTouches.get(lead.id) ?? null;
      const evidence = collectedEvidenceByLead.get(lead.id);
      const collectedWithEvidenceCents = (evidence?.manualReconciledCents ?? 0) + (evidence?.processorVerifiedCents ?? 0);
      const action = bookingObservationPending
        ? "verify_booking"
        : bookingInProgress
          ? followUpOverdue ? "verify_booking" : "booking_in_progress"
          : followUpOverdue || pastSla ? "contact_now"
          : !lead.lastContactedAt ? "contact"
          : "review_next_step";
      return {
        id: lead.id,
        name: lead.name,
        serviceInterest: lead.serviceInterest,
        firstTouchSource: lead.source,
        firstCampaignSource: lead.campaignSource,
        latestTouch: latest ? { source: latest.source, campaign: latest.campaign, cta: latest.cta, occurredAt: latest.occurredAt.toISOString() } : null,
        estimatedOpportunityCents: lead.estimatedValueCents,
        estimatedOpportunity: dollars(lead.estimatedValueCents),
        collectedWithEvidenceCents,
        collectedWithEvidence: dollars(collectedWithEvidenceCents),
        bookingStatus: lead.bookingStatus,
        paymentStatus: lead.paymentStatus,
        status: lead.status,
        pipelineStage: lead.pipelineStage,
        assignedTo: lead.assignedTo,
        routingStatus: lead.assignedTo ? "assigned" : "unassigned",
        followUpDueAt: lead.followUpDueAt?.toISOString() ?? null,
        lastContactedAt: lead.lastContactedAt?.toISOString() ?? null,
        unansweredAgeMinutes,
        followUpOverdue,
        pastSla,
        bookingInProgress,
        bookingObservationPending,
        action,
        score,
      };
    })
    .sort((a, b) => b.score - a.score || b.estimatedOpportunityCents - a.estimatedOpportunityCents)
    .slice(0, 50)
    .map(({ score: _score, ...lead }) => lead);

  const sum = (items: AcquisitionLeadFact[]) => items.reduce((total, lead) => total + lead.estimatedValueCents, 0);
  const booked = leads.filter((lead) => ["booked", "completed"].includes(lead.status) || lead.bookingStatus === "booked");
  const lost = leads.filter((lead) => lead.status === "lost");
  const unassigned = open.filter((lead) => !lead.assignedTo);
  const paymentTotals = Array.from(collectedEvidenceByLead.values()).reduce(
    (totals, evidence) => ({
      manualReconciledCents: totals.manualReconciledCents + evidence.manualReconciledCents,
      processorVerifiedCents: totals.processorVerifiedCents + evidence.processorVerifiedCents,
    }),
    { manualReconciledCents: 0, processorVerifiedCents: 0 },
  );
  const collectedWithEvidenceCents = paymentTotals.manualReconciledCents + paymentTotals.processorVerifiedCents;

  return {
    generatedAt: now.toISOString(),
    slaMinutes,
    metrics: {
      leadsLast24Hours: last24HoursLeads.length,
      openLeads: open.length,
      unansweredLeads: unanswered.length,
      overdueFollowUps: overdueFollowUps.length,
      unassignedOpenLeads: unassigned.length,
      atRiskLeads: atRisk.length,
      bookingStartedLeads: bookingStarted.length,
      bookingObservedLeads: bookingObserved.length,
      bookingReviewDueLeads: bookingReviewDue.length,
      medianSpeedToLeadMinutes: median(responseMinutes),
      openEstimatedOpportunityCents: sum(open),
      openEstimatedOpportunity: dollars(sum(open)),
      atRiskEstimatedOpportunityCents: sum(atRisk),
      atRiskEstimatedOpportunity: dollars(sum(atRisk)),
      bookedEstimatedValueCents: sum(booked),
      bookedEstimatedValue: dollars(sum(booked)),
      lostEstimatedOpportunityCents: sum(lost),
      lostEstimatedOpportunity: dollars(sum(lost)),
      manualReconciledRevenueCents: paymentTotals.manualReconciledCents,
      manualReconciledRevenue: dollars(paymentTotals.manualReconciledCents),
      processorVerifiedRevenueCents: paymentTotals.processorVerifiedCents,
      processorVerifiedRevenue: dollars(paymentTotals.processorVerifiedCents),
      collectedRevenueWithEvidenceCents: collectedWithEvidenceCents,
      collectedRevenueWithEvidence: dollars(collectedWithEvidenceCents),
    },
    unansweredBuckets,
    bySource: group((lead) => lead.source),
    byCampaign: group((lead) => lead.campaignSource ?? "unknown"),
    byService: group((lead) => lead.serviceInterest ?? "unknown"),
    actionQueue,
    definitions: {
      atRisk: `Open lead with an overdue follow-up or no recorded contact within ${slaMinutes} minutes of creation.`,
      bookingStarted: "The configured external booking rail was opened from a server-associated acquisition journey. This is intent evidence only, not booking or payment confirmation.",
      bookingObserved: "An external booking source reported a booking for the matched lead. Human verification remains required, and this does not prove payment.",
      bookingReviewDue: "A started/observed booking whose human verification/follow-up deadline is due. Staff must verify authoritative booking evidence before changing booking/payment state.",
      bookedEstimatedValue: "Estimated lead value associated with a booked/completed lead or booked bookingStatus. This is not collected revenue.",
      collectedRevenueWithEvidence: "Sum of processor-verified evidence plus authorized manual reconciliation evidence linked to leads. Manual reconciliation is labeled separately and is not processor verification.",
      recentVolume: "Lead records created during the rolling 24 hours ending at generatedAt; not a clinic-local calendar-day metric.",
    },
  };
}

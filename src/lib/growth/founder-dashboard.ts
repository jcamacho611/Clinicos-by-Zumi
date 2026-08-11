import "server-only";

import { db } from "@/lib/db";
import { bandGuidance, intentEventTypes, type IntentBand } from "@/lib/growth/intent";
import { plans } from "@/lib/growth/pricing";
import { auditPriceBands } from "@/lib/growth/audit-checkout";

/**
 * The founder's acquisition view.
 *
 * The question it answers is "who should I contact today", not "how is traffic". A
 * dashboard that reports visitor counts produces satisfaction; one that names six
 * clinics produces revenue.
 */

const DEFAULT_WINDOW_DAYS = 30;

export type FunnelCounts = {
  visitors: number;
  demoViews: number;
  pricingViews: number;
  auditViews: number;
  newLeads: number;
  highIntent: number;
  checkoutStarted: number;
  paid: number;
};

export type PriorityProspect = {
  id: string;
  clinicName: string;
  contactName: string;
  email: string;
  score: number;
  band: IntentBand;
  status: string;
  guidance: string;
  lastActivityAt: Date;
  /** The three most recent things they did, so a call can open with context. */
  recentActivity: string[];
};

export async function loadFounderDashboard(windowDays = DEFAULT_WINDOW_DAYS) {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const [events, prospects] = await Promise.all([
    db.growthIntentEvent.groupBy({
      by: ["eventType"],
      where: { occurredAt: { gte: since } },
      _count: { _all: true },
    }),
    db.growthProspect.findMany({
      where: { lastActivityAt: { gte: since } },
      select: {
        id: true, clinicName: true, contactName: true, email: true,
        score: true, band: true, status: true, lastActivityAt: true,
        events: { select: { eventType: true, occurredAt: true }, orderBy: { occurredAt: "desc" }, take: 3 },
      },
      orderBy: [{ score: "desc" }],
      take: 200,
    }),
  ]);

  const counts = Object.fromEntries(events.map((row) => [row.eventType, row._count._all]));
  const distinctVisitors = await db.growthIntentEvent.findMany({
    where: { occurredAt: { gte: since }, visitorId: { not: null } },
    select: { visitorId: true },
    distinct: ["visitorId"],
  });

  const funnel: FunnelCounts = {
    visitors: distinctVisitors.length,
    demoViews: (counts.demo_started ?? 0),
    pricingViews: counts.pricing_viewed ?? 0,
    auditViews: counts.audit_viewed ?? 0,
    newLeads: prospects.length,
    highIntent: prospects.filter((prospect) => prospect.band === "high" || prospect.band === "urgent").length,
    checkoutStarted: (counts.checkout_started ?? 0) + (counts.audit_checkout_clicked ?? 0),
    paid: counts.payment_completed ?? 0,
  };

  // Urgent first, then by score. Capped, because a list of forty names is a list
  // nobody works.
  const rank: Record<string, number> = { urgent: 0, high: 1, warm: 2, cold: 3 };
  const priority: PriorityProspect[] = prospects
    .filter((prospect) => prospect.band === "urgent" || prospect.band === "high")
    .sort((a, b) => (rank[a.band] ?? 9) - (rank[b.band] ?? 9) || b.score - a.score)
    .slice(0, 12)
    .map((prospect) => ({
      id: prospect.id,
      clinicName: prospect.clinicName,
      contactName: prospect.contactName,
      email: prospect.email,
      score: prospect.score,
      band: prospect.band as IntentBand,
      status: prospect.status,
      guidance: bandGuidance[prospect.band as IntentBand] ?? "",
      lastActivityAt: prospect.lastActivityAt,
      recentActivity: prospect.events.map((entry) => humanizeEvent(entry.eventType)),
    }));

  return { funnel, priority, pipelineCents: estimatePipelineCents(prospects), windowDays };
}

/**
 * Pipeline value.
 *
 * Deliberately conservative and deliberately explained on the surface that shows it.
 * A pipeline number nobody can reconstruct is a number that gets believed once and
 * then ignored forever.
 *
 * Only prospects who reached checkout or scored as high intent count, and each counts
 * at the entry plan's annual value or the smallest audit price — never at the largest
 * deal they might theoretically become.
 */
function estimatePipelineCents(prospects: readonly { band: string; status: string }[]) {
  const entryPlan = plans.find((plan) => plan.key === "klinikos");
  const annualPlanCents = (entryPlan?.monthlyCents ?? 0) * 12;
  const smallestAuditCents = Math.min(...auditPriceBands.map((band) => band.priceUsd)) * 100;

  return prospects.reduce((total, prospect) => {
    if (prospect.status === "CHECKOUT_STARTED") return total + smallestAuditCents;
    if (prospect.band === "high" || prospect.band === "urgent") return total + annualPlanCents;
    return total;
  }, 0);
}

const EVENT_LABELS: Partial<Record<string, string>> = {
  homepage_viewed: "Read the homepage",
  how_it_works_viewed: "Read how it works",
  solution_viewed: "Read a solution page",
  zumi_page_viewed: "Read the Zumi page",
  demo_started: "Started the walkthrough",
  demo_completed: "Finished the walkthrough",
  pricing_viewed: "Viewed pricing",
  audit_viewed: "Viewed the Operational Audit",
  audit_checkout_clicked: "Opened audit checkout",
  checkout_started: "Started checkout",
  checkout_abandoned: "Left checkout unfinished",
  contact_submitted: "Sent their details",
  overview_requested: "Requested the overview",
  referral_visit: "Arrived from a partner link",
  account_created: "Created an account",
  payment_completed: "Paid",
  onboarding_started: "Started onboarding",
  onboarding_completed: "Finished onboarding",
};

export function humanizeEvent(eventType: string) {
  return EVENT_LABELS[eventType] ?? eventType.replace(/_/g, " ");
}

export const PIPELINE_BASIS_NOTICE =
  "Pipeline counts each high-intent prospect at one year of the entry plan, and each started checkout at the smallest audit price. It is a floor for prioritising outreach, not a forecast.";

/** Every event type the dashboard can display, so a new one cannot go unlabelled. */
export const KNOWN_EVENT_TYPES = intentEventTypes;

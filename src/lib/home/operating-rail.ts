import "server-only";

import { Prisma } from "@prisma/client";
import { can, type ClinicRole } from "@/lib/auth/rbac";
import type { ClinicSession } from "@/lib/auth/types";
import { canAccessWorkspace } from "@/lib/auth/workspace-authorization";
import { db } from "@/lib/db";

/**
 * A destination the operating rail is allowed to show.
 *
 * `live` is deliberately nullable. A destination only carries a number when this
 * module actually counted real rows for it. Nothing here invents a zero, an
 * estimate, or a placeholder metric so a card looks populated — a destination we
 * cannot truthfully count renders as a plain doorway with no number attached.
 */
export type RailDestination = {
  key: string;
  label: string;
  /** One or two words for the icon rail, where the full label does not fit. */
  short: string;
  description: string;
  href: string;
  workspace: string;
  live: { count: number; noun: string; singular: string } | null;
};

/**
 * A real, actionable fact — never a role-templated slogan.
 *
 * The previous Home rendered an "Opportunity" derived purely from the viewer's
 * role, so it appeared identically whether or not anything was actually waiting.
 * That is a fabricated state. This type only ever describes counted rows, and the
 * resolver returns null when nothing real is open.
 */
export type HomeOpportunity = {
  kind: "grid_offer_decision" | "open_escalation" | "open_task";
  title: string;
  body: string;
  action: string;
  href: string;
  evidence: string;
};

export type HomeOperatingRail = {
  destinations: RailDestination[];
  opportunity: HomeOpportunity | null;
};

type Candidate = Omit<RailDestination, "live"> & { counter?: "tasks" | "grid_offers" };

function candidatesForRole(role: ClinicRole): Candidate[] {
  if (role === "clinic_owner" || role === "administrator") {
    return [
      { key: "operations", label: "Clinic operations", short: "Operations", description: "Patients, schedule, staff work, follow-up, and revenue", href: "/front-desk", workspace: "front-desk" },
      { key: "grid", label: "Grid", short: "Grid", description: "Find or offer healthcare work, space, services, and capacity", href: "/grid", workspace: "grid", counter: "grid_offers" },
      { key: "edu", label: "Klinikos EDU", short: "EDU", description: "Courses, scenarios, training, and readiness", href: "/edu", workspace: "edu" },
    ];
  }
  if (role === "provider") {
    return [
      { key: "care", label: "Today's care", short: "Care", description: "Open the work that needs clinical attention", href: "/provider", workspace: "provider" },
      { key: "grid", label: "Grid", short: "Grid", description: "See eligible work, services, and healthcare opportunities", href: "/grid", workspace: "grid", counter: "grid_offers" },
      { key: "edu", label: "Klinikos EDU", short: "EDU", description: "Continue learning, scenarios, and readiness", href: "/edu", workspace: "edu" },
    ];
  }
  if (role === "clinical_staff" || role === "case_manager") {
    return [
      { key: "care", label: "Today's care", short: "Care", description: "Open the work that needs care-team attention", href: "/tasks", workspace: "tasks", counter: "tasks" },
      { key: "network", label: "Care network", short: "Network", description: "Follow referrals, handoffs, and connected work", href: "/network/directory", workspace: "network" },
      { key: "edu", label: "Klinikos EDU", short: "EDU", description: "Continue learning, scenarios, and readiness", href: "/edu", workspace: "edu" },
    ];
  }
  if (role === "front_desk") {
    return [
      { key: "operations", label: "Front desk", short: "Front desk", description: "Arrivals, intake, confirmation, coverage, and payment work", href: "/front-desk", workspace: "front-desk" },
      { key: "work", label: "My work", short: "My work", description: "Open the task queue your role can act on", href: "/tasks", workspace: "tasks", counter: "tasks" },
      { key: "edu", label: "Klinikos EDU", short: "EDU", description: "Courses, scenarios, and professional learning", href: "/edu", workspace: "edu" },
    ];
  }
  if (role === "biller") {
    return [
      { key: "billing", label: "Billing", short: "Billing", description: "Coverage, balances, and revenue work waiting on a person", href: "/billing", workspace: "billing" },
      { key: "work", label: "My work", short: "My work", description: "Open the task queue your role can act on", href: "/tasks", workspace: "tasks", counter: "tasks" },
      { key: "edu", label: "Klinikos EDU", short: "EDU", description: "Courses, scenarios, and professional learning", href: "/edu", workspace: "edu" },
    ];
  }
  return [
    { key: "work", label: "My work", short: "My work", description: "Go directly to the work your role can act on", href: "/tasks", workspace: "tasks", counter: "tasks" },
    { key: "edu", label: "Klinikos EDU", short: "EDU", description: "Courses, scenarios, and professional learning", href: "/edu", workspace: "edu" },
  ];
}

async function countOpenTasks(session: ClinicSession) {
  if (!can(session.role, "tasks", "read")) return null;
  // A provider's rail should reflect the provider's own queue, not the whole clinic's,
  // so the number on Home matches what they will find when they open it.
  const ownerScope = session.role === "provider" ? { ownerId: session.userId } : {};
  return db.task.count({ where: { organizationId: session.organizationId, status: "open", ...ownerScope } });
}

/**
 * Grid offers this organization is the recipient of and has not decided on yet.
 *
 * Expired offers are excluded because `transitionGridOffer` refuses them — counting
 * them would put a number on Home for work nobody can actually do.
 */
async function countGridOffersAwaitingDecision(session: ClinicSession) {
  if (!can(session.role, "grid", "read")) return null;
  const rows = await db.$queryRaw<Array<{ count: number }>>(Prisma.sql`
    SELECT COUNT(*)::int AS count FROM "GridOfferRecord"
    WHERE "recipientOrganizationId" = ${session.organizationId}
      AND "status" = 'sent'
      AND "expiresAt" > CURRENT_TIMESTAMP
  `);
  return Number(rows[0]?.count ?? 0);
}

async function countOpenEscalations(session: ClinicSession) {
  if (!can(session.role, "escalations", "read")) return null;
  return db.escalation.count({ where: { organizationId: session.organizationId, status: "open" } });
}

function plural(count: number, singular: string, noun: string) {
  return count === 1 ? singular : noun;
}

/**
 * Resolve the destinations this role can actually reach, with real counts attached,
 * plus the single highest-signal real opportunity — or none.
 *
 * Every destination is filtered through `canAccessWorkspace`, the same rule the app
 * shell uses, so Home cannot render a doorway that would bounce the viewer at the
 * route guard. A control that does nothing is worse than no control.
 */
export async function getHomeOperatingRail(session: ClinicSession): Promise<HomeOperatingRail> {
  const candidates = candidatesForRole(session.role).filter((candidate) => canAccessWorkspace(session.role, candidate.workspace));

  const needsTasks = candidates.some((candidate) => candidate.counter === "tasks");
  const needsGrid = candidates.some((candidate) => candidate.counter === "grid_offers");

  const [openTasks, gridOffers, openEscalations] = await Promise.all([
    needsTasks ? countOpenTasks(session) : Promise.resolve(null),
    needsGrid ? countGridOffersAwaitingDecision(session) : Promise.resolve(null),
    countOpenEscalations(session),
  ]);

  const destinations: RailDestination[] = candidates.map((candidate) => {
    if (candidate.counter === "tasks" && openTasks !== null) {
      return { ...candidate, live: { count: openTasks, noun: "open tasks", singular: "open task" } };
    }
    if (candidate.counter === "grid_offers" && gridOffers !== null) {
      return { ...candidate, live: { count: gridOffers, noun: "offers awaiting your decision", singular: "offer awaiting your decision" } };
    }
    return { ...candidate, live: null };
  });

  const gridReachable = destinations.some((destination) => destination.workspace === "grid");
  const tasksReachable = destinations.some((destination) => destination.workspace === "tasks");

  let opportunity: HomeOpportunity | null = null;
  if (gridReachable && gridOffers) {
    opportunity = {
      kind: "grid_offer_decision",
      title: `${gridOffers} Grid ${plural(gridOffers, "offer is", "offers are")} waiting on your decision.`,
      body: "Each one is a live offer addressed to this organization that has not expired. Accepting, countering, or declining is a governed decision your role can make.",
      action: "Open Grid",
      href: "/grid",
      evidence: "Counted from Grid offer records addressed to this organization.",
    };
  } else if (openEscalations && canAccessWorkspace(session.role, "escalations")) {
    opportunity = {
      kind: "open_escalation",
      title: `${openEscalations} ${plural(openEscalations, "escalation is", "escalations are")} open.`,
      body: "An escalation stays open until a person reviews it. Klinikos does not close one on its own.",
      action: "Open escalations",
      href: "/escalations",
      evidence: "Counted from open escalation records in this organization.",
    };
  } else if (tasksReachable && openTasks) {
    opportunity = {
      kind: "open_task",
      title: `${openTasks} ${plural(openTasks, "task is", "tasks are")} still open.`,
      body: "These are recorded tasks waiting on a person, not a projection of what might be needed.",
      action: "Open my work",
      href: "/tasks",
      evidence: "Counted from open task records this role can read.",
    };
  }

  return { destinations, opportunity };
}

import "server-only";

import { AppointmentStatus } from "@prisma/client";
import { can } from "@/lib/auth/rbac";
import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";
import { gridDemandSchema } from "@/lib/grid/demand-contract";
import type { SavedGridDemand } from "@/lib/grid/transaction-flow";

/**
 * Clinic OS → Grid.
 *
 * Clinic OS holds the operational truth that tells a clinic it is short-staffed,
 * leaking referrals, or sitting on capacity nobody is using. Grid is where that
 * shortage or surplus can be met. Without a bridge, a person has to notice the gap
 * in one product and re-type it into another; the two engines are wired together
 * only in the sense that both exist.
 *
 * This module reads real Clinic OS records and produces a *draft* — a schema-valid
 * Grid demand a person can review and confirm. Three rules hold it honest:
 *
 * 1. NOTHING IS POSTED HERE. Detection returns a draft. Creating the demand goes
 *    through `POST /api/grid/demands`, which enforces RBAC, refuses organizations
 *    that have not passed production review, writes the audit record, and emits
 *    `grid.demand.created`. A gap the clinic has not chosen to publish is not a
 *    Grid need.
 *
 * 2. NO PHI CROSSES. A coverage gap describes the shift — role, window, location —
 *    never the patient whose appointment exposed it. Grid demand records are
 *    visible outside the originating organization, so patient identity must never
 *    reach one. `tests/clinic-grid-bridge.test.ts` asserts this against fixtures
 *    carrying real-looking patient identifiers.
 *
 * 3. NOTHING IS INVENTED. A signal is emitted only when rows were actually counted.
 *    No estimated value, no projected fill rate, no "you could earn" figure —
 *    money on this path would be a claim about an outcome nobody has agreed to.
 */

/** A Clinic OS observation that Grid could act on. */
export type ClinicGridSignal = {
  kind: "coverage_gap" | "referral_leak" | "unused_capacity";
  /** `demand` means Clinic OS needs something; `supply` means it holds something spare. */
  direction: "demand" | "supply";
  title: string;
  detail: string;
  /** Exactly what was counted, so the number can be checked against the record. */
  evidence: string;
  count: number;
  /** Where a person goes to act on it. */
  href: string;
  actionLabel: string;
  /**
   * A prefilled Grid demand for the person to review, or null when the signal is
   * supply (which is published through the resource surface, not as a demand).
   */
  draft: SavedGridDemand | null;
};

const ACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.REQUESTED,
  AppointmentStatus.PENDING_CONFIRMATION,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.CHECKED_IN,
];

/** Referral states that still have somewhere to go. A closed loop is not a leak. */
const OPEN_REFERRAL_STATUSES = ["draft", "ready", "sent", "pending"];

function windowLabel(from: Date, to: Date) {
  const format = (value: Date) => value.toISOString().slice(0, 10);
  return format(from) === format(to) ? format(from) : `${format(from)} to ${format(to)}`;
}

/**
 * Build the demand and prove it against the real Grid contract before returning it.
 *
 * Parsing here rather than at submission means a draft that Grid would reject never
 * reaches the surface as an offer to act. A draft that cannot become a demand is a
 * dead control.
 */
function draftDemand(input: unknown): SavedGridDemand | null {
  const parsed = gridDemandSchema.safeParse(input);
  if (!parsed.success) return null;
  return { ...parsed.data, status: "draft", visibility: "matched_only" };
}

async function detectCoverageGap(session: ClinicSession, now: Date): Promise<ClinicGridSignal | null> {
  if (!can(session.role, "appointments", "read")) return null;

  const horizon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const uncovered = await db.appointment.findMany({
    where: {
      organizationId: session.organizationId,
      providerId: null,
      startsAt: { gte: now, lte: horizon },
      status: { in: ACTIVE_APPOINTMENT_STATUSES },
    },
    // Only the fields the shift description needs. The patient relation is
    // deliberately not selected: what is never read cannot leak.
    select: { startsAt: true, endsAt: true, locationId: true },
    orderBy: { startsAt: "asc" },
    take: 200,
  });
  if (!uncovered.length) return null;

  const first = uncovered[0];
  const last = uncovered[uncovered.length - 1];
  const locationId = first.locationId;
  const location = locationId
    ? await db.location.findFirst({
      where: { id: locationId, organizationId: session.organizationId },
      select: { city: true, state: true, locationType: true },
    })
    : null;

  const count = uncovered.length;
  const window = windowLabel(first.startsAt, last.endsAt);

  return {
    kind: "coverage_gap",
    direction: "demand",
    title: `${count} scheduled ${count === 1 ? "visit has" : "visits have"} no provider assigned.`,
    detail: "Grid can look for eligible coverage for this window. Eligibility, credentials, and jurisdiction are checked at match, not here.",
    evidence: `Counted from scheduled appointments between ${window} with no provider on the record.`,
    count,
    href: "/grid/needs/new",
    actionLabel: "Review the coverage need",
    draft: draftDemand({
      kind: "provider",
      title: `Provider coverage needed for ${count} scheduled ${count === 1 ? "visit" : "visits"}`,
      // Describes the shift. No patient, no appointment id, no reason for visit.
      description: `Scheduled clinic visits between ${window} currently have no provider assigned. Seeking eligible provider coverage for this window.`,
      category: "clinical_coverage",
      requestedStartAt: first.startsAt.toISOString(),
      requestedEndAt: last.endsAt.toISOString(),
      locationType: location?.locationType ?? "clinic",
      city: location?.city ?? null,
      state: location?.state ?? null,
      quantity: 1,
      requiresClinicalEligibility: true,
      requirements: ["Active license in the practice jurisdiction", "Credentials verified before the first scheduled visit"],
    }),
  };
}

async function detectReferralLeak(session: ClinicSession): Promise<ClinicGridSignal | null> {
  if (!can(session.role, "referrals", "read")) return null;

  const stranded = await db.referral.count({
    where: {
      organizationId: session.organizationId,
      destinationOrganizationId: null,
      status: { in: OPEN_REFERRAL_STATUSES },
    },
  });
  if (!stranded) return null;

  return {
    kind: "referral_leak",
    direction: "demand",
    title: `${stranded} open ${stranded === 1 ? "referral has" : "referrals have"} no destination organization.`,
    detail: "Grid can look for partner capacity that accepts this kind of referral. Klinikos does not send a referral from this surface.",
    evidence: "Counted from open referral records with no destination organization recorded.",
    count: stranded,
    href: "/referrals",
    actionLabel: "Open referrals",
    draft: draftDemand({
      kind: "referral",
      title: "Referral destination capacity needed",
      // Specialty is deliberately omitted: on a small panel a specialty plus a
      // count can narrow to a person. The clinic adds it when it reviews the draft.
      description: `${stranded} open ${stranded === 1 ? "referral has" : "referrals have"} no destination organization recorded. Seeking partner capacity that accepts referrals from this clinic.`,
      category: "referral_capacity",
      quantity: 1,
      requiresClinicalEligibility: true,
      requirements: ["Accepts referrals from partner clinics"],
    }),
  };
}

async function detectUnusedCapacity(session: ClinicSession, now: Date): Promise<ClinicGridSignal | null> {
  if (!can(session.role, "appointments", "read")) return null;

  const open = await db.capacityListing.count({
    where: { organizationId: session.organizationId, status: "open", startsAt: { gte: now } },
  });
  if (!open) return null;

  return {
    kind: "unused_capacity",
    direction: "supply",
    title: `${open} open capacity ${open === 1 ? "block is" : "blocks are"} unclaimed.`,
    detail: "Capacity this clinic already holds can be offered through Grid as a resource. Publishing is a decision the clinic makes, and review applies before anything is visible.",
    evidence: "Counted from open capacity listings starting in the future.",
    count: open,
    href: "/grid/resources",
    actionLabel: "Review what you could offer",
    // Supply is published as a Grid resource, not as a demand. Prefilling a demand
    // here would describe the clinic as needing the thing it already has.
    draft: null,
  };
}

/**
 * Everything Clinic OS can currently tell Grid about this organization.
 *
 * Returns an empty array when nothing real was counted. A clinic with no gaps sees
 * no suggestions rather than an encouragement to create work.
 */
export async function detectClinicGridSignals(session: ClinicSession, now = new Date()): Promise<ClinicGridSignal[]> {
  // Reading Clinic OS state is governed per detector above. Acting on a signal
  // additionally needs Grid rights, and the create endpoint re-checks them, so a
  // role that can see a gap but not publish is shown the gap without the action.
  const [coverage, referral, capacity] = await Promise.all([
    detectCoverageGap(session, now),
    detectReferralLeak(session),
    detectUnusedCapacity(session, now),
  ]);

  return [coverage, referral, capacity].filter((signal): signal is ClinicGridSignal => signal !== null);
}

/** Whether this role may act on a signal, as opposed to merely seeing it. */
export function canActOnClinicGridSignal(session: ClinicSession) {
  return can(session.role, "grid", "create") || can(session.role, "network", "create");
}

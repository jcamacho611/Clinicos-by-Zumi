import "server-only";

import { RiskLevel } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";
import type { UrgentSignalCategory } from "@/lib/safety/urgent-signal";

/**
 * Turning an emergency signal into something a person is responsible for.
 *
 * Showing emergency language is necessary and not sufficient: it tells the person what
 * to do and leaves the clinic unaware it happened. This opens an escalation so the
 * signal becomes a visible obligation in a queue someone works, rather than a sentence
 * that scrolls away.
 *
 * Two rules shape everything here.
 *
 * First, this is best-effort and must never be able to suppress the emergency message.
 * A database outage is not a reason to withhold "call 911", so every failure is caught
 * and reported rather than thrown.
 *
 * Second, it records that an urgent signal occurred and nothing about what was said.
 * The Escalation model has no field designed to hold patient-typed prose, and putting it
 * in `resolution` — a reviewer's note — would both misuse the field and spread whatever
 * the person happened to type into another table.
 */

export const URGENT_SIGNAL_SOURCE_TYPE = "urgent_signal";

/**
 * How long an open signal from the same person stands for.
 *
 * Someone in distress may send several messages in a row. Each one opening its own
 * escalation buries the queue and makes the real count unknowable, so a repeat inside
 * this window joins the escalation already open.
 */
const DEDUPE_WINDOW_MS = 15 * 60 * 1000;

export type UrgentEscalationOutcome =
  | { readonly recorded: true; readonly escalationId: string; readonly alreadyOpen: boolean }
  | { readonly recorded: false; readonly reason: "unavailable" };

export async function recordUrgentSignalEscalation(
  session: ClinicSession,
  category: UrgentSignalCategory,
): Promise<UrgentEscalationOutcome> {
  try {
    const existing = await db.escalation.findFirst({
      where: {
        organizationId: session.organizationId,
        sourceType: URGENT_SIGNAL_SOURCE_TYPE,
        sourceId: session.userId,
        status: "open",
        createdAt: { gte: new Date(Date.now() - DEDUPE_WINDOW_MS) },
      },
      select: { id: true },
      orderBy: { createdAt: "desc" },
    });

    if (existing) return { recorded: true, escalationId: existing.id, alreadyOpen: true };

    const escalation = await db.escalation.create({
      data: {
        organizationId: session.organizationId,
        // The person typing is a member of the clinic, not necessarily the person in
        // difficulty, so no patient is asserted. Guessing one would attach an emergency
        // to the wrong chart.
        patientId: null,
        sourceType: URGENT_SIGNAL_SOURCE_TYPE,
        sourceId: session.userId,
        category,
        riskLevel: RiskLevel.URGENT,
        requiresHumanReview: true,
        assignedTeam: "provider",
        status: "open",
      },
      select: { id: true },
    });

    return { recorded: true, escalationId: escalation.id, alreadyOpen: false };
  } catch {
    // Deliberately swallowed. The caller still returns the emergency message; the only
    // thing lost is the clinic-side record, and saying so truthfully is the caller's job.
    return { recorded: false, reason: "unavailable" };
  }
}

/**
 * What Klinikos can honestly say it did.
 *
 * Never "we alerted someone" — opening a queue item is not contacting a person, and a
 * message that implies rescue is on the way is worse than one that admits it is not.
 */
export function describeUrgentHandoff(outcome: UrgentEscalationOutcome): string {
  if (!outcome.recorded) {
    return "Klinikos could not open a review for your team just now, so tell someone directly.";
  }
  if (outcome.alreadyOpen) {
    return "A review is already open for your team from a moment ago. Nobody has been contacted yet.";
  }
  return "A review has been opened for your team. That is a queue item, not a person who has been contacted.";
}

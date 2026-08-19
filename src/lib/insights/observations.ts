import "server-only";
import { db } from "@/lib/db";
import { can } from "@/lib/auth/rbac";
import type { ClinicRole } from "@/lib/auth/rbac";

/**
 * What Klinikos has actually noticed, and nothing else.
 *
 * The failure this file is built to avoid is the one every analytics page commits: an
 * observation that sounds specific, arrives on day one, and is derived from six rows.
 * "Saturday capacity is consistently unused" is a useful sentence when it is true and a
 * lie when it is extrapolated from a single quiet weekend — and a clinic owner cannot
 * tell the difference by looking.
 *
 * So every observation declares the evidence it stands on, and none is produced below
 * `MINIMUM_OBSERVATIONS`. When there is not enough history the honest answer is that
 * there is not enough history, which is why `baselineEstablished` is a separate fact
 * from "no observations". Nothing here estimates money saved, time recovered, or return
 * on anything: those require a baseline this product has not measured.
 */

/** Below this, a pattern is an anecdote. */
const MINIMUM_OBSERVATIONS = 12;
/** How far back a pattern is allowed to look. */
const WINDOW_DAYS = 90;

export interface Observation {
  id: string;
  /** The conclusion, in a sentence. Never a metric with a label. */
  headline: string;
  /** Exactly what was counted, so a skeptical owner can check it. */
  evidence: string;
  /** Where to go and do something about it. */
  action: { label: string; href: string } | null;
}

export interface InsightsPicture {
  /** Null when the role may not read the underlying operating data. */
  observations: readonly Observation[] | null;
  /** False when there is too little history for any pattern to mean anything. */
  baselineEstablished: boolean;
  /** How many records the window actually contained. */
  sampleSize: number;
  windowDays: number;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function getInsightsPicture(
  viewer: { organizationId: string; role: ClinicRole },
  now: Date = new Date(),
): Promise<InsightsPicture> {
  // Insights read across appointments and follow-up work, so the viewer needs both.
  if (!can(viewer.role, "appointments", "read")) {
    return { observations: null, baselineEstablished: false, sampleSize: 0, windowDays: WINDOW_DAYS };
  }

  const since = new Date(now.getTime() - WINDOW_DAYS * 86_400_000);
  const appointments = await db.appointment.findMany({
    where: { organizationId: viewer.organizationId, startsAt: { gte: since, lte: now } },
    select: { startsAt: true, status: true },
  });

  const sampleSize = appointments.length;
  if (sampleSize < MINIMUM_OBSERVATIONS) {
    // Not "nothing is wrong" — nothing is yet knowable. Those are different answers and
    // collapsing them is how a dashboard starts lying on its first day.
    return { observations: [], baselineEstablished: false, sampleSize, windowDays: WINDOW_DAYS };
  }

  const observations: Observation[] = [];

  // 1. A weekday that is consistently quieter than the rest.
  const byWeekday = new Map<number, number>();
  for (const appointment of appointments) byWeekday.set(appointment.startsAt.getDay(), (byWeekday.get(appointment.startsAt.getDay()) ?? 0) + 1);
  const active = [...byWeekday.entries()].filter(([, count]) => count > 0);
  if (active.length >= 3) {
    const average = sampleSize / active.length;
    const quietest = active.sort((left, right) => left[1] - right[1])[0];
    // Only worth saying when the gap is large enough to be a pattern rather than noise.
    if (quietest[1] < average * 0.5) {
      observations.push({
        id: "quiet-weekday",
        headline: `${WEEKDAYS[quietest[0]]} is consistently quieter than your other days.`,
        evidence: `${quietest[1]} of ${sampleSize} visits in the last ${WINDOW_DAYS} days fell on a ${WEEKDAYS[quietest[0]]}, against an average of ${Math.round(average)} per active day.`,
        action: { label: "See Grid capacity", href: "/grid/workspace" },
      });
    }
  }

  // 2. Visits that never became visits.
  const missed = appointments.filter((appointment) => appointment.status === "NO_SHOW").length;
  if (missed > 0) {
    const rate = Math.round((missed / sampleSize) * 100);
    if (rate >= 5) {
      observations.push({
        id: "no-show-rate",
        headline: `About ${rate} in every 100 booked visits did not arrive.`,
        evidence: `${missed} of ${sampleSize} appointments in the last ${WINDOW_DAYS} days were recorded as no-shows.`,
        action: { label: "Open Today", href: "/front-desk" },
      });
    }
  }

  // 3. Visits still waiting on confirmation after their time has passed.
  const stalePending = appointments.filter(
    (appointment) => appointment.startsAt < now
      && (appointment.status === "REQUESTED" || appointment.status === "PENDING_CONFIRMATION"),
  ).length;
  if (stalePending >= 3) {
    observations.push({
      id: "unconfirmed-past",
      headline: "Some past visits were never confirmed or closed out.",
      evidence: `${stalePending} appointments are still awaiting confirmation although their scheduled time has passed.`,
      action: { label: "Open Today", href: "/front-desk" },
    });
  }

  return { observations, baselineEstablished: true, sampleSize, windowDays: WINDOW_DAYS };
}

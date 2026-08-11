/**
 * Appointment-risk detection and the action it calls for.
 *
 * This is the first real automation loop in Klinikos. The event is an appointment
 * that is going to go wrong: unconfirmed with the date approaching, missing the
 * paperwork it needs, or missing an insurance check that will surface as a problem on
 * the day.
 *
 * Every input below already exists on `Appointment` — `status`, `startsAt`,
 * `formsComplete`, `insuranceVerified`. Nothing here needs a new source of truth,
 * which is why this is the loop worth finishing first.
 *
 * The design rule the whole module follows: **an action Klinikos can take safely and
 * reverse, it takes. An action that leaves the building, or that a person must stand
 * behind, it prepares.** Creating an internal task is the former. Messaging a patient
 * is the latter.
 *
 * Pure module. No database, no network.
 */

export const riskKinds = ["unconfirmed", "missing_forms", "insurance_unverified", "no_show_recovery"] as const;
export type RiskKind = (typeof riskKinds)[number];

export const riskLabels: Record<RiskKind, string> = {
  unconfirmed: "Not confirmed",
  missing_forms: "Paperwork incomplete",
  insurance_unverified: "Insurance not verified",
  no_show_recovery: "Did not attend",
};

/** How the clinic experiences the risk, in the words an owner would use. */
export const riskExplanations: Record<RiskKind, string> = {
  unconfirmed: "The patient has not confirmed, and the appointment is close enough that an empty chair is likely.",
  missing_forms: "Intake paperwork is incomplete, so the visit will start late or run over.",
  insurance_unverified: "Coverage has not been checked. Found now it is a phone call; found on the day it is a cancellation.",
  no_show_recovery: "The patient did not attend and nothing has been done to rebook them.",
};

export type AppointmentSnapshot = {
  id: string;
  patientId: string;
  startsAt: Date;
  status: string;
  formsComplete: boolean;
  insuranceVerified: boolean;
};

export type DetectedRisk = {
  appointmentId: string;
  patientId: string;
  kind: RiskKind;
  startsAt: Date;
  hoursUntil: number;
  /** Higher is more urgent. Drives the order of the owner's queue. */
  urgency: number;
};

/** Statuses that mean the patient has not yet said they are coming. */
const UNCONFIRMED_STATUSES = new Set(["REQUESTED", "PENDING_CONFIRMATION"]);

/** Statuses where the visit has already happened or been abandoned. */
const CLOSED_STATUSES = new Set(["COMPLETED", "CANCELLED", "RESCHEDULED", "CHECKED_IN", "IN_ROOM", "WITH_PROVIDER", "CHECKOUT"]);

/**
 * How far ahead to look for each risk.
 *
 * Confirmation is chased closer to the appointment, because chasing three weeks out
 * annoys the patient and the answer changes anyway. Paperwork gets a longer window,
 * because it takes the patient time to complete.
 */
const WINDOWS_HOURS: Record<Exclude<RiskKind, "no_show_recovery">, number> = {
  unconfirmed: 72,
  missing_forms: 120,
  insurance_unverified: 120,
};

/** No-shows are worth recovering for about a fortnight; after that it is a cold lead. */
const NO_SHOW_RECOVERY_WINDOW_HOURS = 336;

export function hoursBetween(from: Date, to: Date) {
  return (to.getTime() - from.getTime()) / (60 * 60 * 1000);
}

/**
 * Every risk an appointment currently carries.
 *
 * One appointment can carry several — unconfirmed *and* missing paperwork is common,
 * and collapsing them into a single "at risk" flag would lose the part that tells
 * someone what to actually do.
 */
export function detectRisks(appointment: AppointmentSnapshot, now: Date): DetectedRisk[] {
  const hoursUntil = hoursBetween(now, appointment.startsAt);
  const risks: DetectedRisk[] = [];

  const base = { appointmentId: appointment.id, patientId: appointment.patientId, startsAt: appointment.startsAt, hoursUntil };

  if (appointment.status === "NO_SHOW") {
    const hoursSince = -hoursUntil;
    if (hoursSince >= 0 && hoursSince <= NO_SHOW_RECOVERY_WINDOW_HOURS) {
      risks.push({ ...base, kind: "no_show_recovery", urgency: 70 });
    }
    return risks;
  }

  // A visit that has happened, been cancelled, or is already in progress cannot be
  // improved by chasing it.
  if (CLOSED_STATUSES.has(appointment.status)) return risks;

  // Past appointments that were never closed out are a data-quality problem, not a
  // follow-up opportunity. Chasing them would produce work nobody can action.
  if (hoursUntil < 0) return risks;

  if (UNCONFIRMED_STATUSES.has(appointment.status) && hoursUntil <= WINDOWS_HOURS.unconfirmed) {
    // Urgency climbs as the appointment approaches: 24 hours out is materially more
    // urgent than 72, and the queue should say so.
    risks.push({ ...base, kind: "unconfirmed", urgency: Math.round(100 - (hoursUntil / WINDOWS_HOURS.unconfirmed) * 40) });
  }

  if (!appointment.formsComplete && hoursUntil <= WINDOWS_HOURS.missing_forms) {
    risks.push({ ...base, kind: "missing_forms", urgency: Math.round(80 - (hoursUntil / WINDOWS_HOURS.missing_forms) * 30) });
  }

  if (!appointment.insuranceVerified && hoursUntil <= WINDOWS_HOURS.insurance_unverified) {
    risks.push({ ...base, kind: "insurance_unverified", urgency: Math.round(75 - (hoursUntil / WINDOWS_HOURS.insurance_unverified) * 30) });
  }

  return risks;
}

export function detectRisksAcross(appointments: readonly AppointmentSnapshot[], now: Date): DetectedRisk[] {
  return appointments
    .flatMap((appointment) => detectRisks(appointment, now))
    .sort((a, b) => b.urgency - a.urgency || a.startsAt.getTime() - b.startsAt.getTime());
}

// ---------------------------------------------------------------------------
// What to do about it
// ---------------------------------------------------------------------------

export const actionKinds = ["internal_task", "patient_message"] as const;
export type ActionKind = (typeof actionKinds)[number];

export const actionStates = [
  "prepared",
  "executed",
  "awaiting_confirmation",
  "awaiting_connection",
  "awaiting_delivery",
  "sending",
  "dismissed",
  "resolved_by_source",
  "failed",
] as const;
export type ActionState = (typeof actionStates)[number];

export const actionStateLabels: Record<ActionState, string> = {
  prepared: "Prepared",
  executed: "Sent",
  awaiting_confirmation: "Needs your confirmation",
  awaiting_connection: "Awaiting communications connection",
  awaiting_delivery: "Approved, waiting to send",
  sending: "Sending",
  dismissed: "Dismissed",
  resolved_by_source: "No longer needed",
  failed: "Could not be sent",
};

export type PreparedAction = {
  kind: ActionKind;
  title: string;
  body: string;
  /**
   * Whether Klinikos may perform this without asking.
   *
   * True only for work that stays inside the clinic and can be undone. Anything a
   * patient would receive is false regardless of how routine it looks, because an
   * unwanted message cannot be recalled.
   */
  autoExecutable: boolean;
};

/**
 * The work a risk calls for.
 *
 * Two actions per risk, deliberately: something for the clinic to do, and something
 * to say to the patient. The first runs; the second waits for a person and a
 * connected channel.
 */
export function prepareActions(risk: DetectedRisk, patientName: string, clinicName: string): PreparedAction[] {
  const when = risk.startsAt.toLocaleString("en-US", { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  switch (risk.kind) {
    case "unconfirmed":
      return [
        {
          kind: "internal_task",
          title: `Confirm ${patientName} for ${when}`,
          body: `This appointment is ${Math.round(risk.hoursUntil)} hours away and has not been confirmed.`,
          autoExecutable: true,
        },
        {
          kind: "patient_message",
          title: `Confirmation request to ${patientName}`,
          body: `Hello ${patientName}, this is ${clinicName}. We have you booked for ${when}. Please reply to confirm, or let us know if another time suits you better.`,
          autoExecutable: false,
        },
      ];

    case "missing_forms":
      return [
        {
          kind: "internal_task",
          title: `Chase intake paperwork for ${patientName}`,
          body: `Intake is incomplete for the appointment on ${when}.`,
          autoExecutable: true,
        },
        {
          kind: "patient_message",
          title: `Intake reminder to ${patientName}`,
          body: `Hello ${patientName}, this is ${clinicName}. Before your visit on ${when}, please complete your intake forms. It takes a few minutes and saves time when you arrive.`,
          autoExecutable: false,
        },
      ];

    case "insurance_unverified":
      return [
        {
          kind: "internal_task",
          title: `Verify coverage for ${patientName}`,
          body: `Insurance has not been verified for the appointment on ${when}.`,
          autoExecutable: true,
        },
      ];

    case "no_show_recovery":
      return [
        {
          kind: "internal_task",
          title: `Rebook ${patientName}`,
          body: `${patientName} did not attend on ${when} and has not been rebooked.`,
          autoExecutable: true,
        },
        {
          kind: "patient_message",
          title: `Rebooking outreach to ${patientName}`,
          body: `Hello ${patientName}, this is ${clinicName}. We missed you on ${when}. Would you like us to find you another time?`,
          autoExecutable: false,
        },
      ];
  }
}

// ---------------------------------------------------------------------------
// How much Klinikos is permitted to do unattended
// ---------------------------------------------------------------------------

/**
 * The vocabulary a clinic will eventually configure its automation with.
 *
 * Named now, before there is a settings screen, because the alternative is that the
 * concept arrives later as a boolean bolted onto whichever call site needed it first.
 * Today every clinic runs on {@link DEFAULT_AUTOMATION_POLICY} and there is no way to
 * change it — no UI, no column, no request field. What exists is the shape.
 */
export const automationLevels = ["auto_allowed", "confirm_required", "human_required", "blocked"] as const;
export type AutomationLevel = (typeof automationLevels)[number];

export const automationLevelLabels: Record<AutomationLevel, string> = {
  auto_allowed: "Klinikos does this on its own",
  confirm_required: "Klinikos prepares it, you confirm",
  human_required: "A person does this",
  blocked: "Klinikos does not do this",
};

/** Ascending supervision. Used to compare two levels, never persisted. */
const STRICTNESS: Record<AutomationLevel, number> = {
  auto_allowed: 0,
  confirm_required: 1,
  human_required: 2,
  blocked: 3,
};

/**
 * The most permissive level each action kind may ever be set to.
 *
 * This is the part that must not be configurable. A future settings screen can make
 * Klinikos more cautious; it cannot make it send patient messages unattended, because
 * a message that should not have gone out cannot be recalled by changing the setting
 * back. Written as a ceiling rather than enforced at the UI so the guarantee survives
 * whatever calls this next.
 */
const AUTOMATION_CEILING: Record<ActionKind, AutomationLevel> = {
  internal_task: "auto_allowed",
  patient_message: "confirm_required",
};

/** What every clinic runs on today. Identical to the ceiling — nothing is relaxed. */
export const DEFAULT_AUTOMATION_POLICY: Record<ActionKind, AutomationLevel> = { ...AUTOMATION_CEILING };

export type AutomationPolicy = Partial<Record<ActionKind, AutomationLevel>>;

/**
 * The level actually in force for an action kind.
 *
 * A configured level is honoured only when it is at least as supervised as the
 * ceiling. A configuration that tried to loosen one is not an error to report to a
 * clinic — it is silently clamped, because the safe answer is available and refusing
 * the whole sweep over a bad setting would help nobody.
 */
export function resolveAutomationLevel(kind: ActionKind, policy: AutomationPolicy = {}): AutomationLevel {
  const configured = policy[kind] ?? DEFAULT_AUTOMATION_POLICY[kind];
  const ceiling = AUTOMATION_CEILING[kind];
  return STRICTNESS[configured] >= STRICTNESS[ceiling] ? configured : ceiling;
}

/**
 * The state a prepared action should be recorded in, or `null` if it should not be
 * recorded at all.
 *
 * A message never reads as "Sent" unless a connected channel actually accepted it.
 * With no communications connection the honest state is `awaiting_connection`, and
 * that is what the owner sees.
 *
 * `null` is only reachable through a `blocked` policy, which nothing can currently
 * set. It exists so that when something can, the sweep skips the action rather than
 * inventing a state for it.
 */
export function initialActionState(
  action: PreparedAction,
  communicationsConnected: boolean,
  policy: AutomationPolicy = {},
): ActionState | null {
  const level = resolveAutomationLevel(action.kind, policy);
  if (level === "blocked") return null;

  if (level === "auto_allowed" && action.autoExecutable) return "executed";

  // Anything that leaves the building waits for a person *and* a channel. The channel
  // half is what keeps "Klinikos handled it" from ever being a claim about a message
  // nothing could deliver.
  if (action.kind === "patient_message" && !communicationsConnected) return "awaiting_connection";
  return "awaiting_confirmation";
}

/** Grouping for the owner's action stream. */
export const actionStreams = ["handled", "awaiting_you", "blocked", "completed"] as const;
export type ActionStream = (typeof actionStreams)[number];

export const actionStreamLabels: Record<ActionStream, string> = {
  handled: "Klinikos handled this",
  awaiting_you: "Waiting on you",
  blocked: "Blocked outside Klinikos",
  completed: "Closed",
};

export function streamForState(state: ActionState): ActionStream {
  switch (state) {
    case "executed": return "handled";
    case "awaiting_confirmation": return "awaiting_you";
    case "awaiting_connection":
    case "awaiting_delivery":
    case "sending": return "blocked";
    case "prepared": return "awaiting_you";
    case "dismissed":
    // Not "dismissed": nobody decided this was unnecessary, the reason for it went
    // away. Keeping them distinct is what lets an owner tell "I judged this" from
    // "the clinic sorted itself out".
    case "resolved_by_source":
    case "failed": return "completed";
  }
}

export const COMMUNICATIONS_BLOCKED_NOTICE =
  "Klinikos has written this message but cannot deliver it: no messaging channel is connected for this clinic. Connect one and these send with a single confirmation.";

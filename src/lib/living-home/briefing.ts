import "server-only";

import type { ClinicRole } from "@/lib/auth/rbac";
import type { Appointment } from "@/lib/types";
import { actionStateLabels, type ActionState, type RiskKind } from "@/lib/operations/followup-rules";

/**
 * The Living Home briefing.
 *
 * Everything here is derived from state Klinikos already holds. Nothing is invented to
 * make the page look busy: a section with no real data is returned empty and the surface
 * says so plainly rather than filling the space.
 *
 * The vocabulary crossing this boundary is the vocabulary a clinic uses. Risk kinds,
 * action states and role keys stay on this side of it and are translated here, once, so
 * no component has to know what `insurance_unverified` or `awaiting_connection` mean.
 */

export type BriefingTone = "decide" | "attention" | "steady" | "calm";

export type BriefingEvidence = { label: string; value: string };

export type BriefingAction = {
  label: string;
  href: string;
  emphasis: "primary" | "secondary";
};

export type BriefingItem = {
  id: string;
  title: string;
  context: string;
  owner: string;
  ownerIsUnassigned: boolean;
  age: string;
  state: string;
  tone: BriefingTone;
  /** Plain-language reason this reached the person, shown when a row is opened. */
  why: string;
  evidence: BriefingEvidence[];
  actions: BriefingAction[];
};

export type HandledItem = { id: string; label: string; by: string; when: string };
export type UpcomingItem = { id: string; time: string; label: string; detail: string; state: string; tone: BriefingTone };
export type ContinueItem = { id: string; kind: string; title: string; note: string; percent: number; progress: string };
export type RibbonBar = { label: string; percent: number; tone: "none" | "busy" | "watch" | "open" };

export type LivingHomeBriefing = {
  greeting: string;
  dateLine: string;
  /** One sentence stating the day. Never alarming when nothing is wrong. */
  verdict: string;
  verdictTone: BriefingTone;
  needsCount: number;
  needsTitle: string;
  needsNote: string;
  needsYou: BriefingItem[];
  handled: HandledItem[];
  handledNote: string;
  upcoming: UpcomingItem[];
  continueItems: ContinueItem[];
  ribbon: RibbonBar[];
  ribbonCaption: string;
  nowPercent: number;
  nowLabel: string;
  /** Present only when a real, evidenced opportunity exists. */
  opportunity: {
    title: string;
    note: string;
    ctaLabel: string;
    ctaHref: string;
    lines: { label: string; value: string }[];
  } | null;
};

/** Human wording for why an appointment reached someone. Never the internal risk key. */
const RISK_LANGUAGE: Record<RiskKind, { context: string; why: string }> = {
  unconfirmed: {
    context: "Not confirmed yet",
    why: "Reminders went out and nobody has replied. Appointments still unconfirmed this close to the visit are the ones most likely to be missed.",
  },
  missing_forms: {
    context: "Intake not finished",
    why: "The visit is booked but the intake answers have not come back. Without them the visit starts without history and usually runs long.",
  },
  insurance_unverified: {
    context: "Coverage not checked",
    why: "Coverage has not been verified for this visit. Checking it before the patient arrives avoids a billing surprise afterwards.",
  },
  no_show_recovery: {
    context: "Missed the last visit",
    why: "This patient missed their last appointment and has not rebooked. Reaching out now is the difference between a gap in care and a returning patient.",
  },
};

/** Which action states are genuinely waiting on a person. */
const NEEDS_PERSON: readonly ActionState[] = ["awaiting_confirmation", "prepared", "failed"];
/** States that mean the work is done or no longer applies. */
const SETTLED: readonly ActionState[] = ["executed", "resolved_by_source", "dismissed"];

export type OperationalActionInput = {
  id: string;
  riskKind: string;
  actionKind: string;
  appointmentId: string;
  state: ActionState;
  title: string;
  body: string;
  deliveredAt: Date | string | null;
  approvedAt: Date | string | null;
};

function greetingFor(now: Date) {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function relativeAge(from: Date, now: Date) {
  const minutes = Math.round((now.getTime() - from.getTime()) / 60_000);
  if (minutes < 60) return `${Math.max(1, minutes)}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function clockLabel(date: Date) {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function toDate(value: Date | string | null) {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

/**
 * A patient message that has not been delivered must never read as sent. The connector
 * state decides the wording, so an unconnected deployment says so instead of implying
 * a message went out.
 */
function actionStateWording(action: OperationalActionInput): { state: string; tone: BriefingTone } {
  if (action.state === "awaiting_connection") return { state: "Needs a connection", tone: "attention" };
  if (action.state === "failed") return { state: "Did not send", tone: "decide" };
  if (action.state === "awaiting_confirmation") return { state: "Confirm", tone: "decide" };
  if (action.state === "prepared") return { state: "Ready for you", tone: "attention" };
  if (action.state === "awaiting_delivery" || action.state === "sending") return { state: "Sending", tone: "steady" };
  return { state: actionStateLabels[action.state] ?? "Open", tone: "steady" };
}

function riskLanguage(riskKind: string) {
  return RISK_LANGUAGE[riskKind as RiskKind] ?? {
    context: "Needs a look",
    why: "Klinikos raised this from the day's schedule and it has not been resolved yet.",
  };
}

/** Sections a role should see. Grid participants and patients never see clinic operations. */
function roleShape(role: ClinicRole) {
  if (role === "clinic_owner" || role === "administrator") {
    return { needsTitle: "DECISIONS TODAY", needsNote: "Only what a person has to decide. The routine work is already handled.", showOpportunity: true };
  }
  if (role === "front_desk" || role === "case_manager") {
    return { needsTitle: "BEFORE THE DAY FILLS UP", needsNote: "Ordered by when it stops mattering, not by when it arrived.", showOpportunity: true };
  }
  if (role === "provider" || role === "clinical_staff") {
    return { needsTitle: "BEFORE CLINIC", needsNote: "Your work. The operational follow-up sits with the front desk.", showOpportunity: false };
  }
  return { needsTitle: "NEEDS YOU", needsNote: "What is waiting on you right now.", showOpportunity: false };
}

export function composeLivingHomeBriefing(input: {
  firstName: string;
  role: ClinicRole;
  organizationName: string;
  appointments: Appointment[];
  actions: OperationalActionInput[];
  continueItems: ContinueItem[];
  now?: Date;
}): LivingHomeBriefing {
  const now = input.now ?? new Date();
  const shape = roleShape(input.role);

  const open = input.actions.filter((action) => NEEDS_PERSON.includes(action.state) || action.state === "awaiting_connection");
  const settled = input.actions.filter((action) => SETTLED.includes(action.state));

  const byId = new Map(input.appointments.map((appointment) => [appointment.id, appointment]));

  const needsYou: BriefingItem[] = open
    .map((action) => {
      const language = riskLanguage(action.riskKind);
      const appointment = byId.get(action.appointmentId);
      const wording = actionStateWording(action);
      const approvedAt = toDate(action.approvedAt);
      const evidence: BriefingEvidence[] = [
        { label: "Raised from", value: appointment ? "The day's schedule" : "Clinic operations" },
        ...(appointment ? [{ label: "Visit", value: `${appointment.date} at ${appointment.time}` }] : []),
        {
          label: "Delivery",
          value:
            action.actionKind === "patient_message"
              ? action.deliveredAt
                ? "Message delivered"
                : "Nothing has been sent yet"
              : "Stays inside the clinic",
        },
        ...(approvedAt ? [{ label: "Approved", value: clockLabel(approvedAt) }] : []),
      ];

      return {
        id: action.id,
        title: action.title,
        context: language.context,
        owner: "You",
        ownerIsUnassigned: false,
        age: appointment ? appointment.time : relativeAge(now, now),
        state: wording.state,
        tone: wording.tone,
        why: language.why,
        evidence,
        actions:
          action.actionKind === "patient_message"
            ? [
                { label: "Review and send", href: "/tasks", emphasis: "primary" as const },
                { label: "Open the visit", href: "/schedule", emphasis: "secondary" as const },
              ]
            : [{ label: "Open the task", href: "/tasks", emphasis: "primary" as const }],
      };
    })
    .sort((a, b) => (a.tone === "decide" ? -1 : 0) - (b.tone === "decide" ? -1 : 0));

  const handled: HandledItem[] = settled.slice(0, 6).map((action) => {
    const delivered = toDate(action.deliveredAt);
    return {
      id: action.id,
      label: action.title,
      by:
        action.state === "resolved_by_source"
          ? "Resolved before anyone had to act"
          : action.actionKind === "patient_message"
            ? "Sent to the patient"
            : "Handled inside the clinic",
      when: delivered ? clockLabel(delivered) : "Today",
    };
  });

  const upcoming: UpcomingItem[] = input.appointments
    .filter((appointment) => new Date(appointment.startsAt).getTime() >= now.getTime())
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, 5)
    .map((appointment) => {
      const blocked = !appointment.formsComplete || !appointment.insuranceVerified;
      return {
        id: appointment.id,
        time: appointment.time,
        label: `${appointment.patient} — ${appointment.type}`,
        detail: blocked
          ? [!appointment.formsComplete ? "Intake not finished" : null, !appointment.insuranceVerified ? "Coverage not checked" : null]
              .filter(Boolean)
              .join(" · ")
          : appointment.provider || "Scheduled",
        state: blocked ? "Needs work" : "Ready",
        tone: blocked ? "attention" : "calm",
      };
    });

  // Booked load per hour, straight from the appointments themselves.
  const hours = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
  const counts = hours.map(
    (hour) => input.appointments.filter((appointment) => new Date(appointment.startsAt).getHours() === hour).length,
  );
  const peak = Math.max(1, ...counts);
  const ribbon: RibbonBar[] = hours.map((hour, index) => {
    const count = counts[index];
    const hourAppointments = input.appointments.filter((a) => new Date(a.startsAt).getHours() === hour);
    const hasBlocked = hourAppointments.some((a) => !a.formsComplete || !a.insuranceVerified);
    return {
      label: hour > 12 ? String(hour - 12) : String(hour),
      percent: Math.round((count / peak) * 100),
      tone: count === 0 ? "open" : hasBlocked ? "watch" : "busy",
    };
  });

  const decideCount = needsYou.filter((item) => item.tone === "decide").length;
  const verdict =
    needsYou.length === 0
      ? "Everything important is handled."
      : decideCount > 0
        ? `${decideCount} ${decideCount === 1 ? "decision needs" : "decisions need"} you. Everything else is moving.`
        : `${needsYou.length} ${needsYou.length === 1 ? "item is" : "items are"} waiting on you.`;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const spanStart = 7 * 60;
  const spanEnd = 19 * 60;
  const nowPercent = Math.min(100, Math.max(0, ((nowMinutes - spanStart) / (spanEnd - spanStart)) * 100));

  return {
    greeting: `${greetingFor(now)}, ${input.firstName}.`,
    dateLine: `${now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · ${input.organizationName}`,
    verdict,
    verdictTone: needsYou.length === 0 ? "calm" : decideCount > 0 ? "decide" : "attention",
    needsCount: needsYou.length,
    needsTitle: shape.needsTitle,
    needsNote: shape.needsNote,
    needsYou,
    handled,
    handledNote:
      handled.length === 0
        ? "Nothing has been closed out yet today."
        : "No action needed.",
    upcoming,
    continueItems: input.continueItems,
    ribbon,
    ribbonCaption:
      input.appointments.length === 0
        ? "No visits are booked for today."
        : "Booked visits across the day. Amber marks an hour with unfinished paperwork.",
    nowPercent,
    nowLabel: clockLabel(now),
    // An opportunity is only shown when it is real and evidenced. There is no
    // synthesized revenue figure here: an empty day is allowed to look empty.
    opportunity: null,
  };
}

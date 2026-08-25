/**
 * How long an escalation has been waiting, and whether that is too long.
 *
 * An urgent escalation looked identical at thirty seconds and at three hours. The queue
 * showed what happened and never showed that nobody had picked it up, which is the part
 * that turns a record into a response. Registry section 59 asks for an acknowledgment
 * requirement and an escalation timer; this is the timer.
 *
 * Computed at read time from `createdAt` and the current clock. No scheduled job, no
 * stored deadline, and therefore nothing that can silently stop running — a background
 * worker that dies leaves every escalation looking fine, which is the worst failure this
 * could have.
 *
 * It measures waiting. It does not decide clinical priority, contact anyone, or escalate
 * on its own.
 */

export type EscalationWaitingState = "acknowledged" | "waiting" | "overdue";

export type EscalationWaiting = {
  readonly state: EscalationWaitingState;
  /** Whole minutes since the escalation was opened. */
  readonly waitingMinutes: number;
  /** Minutes allowed before it counts as overdue, for the risk level given. */
  readonly allowedMinutes: number;
  /** What a person reads. */
  readonly sentence: string;
};

/**
 * How long each risk level may sit unacknowledged.
 *
 * These are operating targets, not clinical standards, and they are deliberately short
 * for urgent work: the point of the number is to make silence visible quickly, not to
 * define what a safe response time is. Nobody should read fifteen minutes as an
 * assurance that someone will respond within fifteen minutes.
 */
const ALLOWED_MINUTES: Record<string, number> = {
  URGENT: 15,
  DO_NOT_AUTOMATE: 15,
  NEEDS_PROVIDER: 60,
  NEEDS_STAFF: 240,
  NORMAL: 1440,
};

const DEFAULT_ALLOWED_MINUTES = 60;

function minutesBetween(from: Date, to: Date) {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 60_000));
}

function humanDuration(minutes: number) {
  if (minutes < 1) return "less than a minute";
  if (minutes === 1) return "1 minute";
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  const hourPart = hours === 1 ? "1 hour" : `${hours} hours`;
  if (remainder === 0) return hourPart;
  return `${hourPart} ${remainder === 1 ? "1 minute" : `${remainder} minutes`}`;
}

export function resolveEscalationWaiting(input: {
  readonly status: string;
  readonly riskLevel: string;
  readonly createdAt: Date | string;
  readonly now?: Date;
}): EscalationWaiting {
  const now = input.now ?? new Date();
  const createdAt = input.createdAt instanceof Date ? input.createdAt : new Date(input.createdAt);
  const allowedMinutes = ALLOWED_MINUTES[input.riskLevel] ?? DEFAULT_ALLOWED_MINUTES;
  const waitingMinutes = minutesBetween(createdAt, now);

  // Anything that is no longer open has been picked up by a person. Continuing to count
  // against it would report a problem that someone already dealt with.
  if (input.status !== "open") {
    return {
      state: "acknowledged",
      waitingMinutes,
      allowedMinutes,
      sentence: "Someone has picked this up.",
    };
  }

  if (waitingMinutes > allowedMinutes) {
    return {
      state: "overdue",
      waitingMinutes,
      allowedMinutes,
      sentence: `Waiting ${humanDuration(waitingMinutes)}. Nobody has picked this up yet.`,
    };
  }

  return {
    state: "waiting",
    waitingMinutes,
    allowedMinutes,
    sentence: `Waiting ${humanDuration(waitingMinutes)}.`,
  };
}

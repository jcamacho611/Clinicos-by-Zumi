import { isCustomer, type ProspectStatus } from "@/lib/growth/lead-rules";

/**
 * Automated follow-up.
 *
 * This is the substitute for cold-calling: a prospect who asked for information gets
 * a short, finite sequence, and a prospect who tried to buy and stopped gets a much
 * shorter one.
 *
 * Every sequence terminates. There is no "nurture forever" path, because a sequence
 * with no end is how a product acquires a reputation for spam and how a suppression
 * list becomes the only thing anyone trusts.
 *
 * Pure module. No database, no network, no sending.
 */

export const sequenceKeys = ["overview", "checkout_recovery", "post_purchase"] as const;
export type SequenceKey = (typeof sequenceKeys)[number];

export type SequenceStep = {
  index: number;
  /** Hours after enrolment this step becomes due. */
  delayHours: number;
  subject: string;
  /** What the message is for, in one line. The body is composed at send time. */
  purpose: string;
};

export const sequences: Record<SequenceKey, { label: string; steps: readonly SequenceStep[] }> = {
  overview: {
    label: "Klinikos overview",
    steps: [
      { index: 0, delayHours: 0, subject: "Your Klinikos overview", purpose: "Send the overview they asked for, immediately." },
      { index: 1, delayHours: 48, subject: "Where clinics usually lose revenue", purpose: "Name the specific leaks Klinikos surfaces." },
      { index: 2, delayHours: 96, subject: "What Zumi does on a Monday morning", purpose: "Show the operating loop with demonstration data." },
      { index: 3, delayHours: 168, subject: "The Klinikos Operational Audit", purpose: "Offer the paid audit as the concrete next step." },
    ],
  },
  checkout_recovery: {
    label: "Checkout recovery",
    steps: [
      { index: 0, delayHours: 1, subject: "You left something unfinished", purpose: "Short, factual reminder with a link back." },
      { index: 1, delayHours: 24, subject: "What the audit actually produces", purpose: "Answer the objection that stops most checkouts: what do I get." },
      { index: 2, delayHours: 72, subject: "Closing this out", purpose: "Final message. Says plainly that no further email follows." },
    ],
  },
  post_purchase: {
    label: "Welcome and onboarding",
    steps: [
      { index: 0, delayHours: 0, subject: "Welcome to Klinikos", purpose: "Confirm the purchase and link to account creation." },
      { index: 1, delayHours: 24, subject: "Finish setting up your clinic", purpose: "Nudge to complete onboarding if it has not started." },
    ],
  },
};

export function sequenceSteps(key: SequenceKey) {
  return sequences[key].steps;
}

export type EnrollmentState = {
  sequence: SequenceKey;
  /** Index of the next step to send. Equal to the step count when finished. */
  nextStepIndex: number;
  enrolledAt: Date;
  lastSentAt: Date | null;
  unsubscribed: boolean;
};

export type SendDecision =
  | { send: true; step: SequenceStep }
  | { send: false; reason: "unsubscribed" | "finished" | "not_due" | "became_customer" | "sequence_superseded" };

/**
 * Whether the next step in a sequence should go out now.
 *
 * Ordered so the reasons a message must *not* be sent are all checked before the
 * reason it should. Unsubscribe is first and unconditional.
 */
export function nextSend(input: {
  state: EnrollmentState;
  status: ProspectStatus;
  now: Date;
}): SendDecision {
  const { state, status, now } = input;

  if (state.unsubscribed) return { send: false, reason: "unsubscribed" };

  const steps = sequenceSteps(state.sequence);
  if (state.nextStepIndex >= steps.length) return { send: false, reason: "finished" };

  // Someone who has bought must not keep receiving sales email. The welcome
  // sequence is the exception, because that is the one addressed to a customer.
  if (isCustomer(status) && state.sequence !== "post_purchase") {
    return { send: false, reason: "became_customer" };
  }

  // A prospect who reached checkout has a more urgent sequence available; the
  // general overview drip should not compete with it for their attention.
  if (state.sequence === "overview" && status === "CHECKOUT_STARTED") {
    return { send: false, reason: "sequence_superseded" };
  }

  const step = steps[state.nextStepIndex];
  const dueAt = new Date(state.enrolledAt.getTime() + step.delayHours * 60 * 60 * 1000);
  if (now < dueAt) return { send: false, reason: "not_due" };

  return { send: true, step };
}

/**
 * The sequence a prospect should be on, given what they have done.
 *
 * Returns one sequence, never a set. A prospect on two sequences receives two emails
 * on the same morning, which reads as a system that has lost track of them.
 */
export function sequenceForStatus(status: ProspectStatus): SequenceKey | null {
  if (isCustomer(status)) return "post_purchase";
  if (status === "CHECKOUT_STARTED") return "checkout_recovery";
  if (status === "LOST") return null;
  return "overview";
}

/**
 * Every sequence message carries a working unsubscribe.
 *
 * Stated as an exported constant so a sender cannot be written that omits it without
 * deleting this line, and so a test can assert it.
 */
export const UNSUBSCRIBE_REQUIRED = true;

export const SEQUENCE_FOOTER =
  "You are receiving this because you asked Klinikos for information about clinic software. Unsubscribe and we will not email you again.";

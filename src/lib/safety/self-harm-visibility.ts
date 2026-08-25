/**
 * Who may see that a colleague reported a self-harm signal.
 *
 * `escalations:read` is granted widely — billers, quality analysts and viewers all hold
 * it. That is right for an overdue referral and wrong for a colleague's mental-health
 * crisis, which arrives in the same queue. Follow-up belongs to the people who can act
 * on staff welfare.
 *
 * Kept here because two places need the answer: the queue that hides these rows, and the
 * check that tells the person whether anyone will actually see their escalation. Those
 * two disagreeing is a specific and bad failure — Klinikos would either hide a row while
 * promising someone will read it, or warn that nobody can see a row that is plainly
 * visible.
 */
export const SELF_HARM_VISIBLE_ROLES = [
  "clinic_owner",
  "administrator",
  "provider",
] as const;

const VISIBLE = new Set<string>(SELF_HARM_VISIBLE_ROLES);

/** True when this role must not be shown self-harm escalations. Absent role fails closed. */
export function hidesSelfHarmFrom(role: string | undefined | null) {
  return !role || !VISIBLE.has(role);
}

import { z } from "zod";

/**
 * Grid participants.
 *
 * The boundary between Grid and the wider identity model.
 *
 * Grid participation is otherwise a `Provider` row: a person, inside exactly one
 * organization. That inherits the whole-system constraint — `User.organizationId` is a
 * required scalar — so a clinician working with two clinics needs two accounts, and an
 * organization or a facility cannot participate as itself at all.
 *
 * A participant is an actor in the marketplace: a person, an organization, or a
 * facility. One human may hold several participations, each under a different sponsor,
 * which is exactly what the identity schema cannot express and what multi-party
 * composition requires. Nothing here migrates identity — it gives Grid somewhere correct
 * to stand while that migration remains a product decision.
 *
 * Pure module. No database, no network.
 */

export const gridParticipantKinds = ["person", "organization", "facility"] as const;
export type GridParticipantKind = (typeof gridParticipantKinds)[number];

/**
 * Participant states.
 *
 * Explicit and enumerated, so a participant is never in a state nobody named. The
 * distinctions that matter: `created` has done nothing yet, `profile_incomplete` is
 * waiting on the participant, `in_review` is waiting on Klinikos, `verified` has passed
 * review, `active` is verified and currently transacting, `restricted` may do some
 * things, `suspended` and `revoked` may do none — and they differ in whether the door is
 * shut or locked.
 */
export const gridParticipantStates = [
  "created",
  "profile_incomplete",
  "verification_required",
  "in_review",
  "verified",
  "active",
  "restricted",
  "suspended",
  "revoked",
  "closed",
] as const;
export type GridParticipantState = (typeof gridParticipantStates)[number];

/**
 * States in which a participant may be considered for regulated work.
 *
 * Deliberately narrow. Eligibility asks a further, harder question on top of this —
 * being in a transactable state is necessary and nowhere near sufficient.
 */
const TRANSACTABLE: readonly GridParticipantState[] = ["verified", "active"];

export function gridParticipantMayTransact(state: string) {
  return (TRANSACTABLE as readonly string[]).includes(state);
}

const transitions: Record<GridParticipantState, readonly GridParticipantState[]> = {
  created: ["profile_incomplete", "verification_required", "closed"],
  profile_incomplete: ["verification_required", "closed"],
  verification_required: ["in_review", "closed"],
  in_review: ["verified", "restricted", "revoked", "verification_required"],
  // Verification is not activation. A verified participant becomes active when they
  // actually take part, and can be held back without losing the verification a person
  // already granted them.
  verified: ["active", "restricted", "suspended", "revoked", "closed"],
  active: ["restricted", "suspended", "revoked", "closed"],
  // Restriction and suspension are recoverable; revocation and closure are not. A
  // marketplace that lets a revoked participant quietly return has no revocation.
  restricted: ["active", "suspended", "revoked", "closed"],
  suspended: ["active", "restricted", "revoked", "closed"],
  revoked: [],
  closed: [],
};

export function canTransitionGridParticipant(from: string, to: string) {
  const parsedFrom = z.enum(gridParticipantStates).safeParse(from);
  const parsedTo = z.enum(gridParticipantStates).safeParse(to);
  return Boolean(parsedFrom.success && parsedTo.success && transitions[parsedFrom.data].includes(parsedTo.data));
}

/** States from which nothing further is possible. */
export function gridParticipantIsTerminal(state: string) {
  const parsed = z.enum(gridParticipantStates).safeParse(state);
  return parsed.success && transitions[parsed.data].length === 0;
}

/**
 * Which subject column a participant of this kind must carry.
 *
 * Mirrors the database CHECK constraint, so a malformed participant is refused before it
 * reaches Postgres and gets the same answer if it somehow does.
 */
export function gridParticipantSubjectField(kind: GridParticipantKind) {
  return { person: "providerId", organization: "subjectOrganizationId", facility: "facilityId" }[kind];
}

export function gridParticipantSubjectIsWellFormed(input: {
  kind: string;
  providerId?: string | null;
  subjectOrganizationId?: string | null;
  facilityId?: string | null;
}) {
  const parsed = z.enum(gridParticipantKinds).safeParse(input.kind);
  if (!parsed.success) return false;
  const present = [
    input.providerId ? "providerId" : null,
    input.subjectOrganizationId ? "subjectOrganizationId" : null,
    input.facilityId ? "facilityId" : null,
  ].filter(Boolean);
  return present.length === 1 && present[0] === gridParticipantSubjectField(parsed.data);
}

/**
 * Participant state implied by an existing provider's verification status.
 *
 * Used by the backfill and by any code creating a participation for a provider that
 * already exists. Unrecognised statuses become `created`, which grants nothing — the
 * safe direction when the two vocabularies disagree.
 */
export function gridParticipantStateForProvider(verificationStatus: string): GridParticipantState {
  switch (verificationStatus) {
    case "verified": return "verified";
    case "submitted":
    case "needs_review": return "in_review";
    case "rejected": return "revoked";
    case "suspended": return "suspended";
    case "expired": return "restricted";
    case "draft": return "profile_incomplete";
    default: return "created";
  }
}

export const gridParticipantTransitionSchema = z.object({
  targetState: z.enum(gridParticipantStates),
  reason: z.string().trim().min(12).max(1000),
});

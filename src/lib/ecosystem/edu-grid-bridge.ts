import "server-only";

import { can } from "@/lib/auth/rbac";
import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";
import { competencyIsDemonstrated } from "@/lib/edu/competency-determination";
import { CREDENTIAL_DISCLAIMER } from "@/lib/edu/edu-safety";
import { gridDemandSchema } from "@/lib/grid/demand-contract";
import type { SavedGridDemand } from "@/lib/grid/transaction-flow";

/**
 * EDU → Grid.
 *
 * EDU is where healthcare supply begins: a learner demonstrates a competency, an
 * institution records it, and eventually that person becomes someone a clinic can
 * work with. Grid is where placement capacity lives. Connecting them lets a learner
 * find supervised placement without leaving Klinikos and retyping what the
 * institution already recorded.
 *
 * ONE RULE DOMINATES THIS FILE, AND IT IS NOT NEGOTIABLE:
 *
 *   AN EDUCATIONAL COMPETENCY IS NOT A LICENCE.
 *
 * `CREDENTIAL_DISCLAIMER` states it exactly — a Klinikos EDU credential is not
 * professional licensure, board certification, clinical credentialing, authorisation
 * to practise, or scope-of-practice approval. So this bridge may *describe* what EDU
 * recorded and may help a learner ask for placement, but it must never turn an
 * education record into Grid eligibility for regulated work. Every draft it produces
 * therefore sets `requiresClinicalEligibility: true` and says in its own text that
 * eligibility is verified against real credentials at match. Grid's own eligibility
 * enforcement remains the only thing that decides who may do regulated work; nothing
 * here is permitted to soften it.
 *
 * The competency determination itself is human-owned (see `competency-determination`
 * — a grade or a model suggestion is evidence, never a decision), so this module only
 * ever reads determinations an instructor already made.
 */

export type EduGridSignal = {
  kind: "placement_ready" | "competency_in_progress" | "no_determination_yet";
  title: string;
  detail: string;
  /** Exactly what was counted, so the claim can be checked against the record. */
  evidence: string;
  href: string;
  actionLabel: string;
  /** A prefilled Grid placement demand, or null when there is nothing to ask for. */
  draft: SavedGridDemand | null;
};

export type EduGridReadiness = {
  signals: EduGridSignal[];
  /**
   * What EDU state does not do. Carried on the readiness object itself rather than
   * left to each caller to remember, so a surface cannot render the encouraging half
   * of this bridge without the limiting half.
   */
  boundary: string;
};

/** Competency areas an instructor has actually marked demonstrated. */
async function readCompetencies(enrollmentIds: string[]) {
  if (!enrollmentIds.length) return { demonstrated: [] as string[], pending: [] as string[] };

  const rows = await db.educationCompetency.findMany({
    // Scoped to this learner's own enrollments. Competency records name a person's
    // performance, so they are never read across a cohort from here.
    where: { enrollmentId: { in: enrollmentIds } },
    select: { competencyArea: true, status: true },
    orderBy: { competencyArea: "asc" },
    take: 200,
  });

  const demonstrated = [...new Set(rows.filter((row) => competencyIsDemonstrated(row.status)).map((row) => row.competencyArea))];
  const pending = [...new Set(
    rows.filter((row) => !competencyIsDemonstrated(row.status)).map((row) => row.competencyArea),
  )].filter((area) => !demonstrated.includes(area));

  return { demonstrated, pending };
}

/**
 * A placement request built from demonstrated competency areas.
 *
 * Competency areas are skills, not personal data, so they may travel. The learner's
 * name, email, institution and cohort do not: a Grid demand is visible outside the
 * originating organisation, and who is asking is carried by the record's own
 * ownership fields rather than written into free text.
 */
function placementDraft(areas: string[]): SavedGridDemand | null {
  if (!areas.length) return null;

  const parsed = gridDemandSchema.safeParse({
    kind: "education",
    title: `Supervised clinical placement sought — ${areas.length} demonstrated ${areas.length === 1 ? "area" : "areas"}`,
    description: `A Klinikos EDU learner is seeking supervised clinical placement capacity in: ${areas.join(", ")}. These are educational competency determinations recorded by the institution. They are not licensure, certification, or scope-of-practice approval, and they do not by themselves establish eligibility for regulated clinical work.`,
    category: "clinical_placement",
    quantity: 1,
    // Placement is supervised clinical work. The flag stays on so Grid runs its real
    // eligibility checks; an education record must never be a way around them.
    requiresClinicalEligibility: true,
    requirements: [
      "Supervised placement with a named preceptor",
      "Eligibility verified against real credentials at match, not from education records",
    ],
  });
  if (!parsed.success) return null;
  return { ...parsed.data, status: "draft", visibility: "matched_only" };
}

/**
 * What this learner's EDU state means for Grid — and, just as importantly, what it
 * does not mean.
 *
 * Returns null when the person has no EDU enrollment at all, so a clinic user who
 * never touched EDU sees nothing rather than an empty education panel.
 */
export async function resolveEduGridReadiness(session: ClinicSession): Promise<EduGridReadiness | null> {
  const enrollments = await db.educationEnrollment.findMany({
    // Matched on the signed-in identity's own email, the same way `resolveEduIdentity`
    // scopes EDU. This never reads another learner's record.
    where: { studentEmail: session.email.trim().toLowerCase(), status: { in: ["invited", "active", "completed"] } },
    select: { id: true, status: true },
    take: 50,
  });
  if (!enrollments.length) return null;

  const { demonstrated, pending } = await readCompetencies(enrollments.map((enrollment) => enrollment.id));
  const signals: EduGridSignal[] = [];

  if (demonstrated.length) {
    signals.push({
      kind: "placement_ready",
      title: `${demonstrated.length} competency ${demonstrated.length === 1 ? "area is" : "areas are"} recorded as demonstrated.`,
      detail: "Grid can look for supervised placement capacity. Placement is supervised work: Grid checks credentials, jurisdiction and eligibility at match, and an education record is not a substitute for any of them.",
      evidence: `Counted from competency determinations your instructor recorded: ${demonstrated.join(", ")}.`,
      href: "/grid/needs/new?from=placement_ready",
      actionLabel: "Look for placement capacity",
      draft: placementDraft(demonstrated),
    });
  }

  if (pending.length) {
    signals.push({
      kind: "competency_in_progress",
      title: `${pending.length} competency ${pending.length === 1 ? "area is" : "areas are"} still open.`,
      detail: "A competency is decided by an instructor reviewing evidence. Klinikos does not mark one demonstrated on your behalf, and finishing coursework does not do it either.",
      evidence: `Counted from competency records not yet marked demonstrated: ${pending.join(", ")}.`,
      href: "/edu/competencies",
      actionLabel: "Open competencies",
      draft: null,
    });
  }

  if (!signals.length) {
    signals.push({
      kind: "no_determination_yet",
      title: "No competency determination is recorded yet.",
      detail: "Placement through Grid starts from competencies an instructor has assessed. Until then there is nothing for Klinikos to carry across.",
      evidence: "Read from your own enrollment; no competency records were found.",
      href: "/edu/competencies",
      actionLabel: "Open competencies",
      draft: null,
    });
  }

  return { signals, boundary: CREDENTIAL_DISCLAIMER };
}

/** Re-derive the placement draft when the composer opens. Never trusts the URL. */
export async function draftForEduGridSignal(
  session: ClinicSession,
  kind: EduGridSignal["kind"],
): Promise<SavedGridDemand | null> {
  const readiness = await resolveEduGridReadiness(session);
  return readiness?.signals.find((signal) => signal.kind === kind)?.draft ?? null;
}

/**
 * Whether this person may publish a placement request to Grid.
 *
 * Deliberately the ordinary Grid create permission. Being a learner does not grant
 * it, and demonstrating a competency does not either — that is the whole point.
 */
export function canPublishEduGridPlacement(session: ClinicSession) {
  return can(session.role, "grid", "create") || can(session.role, "network", "create");
}

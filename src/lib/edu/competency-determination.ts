import { z } from "zod";

/**
 * A competency determination is deliberately explicit and human-owned.
 * Grades and model suggestions may be evidence, but neither automatically converts
 * into a competency decision.
 */
export const competencyDeterminationSchema = z.object({
  competencyArea: z.string().trim().min(2).max(100),
  determination: z.enum(["demonstrated", "needs_development"]),
  evidenceSummary: z.string().trim().min(3).max(1_000),
});

export type CompetencyDetermination = z.infer<typeof competencyDeterminationSchema>;

export function competencyAreaAllowed(input: { competencyArea: string; rubricAreas: readonly (string | null)[] }) {
  return input.rubricAreas.some((area) => area === input.competencyArea);
}

export function competencyAdvancesReadiness(determination: CompetencyDetermination["determination"]) {
  return determination === "demonstrated";
}

/**
 * The competency statuses the database actually accepts.
 *
 * Committed in `20260810160000_klinikos_edu_foundation` as a CHECK constraint, so
 * this list is not a convention — a value outside it is rejected by PostgreSQL.
 */
export const competencyStatuses = ["not_assessed", "developing", "approaching", "achieved", "not_achieved"] as const;
export type CompetencyStatus = (typeof competencyStatuses)[number];

/**
 * An instructor's determination, expressed in the vocabulary the database stores.
 *
 * These are two different vocabularies on purpose: "demonstrated" is what an
 * instructor decides and what appears in events, audit metadata and the interface,
 * while "achieved" is what the schema has recorded since the EDU foundation
 * migration. They were previously assumed to be the same string and written straight
 * through, which every determination rejected with a CHECK constraint violation —
 * type-checked, linted, unit-tested, and broken against a real database.
 */
export function competencyStatusForDetermination(
  determination: CompetencyDetermination["determination"],
): CompetencyStatus {
  return determination === "demonstrated" ? "achieved" : "not_achieved";
}

/**
 * Whether a stored status means the learner has demonstrated the competency.
 *
 * Readers must go through this rather than comparing to a literal, so nothing
 * downstream re-introduces the vocabulary confusion this function exists to end.
 */
export function competencyIsDemonstrated(status: string): boolean {
  return status === "achieved";
}

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

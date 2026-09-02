import { z } from "zod";

/**
 * The one company/product claim taxonomy established by the Master Canon.
 * Workflow stage, evidence basis, and execution state are separate axes.
 */
export const companyTruthClasses = [
  "ACTUAL",
  "CONTRACTED",
  "PIPELINE",
  "ASSUMPTION",
  "SCENARIO",
  "TARGET",
] as const;

export const companyTruthClassSchema = z.enum(companyTruthClasses);

export type CompanyTruthClass = z.infer<typeof companyTruthClassSchema>;

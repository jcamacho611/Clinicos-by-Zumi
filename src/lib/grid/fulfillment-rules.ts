import { z } from "zod";

export const gridFulfillmentDecisionSchema = z.object({
  targetStatus: z.enum(["checked_in", "in_progress", "fulfilled", "partial", "failed", "disputed"]),
  note: z.string().trim().min(8).max(1_000),
  evidenceReference: z.string().trim().min(2).max(240).optional().nullable(),
});

export type GridFulfillmentDecision = z.infer<typeof gridFulfillmentDecisionSchema>;

import { z } from "zod";

export const reliabilityEventSchema = z.object({
  category: z.enum(["incident", "maintenance", "deployment", "backup", "service"]),
  severity: z.enum(["normal", "needs_attention", "urgent"]).default("normal"),
  title: z.string().trim().min(4).max(180),
  summary: z.string().trim().max(1200).optional().nullable(),
  source: z.string().trim().max(80).default("manual"),
  externalRef: z.string().trim().max(160).optional().nullable(),
});

export const reliabilityEventTransitionSchema = z.object({
  action: z.enum(["acknowledge", "resolve", "reopen"]),
  note: z.string().trim().min(8).max(800),
});

export const integrationRetrySchema = z.object({
  note: z.string().trim().min(8).max(500),
});

export type ReliabilityEventAction = z.infer<typeof reliabilityEventTransitionSchema>["action"];

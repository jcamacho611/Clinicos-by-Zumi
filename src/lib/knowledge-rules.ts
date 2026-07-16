import { z } from "zod";

export const knowledgeLayerSchema = z.enum(["trusted_reference", "network_approved", "organization"]);

const optionalDate = z.string().datetime({ offset: true }).optional().nullable();

export const createKnowledgeItemSchema = z.object({
  layer: knowledgeLayerSchema,
  title: z.string().trim().min(8).max(180),
  content: z.string().trim().min(20).max(12000),
  sourceName: z.string().trim().min(3).max(180),
  sourceUrl: z.string().url().optional().nullable(),
  sourceDate: optionalDate,
  effectiveAt: optionalDate,
  expiresAt: optionalDate,
});

export const reviewKnowledgeItemSchema = z.object({
  action: z.enum(["approve", "reject", "rollback"]),
  notes: z.string().trim().min(12).max(2000),
});

export const correctKnowledgeItemSchema = z.object({
  title: z.string().trim().min(8).max(180),
  content: z.string().trim().min(20).max(12000),
  sourceName: z.string().trim().min(3).max(180),
  sourceUrl: z.string().url().optional().nullable(),
  sourceDate: optionalDate,
  effectiveAt: optionalDate,
  expiresAt: optionalDate,
  notes: z.string().trim().min(12).max(2000),
});

export type KnowledgeLayer = z.infer<typeof knowledgeLayerSchema>;

export function knowledgeLayerLabel(layer: string) {
  if (layer === "trusted_reference") return "Trusted reference";
  if (layer === "network_approved") return "Network approved";
  return "Organization policy";
}

export function knowledgeStatusLabel(status: string) {
  return status.replaceAll("_", " ");
}

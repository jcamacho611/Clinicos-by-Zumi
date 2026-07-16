import { z } from "zod";

const summarySchema = z.record(z.string(), z.string().min(1));

export const createHandoffSchema = z.object({
  patientId: z.string().min(1),
  receiverId: z.string().min(1),
  type: z.string().min(2).max(80),
  summary: summarySchema,
  requestedAction: z.string().min(8).max(500),
  priority: z.enum(["normal", "high", "urgent", "needs_provider"]),
  dueAt: z.coerce.date().optional(),
});

export const transitionHandoffSchema = z.object({
  action: z.enum(["acknowledge", "reject", "clarify", "resolve", "escalate"]),
  note: z.string().min(8).max(500),
});

export const transitionTaskSchema = z.object({
  action: z.enum(["complete", "reopen"]),
  note: z.string().min(8).max(500),
});

export const transitionEscalationSchema = z.object({
  action: z.enum(["acknowledge", "resolve", "reopen"]),
  note: z.string().min(8).max(500),
});

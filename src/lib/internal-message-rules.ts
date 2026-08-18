import { z } from "zod";

const optionalId = z.string().trim().min(1).max(128).optional().nullable();

export const createInternalThreadSchema = z.object({
  patientId: optionalId,
  subject: z.string().trim().min(3).max(160),
  category: z.string().trim().min(2).max(80).default("internal_coordination"),
  assignedTeam: z.string().trim().min(2).max(80).optional().nullable(),
  body: z.string().trim().min(1).max(5000),
});

export const createInternalMessageSchema = z.object({
  body: z.string().trim().min(1).max(5000),
});

export type CreateInternalThreadInput = z.infer<typeof createInternalThreadSchema>;
export type CreateInternalMessageInput = z.infer<typeof createInternalMessageSchema>;

import { z } from "zod";

const optionalId = z.string().trim().min(1).max(128).optional().nullable();

export const createTaskSchema = z.object({
  patientId: optionalId,
  ownerId: optionalId,
  category: z.string().trim().min(2).max(80),
  title: z.string().trim().min(3).max(200),
  details: z.string().trim().max(2000).optional().nullable(),
  priority: z.enum(["normal", "high", "urgent"]).default("normal"),
  dueAt: z.string().datetime({ offset: true }).optional().nullable(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

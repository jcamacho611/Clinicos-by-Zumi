import { z } from "zod";

export const createProviderConsultationSchema = z.object({
  patientId: z.string().min(1).optional(),
  consultantProviderId: z.string().min(1).optional(),
  specialty: z.string().trim().min(2).max(100),
  clinicalQuestion: z.string().trim().min(12).max(1000),
  priority: z.enum(["routine", "high", "urgent"]).default("routine"),
});

export const transitionProviderConsultationSchema = z.object({
  action: z.enum(["accept", "decline", "schedule", "close"]),
  note: z.string().trim().min(8).max(500),
  scheduledAt: z.string().datetime().optional(),
}).superRefine((value, context) => {
  if (value.action === "schedule" && !value.scheduledAt) context.addIssue({ code: "custom", path: ["scheduledAt"], message: "A consultation schedule time is required." });
});

export function consultationRisk(priority: string) {
  return priority === "urgent" ? "URGENT" : priority === "high" ? "NEEDS_PROVIDER" : "NORMAL";
}

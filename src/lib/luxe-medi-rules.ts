import { z } from "zod";

const serviceId = z.string().min(1);
const patientId = z.string().min(1);

export const createLuxeConsultationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional(),
  serviceId,
  patientId: patientId.optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const createLuxeTreatmentPlanSchema = z.object({
  patientId,
  serviceId,
  providerId: z.string().min(1).optional(),
  name: z.string().trim().min(3).max(160),
  goals: z.array(z.string().trim().min(2).max(160)).max(12).default([]),
  recommendedSessions: z.number().int().min(1).max(50).default(1),
});

export const createLuxeTreatmentSessionSchema = z.object({
  patientId,
  serviceId,
  treatmentPlanId: z.string().min(1).optional(),
  appointmentId: z.string().min(1).optional(),
  providerId: z.string().min(1).optional(),
  sessionNumber: z.number().int().min(1).max(50).default(1),
  scheduledAt: z.string().datetime().optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const createLuxePromotionSchema = z.object({
  serviceId: z.string().min(1).optional(),
  name: z.string().trim().min(3).max(120),
  code: z.string().trim().max(32).optional(),
  description: z.string().trim().max(500).optional(),
  discountCents: z.number().int().min(0).optional(),
  discountPercent: z.number().int().min(0).max(100).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
});

export const luxeWorkspaceActionSchema = z.discriminatedUnion("kind", [
  createLuxeConsultationSchema.extend({ kind: z.literal("consultation") }),
  createLuxeTreatmentPlanSchema.extend({ kind: z.literal("treatment_plan") }),
  createLuxeTreatmentSessionSchema.extend({ kind: z.literal("treatment_session") }),
  createLuxePromotionSchema.extend({ kind: z.literal("promotion") }),
]);

export const luxeTreatmentPlanTransitionSchema = z.object({
  action: z.enum(["approve_review", "reject_review", "activate", "complete", "cancel"]),
  note: z.string().trim().min(12).max(1000),
});

export const luxeTreatmentSessionTransitionSchema = z.object({
  action: z.enum(["complete", "cancel", "reschedule"]),
  note: z.string().trim().min(8).max(1000),
  scheduledAt: z.string().datetime().optional(),
});

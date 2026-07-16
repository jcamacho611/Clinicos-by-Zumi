import { z } from "zod";

export const createCareTeamSchema = z.object({
  patientId: z.string().trim().min(1),
  name: z.string().trim().min(3).max(180),
  sourceType: z.enum(["manual", "referral", "episode", "discharge", "patient_selected"]),
  sharedPlan: z.record(z.string(), z.unknown()).optional(),
});

export const addCareTeamMemberSchema = z.object({
  representedOrganizationId: z.string().trim().min(1),
  providerId: z.string().trim().min(1).optional().nullable(),
  userId: z.string().trim().min(1).optional().nullable(),
  role: z.string().trim().min(2).max(100),
  accessLevel: z.enum(["minimum_necessary", "care_coordination", "read_only"]).default("minimum_necessary"),
});

export const careTeamMemberTransitionSchema = z.object({
  action: z.enum(["accept", "remove", "reinstate"]),
  note: z.string().trim().min(8).max(600),
});

export const careTeamRoomTransitionSchema = z.object({
  action: z.enum(["close", "reopen"]),
  note: z.string().trim().min(8).max(600),
});

export const careTeamMessageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

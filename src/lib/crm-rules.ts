import { z } from "zod";

export const createLeadSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  source: z.enum(["website", "social", "phone", "referral", "walk_in", "reactivation", "other"]),
  campaignSource: z.string().trim().max(120).optional().nullable(),
  serviceInterest: z.string().trim().max(160).optional().nullable(),
  appointmentInterest: z.string().trim().max(160).optional().nullable(),
  estimatedValueCents: z.number().int().min(0).max(100_000_000).default(0),
  assignedTo: z.string().trim().max(120).optional().nullable(),
  followUpDueAt: z.string().datetime({ offset: true }).optional().nullable(),
  patientId: z.string().trim().min(1).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const transitionLeadSchema = z.object({
  action: z.enum(["contact", "book", "lose", "reactivate", "complete", "follow_up"]),
  note: z.string().trim().min(8).max(800),
  lostReason: z.string().trim().min(4).max(300).optional().nullable(),
  followUpDueAt: z.string().datetime({ offset: true }).optional().nullable(),
});

export const createLeadMessageSchema = z.object({
  channel: z.enum(["sms", "email", "phone", "website", "social", "internal"]),
  body: z.string().trim().min(2).max(4000),
  direction: z.enum(["INBOUND", "OUTBOUND", "INTERNAL"]).default("OUTBOUND"),
});

export function leadValueDollars(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

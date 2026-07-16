import { z } from "zod";

export const paymentSourceSchema = z.enum(["manual_cash", "manual_card", "stripe", "square", "payment_link"]);

export const createPaymentSchema = z.object({
  patientId: z.string().min(1),
  amountCents: z.number().int().positive().max(10_000_000),
  source: paymentSourceSchema.default("manual_card"),
  invoiceId: z.string().min(1).optional(),
  note: z.string().trim().max(500).optional(),
});

export const createPaymentLinkSchema = z.object({
  patientId: z.string().min(1),
  amountCents: z.number().int().positive().max(10_000_000),
  expiresInDays: z.number().int().min(1).max(30).default(7),
});

export const transitionPaymentSchema = z.object({
  action: z.enum(["fail", "refund"]),
  reason: z.string().trim().min(8).max(500),
});

export const createMembershipSchema = z.object({
  patientId: z.string().min(1),
  planId: z.string().min(1),
  source: paymentSourceSchema.default("manual_card"),
});

export const createPackagePurchaseSchema = z.object({
  patientId: z.string().min(1),
  packagePlanId: z.string().min(1),
  source: paymentSourceSchema.default("manual_card"),
});

export function paymentTransition(status: string, action: "fail" | "refund") {
  if (status === "pending" && action === "fail") return "failed";
  if (status === "posted" && action === "refund") return "refunded";
  return null;
}

export function canManagePayments(role: string) {
  return ["clinic_owner", "administrator", "front_desk", "biller"].includes(role);
}

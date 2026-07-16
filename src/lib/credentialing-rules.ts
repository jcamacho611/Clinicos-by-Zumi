import { z } from "zod";

export const providerCredentialSchema = z.object({
  providerId: z.string().min(1),
  type: z.string().trim().min(2).max(80),
  number: z.string().trim().min(2).max(120),
  state: z.string().trim().max(40).optional().nullable(),
  expiresAt: z.string().datetime({ offset: true }).optional().nullable(),
  verificationSource: z.string().trim().max(180).optional().nullable(),
  evidenceDocumentId: z.string().trim().max(120).optional().nullable(),
});

export const providerCredentialTransitionSchema = z.object({
  action: z.enum(["request_verification", "verify", "reject", "exception", "renew"]),
  note: z.string().trim().min(12).max(800),
  verificationSource: z.string().trim().max(180).optional().nullable(),
  expiresAt: z.string().datetime({ offset: true }).optional().nullable(),
  exceptionReason: z.string().trim().min(12).max(500).optional().nullable(),
}).superRefine((value, context) => {
  if (value.action === "exception" && !value.exceptionReason) {
    context.addIssue({ code: "custom", path: ["exceptionReason"], message: "An exception reason is required." });
  }
  if (value.action === "renew" && !value.expiresAt) {
    context.addIssue({ code: "custom", path: ["expiresAt"], message: "A renewal expiration date is required." });
  }
});

export const providerFacilityPrivilegeSchema = z.object({
  providerId: z.string().min(1),
  facilityId: z.string().min(1),
  expiresAt: z.string().datetime({ offset: true }).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const facilityPrivilegeTransitionSchema = z.object({
  action: z.enum(["grant", "suspend", "expire"]),
  note: z.string().trim().min(12).max(500),
  verificationSource: z.string().trim().max(180).optional().nullable(),
});

export function credentialNeedsAttention(status: string, expiresAt: Date | null, now = new Date()) {
  if (["rejected", "exception", "pending"].includes(status)) return true;
  return Boolean(expiresAt && expiresAt.getTime() <= now.getTime() + 60 * 24 * 60 * 60 * 1000);
}

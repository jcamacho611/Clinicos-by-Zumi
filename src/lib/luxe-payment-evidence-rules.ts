import { z } from "zod";

export const luxePaymentProviderSchema = z.enum(["godaddy_payments", "square", "stripe", "cash", "other"]);
export const luxePaymentKindSchema = z.enum(["deposit", "service_payment", "membership", "package", "other"]);
export const luxeEvidenceSourceSchema = z.enum(["processor_dashboard", "receipt", "bank_record", "cash_log", "other"]);

export const manualLuxePaymentEvidenceSchema = z.object({
  provider: luxePaymentProviderSchema,
  externalReference: z.string().trim().min(4).max(180),
  amountCents: z.number().int().positive().max(100_000_000),
  currency: z.literal("USD").default("USD"),
  paymentKind: luxePaymentKindSchema,
  evidenceSource: luxeEvidenceSourceSchema,
  receivedAt: z.string().datetime({ offset: true }),
  note: z.string().trim().min(8).max(800),
}).strict();

export type ManualLuxePaymentEvidence = z.infer<typeof manualLuxePaymentEvidenceSchema>;

export const LUXE_MANUAL_PAYMENT_EVENT = "payment_reconciled_manual";
export const LUXE_PROCESSOR_PAYMENT_EVENT = "payment_verified_processor";

export type LeadPaymentEvidenceFact = {
  leadId: string;
  eventType: string;
  amountCents: number;
  processorVerified: boolean;
  verificationMethod: "manual_reconciliation" | "processor_verification";
};

export function summarizeLeadPaymentEvidence(events: LeadPaymentEvidenceFact[]) {
  const manual = events
    .filter((event) => event.eventType === LUXE_MANUAL_PAYMENT_EVENT && !event.processorVerified && event.verificationMethod === "manual_reconciliation")
    .reduce((sum, event) => sum + event.amountCents, 0);
  const processor = events
    .filter((event) => event.eventType === LUXE_PROCESSOR_PAYMENT_EVENT && event.processorVerified && event.verificationMethod === "processor_verification")
    .reduce((sum, event) => sum + event.amountCents, 0);
  return {
    manualReconciledCents: manual,
    processorVerifiedCents: processor,
    collectedWithEvidenceCents: manual + processor,
  };
}

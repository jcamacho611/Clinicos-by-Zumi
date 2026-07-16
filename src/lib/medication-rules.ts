import { z } from "zod";

export const medicationSourceSchema = z.enum(["provider_entered", "patient_reported", "external_import"]);
export const medicationDeliveryMethodSchema = z.enum(["manual", "print", "fax", "electronic_adapter"]);

const optionalText = (max: number) => z.string().trim().min(1).max(max).optional();

export const createMedicationSchema = z.object({
  patientId: z.string().min(1),
  name: z.string().trim().min(2).max(180),
  genericName: optionalText(180),
  brandName: optionalText(180),
  rxNormCode: optionalText(40),
  strength: optionalText(80),
  dose: optionalText(120),
  frequency: optionalText(120),
  route: optionalText(80),
  quantity: optionalText(80),
  refillsAuthorized: z.coerce.number().int().min(0).max(99).optional(),
  indication: optionalText(500),
  source: medicationSourceSchema.default("patient_reported"),
  providerId: z.string().min(1).optional(),
  encounterId: z.string().min(1).optional(),
  pharmacyId: z.string().min(1).optional(),
  startDate: z.coerce.date().optional(),
}).superRefine((input, context) => {
  if (input.source === "provider_entered" && !input.providerId) {
    context.addIssue({ code: "custom", path: ["providerId"], message: "A provider is required for a provider-entered medication." });
  }
});

export const createReconciliationSchema = z.object({
  patientId: z.string().min(1),
  encounterId: z.string().min(1).optional(),
  medicationIds: z.array(z.string().min(1)).min(1).max(100),
  source: z.enum(["staff_review", "provider_review", "patient_confirmation", "external_import"]).default("staff_review"),
  summary: optionalText(2_000),
  discrepancies: z.array(z.object({
    medicationId: z.string().min(1).optional(),
    type: z.enum(["missing", "duplicate", "dose_difference", "frequency_difference", "patient_not_taking", "other"]),
    detail: z.string().trim().min(3).max(500),
  })).max(50).default([]),
});

export const reconciliationActionSchema = z.enum(["complete", "reopen"]);
export type ReconciliationAction = z.infer<typeof reconciliationActionSchema>;
export const transitionReconciliationSchema = z.object({
  action: reconciliationActionSchema,
  note: z.string().trim().min(8).max(1_000),
});

export function nextReconciliationStatus(status: string, action: ReconciliationAction) {
  if (action === "complete" && ["draft", "reopened"].includes(status)) return "completed";
  if (action === "reopen" && status === "completed") return "reopened";
  return null;
}

export const createRefillRequestSchema = z.object({
  patientId: z.string().min(1),
  medicationId: z.string().min(1),
  pharmacyId: z.string().min(1).optional(),
  providerId: z.string().min(1).optional(),
  requestSource: z.enum(["patient_portal", "phone", "sms", "staff", "pharmacy", "external_import"]).default("staff"),
  requestNote: optionalText(1_000),
  urgency: z.enum(["routine", "high", "urgent"]).default("routine"),
  quantityRequested: optionalText(80),
});

export const refillActionSchema = z.enum(["triage", "route_provider", "approve", "deny", "queue", "confirm_sent", "fail", "retry", "complete", "cancel"]);
export type RefillAction = z.infer<typeof refillActionSchema>;
export const transitionRefillSchema = z.object({
  action: refillActionSchema,
  note: optionalText(1_000),
  providerId: z.string().min(1).optional(),
  deliveryMethod: medicationDeliveryMethodSchema.optional(),
  integrationId: z.string().min(1).optional(),
  externalReference: optionalText(180),
  manualConfirmation: optionalText(500),
}).superRefine((input, context) => {
  if (["deny", "fail", "cancel"].includes(input.action) && (!input.note || input.note.length < 8)) {
    context.addIssue({ code: "custom", path: ["note"], message: "A reason of at least 8 characters is required." });
  }
  if (input.action === "confirm_sent" && !input.externalReference && !input.manualConfirmation) {
    context.addIssue({ code: "custom", path: ["manualConfirmation"], message: "A delivery reference or manual confirmation is required." });
  }
});

export function nextRefillStatus(status: string, action: RefillAction) {
  if (action === "triage" && status === "requested") return "triaged";
  if (action === "route_provider" && ["requested", "triaged"].includes(status)) return "needs_provider";
  if (action === "approve" && ["requested", "triaged", "needs_provider"].includes(status)) return "approved";
  if (action === "deny" && ["requested", "triaged", "needs_provider"].includes(status)) return "denied";
  if (action === "queue" && ["approved", "failed"].includes(status)) return "queued";
  if (action === "confirm_sent" && status === "queued") return "sent";
  if (action === "fail" && status === "queued") return "failed";
  if (action === "retry" && status === "failed") return "queued";
  if (action === "complete" && status === "sent") return "completed";
  if (action === "cancel" && !["completed", "denied", "cancelled"].includes(status)) return "cancelled";
  return null;
}

export const createPrescriptionSchema = z.object({
  patientId: z.string().min(1),
  medicationId: z.string().min(1),
  refillRequestId: z.string().min(1).optional(),
  providerId: z.string().min(1),
  pharmacyId: z.string().min(1).optional(),
  dosageInstructions: z.string().trim().min(3).max(1_000),
  quantity: z.string().trim().min(1).max(80),
  refills: z.coerce.number().int().min(0).max(99).default(0),
  daysSupply: z.coerce.number().int().min(1).max(365).optional(),
  controlledSubstance: z.boolean().default(false),
  deaSchedule: optionalText(16),
  deliveryMethod: medicationDeliveryMethodSchema.default("manual"),
  integrationId: z.string().min(1).optional(),
}).superRefine((input, context) => {
  if (input.deliveryMethod === "electronic_adapter" && !input.integrationId) {
    context.addIssue({ code: "custom", path: ["integrationId"], message: "An active e-prescribing integration is required." });
  }
  if (input.controlledSubstance && !input.deaSchedule) {
    context.addIssue({ code: "custom", path: ["deaSchedule"], message: "DEA schedule is required for controlled-substance workflow." });
  }
  if (input.controlledSubstance && input.deliveryMethod !== "electronic_adapter") {
    context.addIssue({ code: "custom", path: ["deliveryMethod"], message: "Controlled-substance transmission requires a verified EPCS adapter." });
  }
});

export const prescriptionActionSchema = z.enum(["approve", "queue", "confirm_sent", "fail", "retry", "complete", "cancel"]);
export type PrescriptionAction = z.infer<typeof prescriptionActionSchema>;
export const transitionPrescriptionSchema = z.object({
  action: prescriptionActionSchema,
  note: optionalText(1_000),
  externalReference: optionalText(180),
  manualConfirmation: optionalText(500),
}).superRefine((input, context) => {
  if (["fail", "cancel"].includes(input.action) && (!input.note || input.note.length < 8)) {
    context.addIssue({ code: "custom", path: ["note"], message: "A reason of at least 8 characters is required." });
  }
  if (input.action === "confirm_sent" && !input.externalReference && !input.manualConfirmation) {
    context.addIssue({ code: "custom", path: ["manualConfirmation"], message: "A delivery reference or manual confirmation is required." });
  }
});

export function nextPrescriptionStatus(status: string, action: PrescriptionAction) {
  if (action === "approve" && status === "draft") return "approved";
  if (action === "queue" && ["approved", "failed"].includes(status)) return "queued";
  if (action === "confirm_sent" && status === "queued") return "sent";
  if (action === "fail" && status === "queued") return "failed";
  if (action === "retry" && status === "failed") return "queued";
  if (action === "complete" && status === "sent") return "completed";
  if (action === "cancel" && !["sent", "completed", "cancelled"].includes(status)) return "cancelled";
  return null;
}

export const acknowledgeMedicationWarningSchema = z.object({
  reason: z.string().trim().min(12).max(1_000),
});

export function normalizeMedicationTerm(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function deterministicMedicationWarnings(input: {
  medicationId?: string;
  medicationName: string;
  allergies: Array<{ id: string; substance: string; reaction: string | null; severity: string | null }>;
  activeMedications: Array<{ id: string; name: string }>;
}) {
  const normalizedName = normalizeMedicationTerm(input.medicationName);
  const warnings: Array<{ warningType: string; severity: "warning" | "high" | "urgent"; summary: string; source: string; evidence: Record<string, string | null> }> = [];
  for (const allergy of input.allergies) {
    if (normalizeMedicationTerm(allergy.substance) !== normalizedName) continue;
    warnings.push({
      warningType: "exact_allergy_name_match",
      severity: allergy.severity === "severe" ? "urgent" : "high",
      summary: `Exact name match with recorded allergy: ${allergy.substance}. Provider review is required.`,
      source: "clinicos_exact_name_rule",
      evidence: { allergyId: allergy.id, substance: allergy.substance, reaction: allergy.reaction, recordedSeverity: allergy.severity },
    });
  }
  for (const medication of input.activeMedications) {
    if (medication.id === input.medicationId || normalizeMedicationTerm(medication.name) !== normalizedName) continue;
    warnings.push({
      warningType: "exact_active_duplicate",
      severity: "warning",
      summary: `Exact name match with another active medication record: ${medication.name}. Reconcile before approval.`,
      source: "clinicos_exact_name_rule",
      evidence: { duplicateMedicationId: medication.id, duplicateName: medication.name },
    });
  }
  return warnings;
}

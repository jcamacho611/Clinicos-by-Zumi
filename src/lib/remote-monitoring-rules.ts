import { z } from "zod";

export const remoteObservationTypeSchema = z.enum(["blood_pressure", "glucose", "weight", "pulse_oximetry", "symptom_check_in"]);

export const createRemoteObservationSchema = z.object({
  patientId: z.string().min(1),
  type: remoteObservationTypeSchema,
  value: z.string().trim().min(1).max(120),
  unit: z.string().trim().max(40).optional().nullable(),
  sourceType: z.enum(["patient_entered", "device_adapter"]),
  deviceId: z.string().trim().max(120).optional().nullable(),
  observedAt: z.string().datetime({ offset: true }),
  qualityFlag: z.string().trim().max(160).optional().nullable(),
  thresholdConfig: z.object({ label: z.string().trim().min(3).max(160), instruction: z.string().trim().min(8).max(500) }),
  consentConfirmed: z.literal(true),
});

export const reviewRemoteObservationSchema = z.object({
  action: z.enum(["review", "reject", "escalate"]),
  note: z.string().trim().min(12).max(2000),
});

export function remoteObservationLabel(type: string) {
  return type.replaceAll("_", " ");
}

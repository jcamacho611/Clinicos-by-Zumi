import { z } from "zod";

const optionalId = z.string().trim().min(1).max(128).optional();

export const createEncounterSchema = z.object({
  patientId: z.string().trim().min(1).max(128),
  providerId: optionalId,
  locationId: optionalId,
  appointmentId: optionalId,
  type: z.string().trim().min(2).max(120),
  serviceDate: z.string().datetime({ offset: true }),
  chiefComplaint: z.string().trim().max(2_000).optional(),
});

export const diagnosisInputSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z][0-9][0-9A-Z](?:\.[0-9A-Z]{1,4})?$/, "Enter a valid ICD-10 code."),
  label: z.string().trim().min(2).max(240),
  primary: z.boolean().default(false),
});

export const procedureInputSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[0-9A-Z]{4,7}$/, "Enter a valid CPT or HCPCS code."),
  label: z.string().trim().min(2).max(240),
  modifiers: z.array(z.string().trim().toUpperCase().regex(/^[0-9A-Z]{2}$/)).max(4).default([]),
});

export const encounterCodingSchema = z.object({
  diagnoses: z.array(diagnosisInputSchema).max(12),
  procedures: z.array(procedureInputSchema).max(20),
}).superRefine((value, context) => {
  if (new Set(value.diagnoses.map((item) => item.code)).size !== value.diagnoses.length) {
    context.addIssue({ code: "custom", message: "Diagnosis codes must be unique.", path: ["diagnoses"] });
  }
  if (value.diagnoses.filter((item) => item.primary).length > 1) {
    context.addIssue({ code: "custom", message: "Only one diagnosis can be primary.", path: ["diagnoses"] });
  }
});

export const encounterAddendumSchema = z.object({
  reason: z.string().trim().min(3).max(240),
  text: z.string().trim().min(3).max(20_000),
  attestation: z.literal(true, { error: "Confirm the addendum attestation." }),
});

export type CreateEncounterInput = z.infer<typeof createEncounterSchema>;
export type EncounterCodingInput = z.infer<typeof encounterCodingSchema>;
export type EncounterAddendumInput = z.infer<typeof encounterAddendumSchema>;

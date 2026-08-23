import { z } from "zod";
import { normalizeKlinikosPhone } from "@/lib/phone-normalization";

export function normalizePatientPhone(value: string) {
  const trimmed = value.trim();
  return trimmed ? normalizeKlinikosPhone(trimmed) : "";
}

const patientPhoneSchema = z.string().trim().max(40).optional().or(z.literal("")).transform((value, context) => {
  const normalized = normalizePatientPhone(value ?? "");
  if (normalized === null) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Enter a 10-digit US phone number or an international number beginning with + and country code.",
    });
    return z.NEVER;
  }
  return normalized;
});

export const patientCreateSchema = z.object({
  firstName: z.string().trim().min(1, "Enter the patient's first name.").max(80),
  lastName: z.string().trim().min(1, "Enter the patient's last name.").max(80),
  dateOfBirth: z.coerce.date().refine((value) => value <= new Date(), "Date of birth cannot be in the future."),
  sexAtBirth: z.string().trim().max(40).optional().or(z.literal("")),
  phone: patientPhoneSchema,
  email: z.string().trim().email("Enter a valid email address.").max(254).optional().or(z.literal("")),
  preferredLanguage: z.string().trim().min(1).max(80).default("English"),
});

export type PatientCreateInput = z.infer<typeof patientCreateSchema>;

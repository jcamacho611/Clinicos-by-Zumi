import { z } from "zod";

export function normalizePatientPhone(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("+")) {
    const digits = trimmed.slice(1).replace(/[^0-9]/g, "");
    const normalized = `+${digits}`;
    return /^\+[1-9]\d{7,14}$/.test(normalized) ? normalized : null;
  }

  // Klinikos is currently US-first. A bare 10-digit value is safe to normalize to +1.
  // Other countries must be supplied explicitly in E.164 form rather than guessed.
  const digits = trimmed.replace(/[^0-9]/g, "");
  return /^\d{10}$/.test(digits) ? `+1${digits}` : null;
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

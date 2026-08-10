import { z } from "zod";

export const patientCreateSchema = z.object({
  firstName: z.string().trim().min(1, "Enter the patient's first name.").max(80),
  lastName: z.string().trim().min(1, "Enter the patient's last name.").max(80),
  dateOfBirth: z.coerce.date().refine((value) => value <= new Date(), "Date of birth cannot be in the future."),
  sexAtBirth: z.string().trim().max(40).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email address.").max(254).optional().or(z.literal("")),
  preferredLanguage: z.string().trim().min(1).max(80).default("English"),
});

export type PatientCreateInput = z.infer<typeof patientCreateSchema>;

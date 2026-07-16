import { z } from "zod";

export const refreshPassportSchema = z.object({ patientId: z.string().min(1) });

export const updateConsentWalletSchema = z.object({
  patientId: z.string().min(1),
  sharingDefaults: z.record(z.string(), z.string()).refine((value) => Object.keys(value).length > 0, "At least one sharing preference is required."),
  emergencyPreference: z.enum(["allow_break_glass_with_alert", "require_explicit_approval", "blocked"]),
});

export const confirmIntakePassportSchema = z.object({
  patientId: z.string().min(1),
  reusableFields: z.record(z.string(), z.unknown()).refine((value) => Object.keys(value).length > 0, "Reusable intake fields cannot be empty."),
});

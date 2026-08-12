import { z } from "zod";

export const clinicPurchasablePlanKeys = ["clinic_core", "clinic_growth", "clinic_scale"] as const;
export type ClinicPurchasablePlanKey = (typeof clinicPurchasablePlanKeys)[number];

export const clinicCheckoutRequestSchema = z.object({
  clinicName: z.string().trim().min(2).max(140),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  productKey: z.enum(clinicPurchasablePlanKeys),
});

export const clinicActivationSchema = z.object({
  token: z.string().trim().min(20).max(4096),
  ownerName: z.string().trim().min(2).max(120),
  password: z.string().min(12).max(200)
    .refine((value) => /[A-Z]/.test(value), "Password needs an uppercase letter.")
    .refine((value) => /[a-z]/.test(value), "Password needs a lowercase letter.")
    .refine((value) => /\d/.test(value), "Password needs a number."),
  clinicType: z.string().trim().min(2).max(100),
  locationName: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().length(2).transform((value) => value.toUpperCase()),
  timezone: z.string().trim().min(3).max(80),
  teamSize: z.string().trim().min(1).max(50),
  primaryGoal: z.string().trim().min(3).max(500),
  currentSystems: z.string().trim().max(1200).default(""),
  migrationExpectation: z.enum(["not_now", "manual_import", "assisted_import", "needs_review"]),
  communicationsState: z.enum(["not_connected", "manual_fallback", "existing_vendor", "needs_review"]),
  acceptTerms: z.literal(true),
  syntheticDataOnly: z.literal(true),
});

export type ClinicActivationInput = z.infer<typeof clinicActivationSchema>;

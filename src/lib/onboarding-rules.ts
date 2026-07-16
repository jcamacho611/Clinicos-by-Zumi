import { z } from "zod";

export const clinicTypeOptions = [
  "Primary Care",
  "Urgent Care",
  "Specialty Practice",
  "Diagnostic Provider",
  "No-Fault / Workers' Compensation",
  "Multi-Location Group",
  "Med Spa",
] as const;

export const teamSizeOptions = ["1-5", "6-15", "16-50", "51+"] as const;

export const primaryGoalOptions = [
  "Launch a complete clinic workspace",
  "Replace disconnected office tools",
  "Improve clinical and revenue follow-through",
  "Coordinate referrals and connected care",
  "Prepare a multi-location organization",
] as const;

export const defaultAppointmentTypes = [
  { name: "New patient visit", durationMinutes: 45, color: "sky", telemedicine: false },
  { name: "Established patient follow-up", durationMinutes: 30, color: "teal", telemedicine: false },
  { name: "Telemedicine visit", durationMinutes: 30, color: "indigo", telemedicine: true },
] as const;

export const pendingConnectorTemplates = [
  { type: "payments", vendor: "Stripe", riskLevel: "medium", baaRequired: false },
  { type: "communications", vendor: "Twilio", riskLevel: "high", baaRequired: true },
  { type: "email", vendor: "Resend or approved email provider", riskLevel: "high", baaRequired: true },
  { type: "lab", vendor: "Laboratory interface", riskLevel: "high", baaRequired: true },
  { type: "imaging", vendor: "Imaging and radiology interface", riskLevel: "high", baaRequired: true },
  { type: "clearinghouse", vendor: "Claims clearinghouse", riskLevel: "high", baaRequired: true },
  { type: "e_prescribing", vendor: "E-prescribing network", riskLevel: "high", baaRequired: true },
  { type: "telemedicine", vendor: "Compliant video provider", riskLevel: "high", baaRequired: true },
] as const;

export const onboardingSchema = z.object({
  organizationName: z.string().trim().min(2, "Enter your organization name.").max(120),
  clinicType: z.enum(clinicTypeOptions),
  locationName: z.string().trim().min(2, "Enter the primary location name.").max(120),
  city: z.string().trim().min(2, "Enter the city.").max(80),
  state: z.string().trim().length(2, "Use the two-letter state code.").transform((value) => value.toUpperCase()),
  timezone: z.string().trim().min(3).max(80).default("America/New_York"),
  teamSize: z.enum(teamSizeOptions),
  ownerName: z.string().trim().min(2, "Enter your full name.").max(120),
  email: z.string().trim().email("Enter a valid email address.").max(254).transform((value) => value.toLowerCase()),
  password: z.string()
    .min(12, "Use at least 12 characters.")
    .max(256)
    .regex(/[a-z]/, "Add a lowercase letter.")
    .regex(/[A-Z]/, "Add an uppercase letter.")
    .regex(/[0-9]/, "Add a number.")
    .regex(/[^A-Za-z0-9]/, "Add a symbol."),
  primaryGoal: z.enum(primaryGoalOptions),
  acceptTerms: z.literal(true, { error: "Accept the service terms to continue." }),
  syntheticDataOnly: z.literal(true, { error: "Confirm the synthetic-data safety boundary." }),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

const reservedOrganizationSlugs = new Set([
  "api", "app", "admin", "login", "logout", "start", "portal", "support", "settings", "clinicos", "zumi",
]);

export function slugifyOrganizationName(value: string) {
  const slug = value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 56);
  if (!slug || reservedOrganizationSlugs.has(slug)) return `${slug || "clinic"}-workspace`;
  return slug;
}

export function onboardingErrorMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Review the onboarding information and try again.";
}

import { z } from "zod";

export const LUXE_BOOKING_VERIFIED_MANUAL_EVENT = "booking_verified_manual";

export const luxeBookingProviderSchema = z.enum([
  "godaddy_booking",
  "internal_scheduler",
  "phone_confirmation",
  "other",
]);

export const luxeBookingEvidenceSourceSchema = z.enum([
  "booking_dashboard",
  "confirmation_email",
  "internal_scheduler",
  "staff_phone_confirmation",
  "other_authoritative_source",
]);

export const manualLuxeBookingEvidenceSchema = z.object({
  provider: luxeBookingProviderSchema,
  externalReference: z.string().trim().min(4).max(180),
  scheduledAt: z.string().datetime({ offset: true }),
  evidenceSource: luxeBookingEvidenceSourceSchema,
  receivedAt: z.string().datetime({ offset: true }),
  note: z.string().trim().min(8).max(800),
}).strict();

export type ManualLuxeBookingEvidenceInput = z.infer<typeof manualLuxeBookingEvidenceSchema>;

export function luxeBookingEvidenceRequiredForOrganization(
  organizationSlug: string,
  configuredSlug = process.env.LUXE_MEDI_ORGANIZATION_SLUG?.trim() || "luxe-medi",
) {
  return organizationSlug === configuredSlug;
}

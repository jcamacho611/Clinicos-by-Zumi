import { z } from "zod";

export const networkInvitationSchema = z.object({
  targetOrganizationId: z.string().trim().min(1).optional().nullable(),
  inviteeType: z.enum(["clinic", "provider", "referral_partner", "diagnostic_partner", "lab_partner", "pharmacy_partner", "hospital_partner"]),
  inviteeName: z.string().trim().min(2).max(180),
  inviteeEmail: z.string().trim().email().optional().nullable(),
  specialty: z.string().trim().max(120).optional().nullable(),
  location: z.string().trim().max(160).optional().nullable(),
  expiresAt: z.string().datetime({ offset: true }).optional().nullable(),
  notes: z.string().trim().max(1200).optional().nullable(),
});

export const networkInvitationTransitionSchema = z.object({
  action: z.enum(["verify", "accept", "reject", "cancel", "suspend", "restore"]),
  note: z.string().trim().min(8).max(600),
});

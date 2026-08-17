import { z } from "zod";

const optionalId = z.string().trim().min(1).max(128).optional().nullable();

export const createAppointmentSchema = z.object({
  patientId: z.string().trim().min(1).max(128),
  providerId: optionalId,
  locationId: optionalId,
  appointmentTypeId: optionalId,
  startsAt: z.string().datetime({ offset: true }),
  telemedicine: z.boolean().optional().default(false),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export function intervalsOverlap(
  leftStart: Date | string,
  leftEnd: Date | string,
  rightStart: Date | string,
  rightEnd: Date | string,
) {
  const leftStartMs = new Date(leftStart).getTime();
  const leftEndMs = new Date(leftEnd).getTime();
  const rightStartMs = new Date(rightStart).getTime();
  const rightEndMs = new Date(rightEnd).getTime();
  return leftStartMs < rightEndMs && leftEndMs > rightStartMs;
}

export function appointmentEndFromDuration(startsAt: Date, durationMinutes: number) {
  if (!Number.isInteger(durationMinutes) || durationMinutes < 5 || durationMinutes > 480) {
    throw new Error("Appointment duration must be between 5 and 480 minutes.");
  }
  return new Date(startsAt.getTime() + durationMinutes * 60_000);
}

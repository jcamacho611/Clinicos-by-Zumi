import "server-only";

import { AppointmentStatus, Prisma } from "@prisma/client";
import { appointmentEndFromDuration, type CreateAppointmentInput } from "@/lib/appointment-create-rules";
import { db } from "@/lib/db";
import { findAppointmentForOrganization } from "@/lib/repositories/appointment-repository";

interface AppointmentMutationActor {
  userId: string;
  name: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function listAppointmentCreationOptions(organizationId: string) {
  const [patients, providers, locations, appointmentTypes] = await Promise.all([
    db.patient.findMany({
      where: { organizationId, status: "active" },
      select: { id: true, firstName: true, lastName: true, mrn: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    db.provider.findMany({
      where: { organizationId, status: "active" },
      select: { id: true, name: true, credential: true },
      orderBy: { name: "asc" },
    }),
    db.location.findMany({
      where: { organizationId, status: "active" },
      select: { id: true, name: true, timezone: true },
      orderBy: { name: "asc" },
    }),
    db.appointmentType.findMany({
      where: { organizationId, status: "active" },
      select: { id: true, name: true, durationMinutes: true, telemedicine: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    patients: patients.map((patient) => ({ id: patient.id, name: `${patient.firstName} ${patient.lastName}`, mrn: patient.mrn })),
    providers: providers.map((provider) => ({ id: provider.id, name: `${provider.name}, ${provider.credential}` })),
    locations,
    appointmentTypes,
  };
}

function isSerializableRetry(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

export async function createAppointmentForOrganization(input: {
  organizationId: string;
  fields: CreateAppointmentInput;
  actor: AppointmentMutationActor;
}) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const result = await db.$transaction(async (transaction) => {
        const patient = await transaction.patient.findFirst({
          where: { id: input.fields.patientId, organizationId: input.organizationId, status: "active" },
          select: { id: true },
        });
        if (!patient) return { kind: "patient_not_found" as const };

        const provider = input.fields.providerId
          ? await transaction.provider.findFirst({
              where: { id: input.fields.providerId, organizationId: input.organizationId, status: "active" },
              select: { id: true },
            })
          : null;
        if (input.fields.providerId && !provider) return { kind: "provider_not_found" as const };

        const location = input.fields.locationId
          ? await transaction.location.findFirst({
              where: { id: input.fields.locationId, organizationId: input.organizationId, status: "active" },
              select: { id: true },
            })
          : null;
        if (input.fields.locationId && !location) return { kind: "location_not_found" as const };

        const appointmentType = input.fields.appointmentTypeId
          ? await transaction.appointmentType.findFirst({
              where: { id: input.fields.appointmentTypeId, organizationId: input.organizationId, status: "active" },
              select: { id: true, name: true, durationMinutes: true, telemedicine: true },
            })
          : null;
        if (input.fields.appointmentTypeId && !appointmentType) return { kind: "appointment_type_not_found" as const };

        const startsAt = new Date(input.fields.startsAt);
        if (!Number.isFinite(startsAt.getTime())) return { kind: "invalid_time" as const };
        const durationMinutes = appointmentType?.durationMinutes ?? 30;
        if (!Number.isInteger(durationMinutes) || durationMinutes < 5 || durationMinutes > 480) {
          return { kind: "invalid_duration" as const };
        }
        const endsAt = appointmentEndFromDuration(startsAt, durationMinutes);

        const conflict = await transaction.appointment.findFirst({
          where: {
            organizationId: input.organizationId,
            status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.RESCHEDULED] },
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
            OR: [
              { patientId: patient.id },
              ...(provider ? [{ providerId: provider.id }] : []),
            ],
          },
          select: { id: true, patientId: true, providerId: true, startsAt: true, endsAt: true },
          orderBy: { startsAt: "asc" },
        });

        if (conflict) {
          const reason = conflict.patientId === patient.id && provider && conflict.providerId === provider.id
            ? "patient_and_provider"
            : conflict.patientId === patient.id
              ? "patient"
              : "provider";
          return { kind: "schedule_conflict" as const, reason, conflictingAppointmentId: conflict.id };
        }

        const appointment = await transaction.appointment.create({
          data: {
            organizationId: input.organizationId,
            patientId: patient.id,
            providerId: provider?.id ?? null,
            locationId: location?.id ?? null,
            appointmentTypeId: appointmentType?.id ?? null,
            startsAt,
            endsAt,
            telemedicine: appointmentType?.telemedicine ?? input.fields.telemedicine,
            notes: input.fields.notes || null,
            createdBy: input.actor.userId,
            updatedBy: input.actor.userId,
          },
          select: { id: true },
        });

        await transaction.auditLog.create({
          data: {
            organizationId: input.organizationId,
            actorId: input.actor.userId,
            actorType: "user",
            action: "appointment.created",
            resourceType: "appointment",
            resourceId: appointment.id,
            patientId: patient.id,
            ipAddress: input.actor.ipAddress,
            userAgent: input.actor.userAgent,
            metadata: {
              actorName: input.actor.name,
              providerId: provider?.id ?? null,
              locationId: location?.id ?? null,
              appointmentTypeId: appointmentType?.id ?? null,
              appointmentTypeName: appointmentType?.name ?? null,
              startsAt: startsAt.toISOString(),
              endsAt: endsAt.toISOString(),
              durationMinutes,
              telemedicine: appointmentType?.telemedicine ?? input.fields.telemedicine,
              overlapCheck: "patient_and_provider",
            },
          },
        });

        return { kind: "created" as const, appointmentId: appointment.id };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

      if (result.kind !== "created") return result;
      return {
        kind: "created" as const,
        appointment: await findAppointmentForOrganization(result.appointmentId, input.organizationId),
      };
    } catch (error) {
      if (isSerializableRetry(error) && attempt < 2) continue;
      if (isSerializableRetry(error)) return { kind: "schedule_conflict" as const, reason: "concurrent_change" as const };
      throw error;
    }
  }

  return { kind: "schedule_conflict" as const, reason: "concurrent_change" as const };
}

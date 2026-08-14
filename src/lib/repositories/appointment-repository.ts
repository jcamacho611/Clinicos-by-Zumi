import "server-only";

import { AppointmentStatus as PrismaAppointmentStatus } from "@prisma/client";
import {
  appointmentStatusLabel,
  canTransitionAppointment,
  type AppointmentStatusKey,
} from "@/lib/appointment-lifecycle";
import { db } from "@/lib/db";
import {
  mapAppointmentAggregate,
  type AppointmentAggregate,
} from "@/lib/repositories/appointment-mapper";
import type { Appointment } from "@/lib/types";

interface AppointmentQueryOptions {
  from?: Date;
  to?: Date;
  providerUserId?: string;
}

interface AppointmentMutationActor {
  userId: string;
  name: string;
  ipAddress?: string;
  userAgent?: string;
}

async function loadAppointmentAggregates(
  organizationId: string,
  options: AppointmentQueryOptions = {},
  appointmentId?: string,
): Promise<AppointmentAggregate[]> {
  let scopedProviderId: string | undefined;
  if (options.providerUserId) {
    const provider = await db.provider.findFirst({
      where: {
        organizationId,
        userId: options.providerUserId,
        status: "active",
      },
      select: { id: true },
    });
    if (!provider) return [];
    scopedProviderId = provider.id;
  }

  const appointments = await db.appointment.findMany({
    where: {
      organizationId,
      patient: { organizationId },
      ...(scopedProviderId ? { providerId: scopedProviderId } : {}),
      ...(appointmentId ? { id: appointmentId } : {}),
      ...(options.from || options.to
        ? { startsAt: { ...(options.from ? { gte: options.from } : {}), ...(options.to ? { lte: options.to } : {}) } }
        : {}),
    },
    include: { patient: true },
    orderBy: { startsAt: "asc" },
  });

  if (appointments.length === 0) return [];

  const providerIds = appointments.flatMap((appointment) => appointment.providerId ? [appointment.providerId] : []);
  const locationIds = appointments.flatMap((appointment) => appointment.locationId ? [appointment.locationId] : []);
  const typeIds = appointments.flatMap((appointment) => appointment.appointmentTypeId ? [appointment.appointmentTypeId] : []);
  const appointmentIds = appointments.map((appointment) => appointment.id);

  const [providers, locations, appointmentTypes, encounters] = await Promise.all([
    db.provider.findMany({ where: { organizationId, id: { in: providerIds } } }),
    db.location.findMany({ where: { organizationId, id: { in: locationIds } } }),
    db.appointmentType.findMany({ where: { organizationId, id: { in: typeIds } } }),
    db.encounter.findMany({ where: { organizationId, appointmentId: { in: appointmentIds } } }),
  ]);

  return appointments.map((appointment) => ({
    appointment,
    patient: appointment.patient,
    provider: appointment.providerId ? providers.find((provider) => provider.id === appointment.providerId) : undefined,
    location: appointment.locationId ? locations.find((location) => location.id === appointment.locationId) : undefined,
    appointmentType: appointment.appointmentTypeId
      ? appointmentTypes.find((type) => type.id === appointment.appointmentTypeId)
      : undefined,
    encounterType: encounters.find((encounter) => encounter.appointmentId === appointment.id)?.type,
  }));
}

export async function listAppointmentsForOrganization(
  organizationId: string,
  options: AppointmentQueryOptions = {},
): Promise<Appointment[]> {
  return (await loadAppointmentAggregates(organizationId, options)).map((aggregate) => mapAppointmentAggregate(aggregate));
}

export async function findAppointmentForOrganization(appointmentId: string, organizationId: string) {
  const aggregate = (await loadAppointmentAggregates(organizationId, {}, appointmentId))[0];
  return aggregate ? mapAppointmentAggregate(aggregate) : null;
}

export async function transitionAppointmentForOrganization(input: {
  appointmentId: string;
  organizationId: string;
  targetStatus: AppointmentStatusKey;
  actor: AppointmentMutationActor;
}) {
  const result = await db.$transaction(async (transaction) => {
    const current = await transaction.appointment.findFirst({
      where: {
        id: input.appointmentId,
        organizationId: input.organizationId,
        patient: { organizationId: input.organizationId },
      },
    });

    if (!current) return { kind: "not_found" as const };
    if (!canTransitionAppointment(current.status, input.targetStatus)) {
      return {
        kind: "invalid_transition" as const,
        currentStatus: appointmentStatusLabel(current.status),
      };
    }

    const update = await transaction.appointment.updateMany({
      where: { id: current.id, organizationId: input.organizationId, status: current.status },
      data: {
        status: input.targetStatus as PrismaAppointmentStatus,
        updatedBy: input.actor.userId,
      },
    });

    if (update.count !== 1) return { kind: "conflict" as const };

    await transaction.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorId: input.actor.userId,
        actorType: "user",
        action: "appointment.status_changed",
        resourceType: "appointment",
        resourceId: current.id,
        patientId: current.patientId,
        ipAddress: input.actor.ipAddress,
        userAgent: input.actor.userAgent,
        changes: {
          status: {
            from: appointmentStatusLabel(current.status),
            to: appointmentStatusLabel(input.targetStatus),
          },
        },
        metadata: { actorName: input.actor.name },
      },
    });

    return { kind: "updated" as const };
  });

  if (result.kind !== "updated") return result;
  return {
    kind: "updated" as const,
    appointment: await findAppointmentForOrganization(input.appointmentId, input.organizationId),
  };
}

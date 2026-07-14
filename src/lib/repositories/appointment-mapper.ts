import { appointmentStatusLabel } from "@/lib/appointment-lifecycle";
import type { Appointment } from "@/lib/types";

export interface AppointmentAggregate {
  appointment: {
    id: string;
    organizationId: string;
    patientId: string;
    startsAt: Date;
    endsAt: Date;
    status: string;
    telemedicine: boolean;
    formsComplete: boolean;
    insuranceVerified: boolean;
    paymentDueCents: number;
  };
  patient: { firstName: string; lastName: string };
  provider?: { name: string; credential: string };
  location?: { name: string; timezone: string };
  appointmentType?: { name: string };
  encounterType?: string;
}

function formatDay(value: Date, now: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: timezone });
  const valueDay = formatter.format(value);
  return valueDay === formatter.format(now) ? "Today" : valueDay;
}

function formatTime(value: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  }).format(value);
}

export function mapAppointmentAggregate(aggregate: AppointmentAggregate, now = new Date()): Appointment {
  const { appointment, patient } = aggregate;
  const timezone = aggregate.location?.timezone ?? "America/New_York";
  const initials = `${patient.firstName[0] ?? ""}${patient.lastName[0] ?? ""}`.toUpperCase();

  return {
    id: appointment.id,
    organizationId: appointment.organizationId,
    patientId: appointment.patientId,
    patient: `${patient.firstName} ${patient.lastName}`,
    initials,
    time: formatTime(appointment.startsAt, timezone),
    endTime: formatTime(appointment.endsAt, timezone),
    date: formatDay(appointment.startsAt, now, timezone),
    type: aggregate.appointmentType?.name
      ?? aggregate.encounterType
      ?? (appointment.telemedicine ? "Telemedicine visit" : "Office visit"),
    provider: aggregate.provider
      ? `${aggregate.provider.name}, ${aggregate.provider.credential}`
      : "Unassigned",
    location: aggregate.location?.name ?? "Unassigned",
    status: appointmentStatusLabel(appointment.status),
    telemedicine: appointment.telemedicine,
    formsComplete: appointment.formsComplete,
    insuranceVerified: appointment.insuranceVerified,
    paymentDue: appointment.paymentDueCents / 100,
    startsAt: appointment.startsAt.toISOString(),
    endsAt: appointment.endsAt.toISOString(),
  };
}

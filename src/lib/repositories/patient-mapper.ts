import type { Patient, RiskLevel } from "@/lib/types";

interface PatientRecord {
  id: string;
  organizationId: string;
  locationId: string | null;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  sexAtBirth: string | null;
  pronouns: string | null;
  phone: string | null;
  email: string | null;
  preferredLanguage: string;
  portalStatus: string;
  riskLevel: string;
  requiresHumanReview: boolean;
}

export interface PatientAggregate {
  patient: PatientRecord;
  insurance?: { payer: string; planName: string | null; memberId: string };
  verification?: { copayCents: number | null };
  balance?: { balanceCents: number };
  appointment?: { startsAt: Date; providerId: string | null };
  encounter?: { serviceDate: Date };
  provider?: { name: string; credential: string };
  location?: { name: string; timezone: string };
  allergies: Array<{ substance: string; reaction: string | null }>;
  medications: Array<{ name: string; dose: string | null; frequency: string | null }>;
  problems: Array<{ label: string }>;
}

const riskLabels: Record<string, RiskLevel> = {
  NORMAL: "Normal",
  NEEDS_STAFF: "Needs Staff",
  NEEDS_PROVIDER: "Needs Provider",
  URGENT: "Urgent",
  DO_NOT_AUTOMATE: "Do Not Automate",
};

function ageAt(dateOfBirth: Date, now: Date) {
  let age = now.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const beforeBirthday = now.getUTCMonth() < dateOfBirth.getUTCMonth()
    || (now.getUTCMonth() === dateOfBirth.getUTCMonth() && now.getUTCDate() < dateOfBirth.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

function portalStatus(value: string): Patient["portalStatus"] {
  if (value.toLowerCase() === "active") return "Active";
  if (value.toLowerCase() === "invited") return "Invited";
  return "Inactive";
}

function appointmentLabel(startsAt: Date, now: Date, timezone: string) {
  const dayFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: timezone });
  const timeFormatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: timezone });
  const appointmentDay = dayFormatter.format(startsAt);
  const today = dayFormatter.format(now);
  return `${appointmentDay === today ? "Today" : appointmentDay}, ${timeFormatter.format(startsAt)}`;
}

export function mapPatientAggregate(aggregate: PatientAggregate, now = new Date()): Patient {
  const { patient } = aggregate;
  const riskLevel = riskLabels[patient.riskLevel] ?? "Normal";
  const timezone = aggregate.location?.timezone ?? "America/New_York";
  const riskFlags = [
    ...(patient.requiresHumanReview ? ["Human review required"] : []),
    ...(riskLevel === "Urgent" ? ["Urgent follow-up"] : []),
  ];

  return {
    id: patient.id,
    organizationId: patient.organizationId,
    mrn: patient.mrn,
    firstName: patient.firstName,
    lastName: patient.lastName,
    initials: `${patient.firstName[0] ?? ""}${patient.lastName[0] ?? ""}`.toUpperCase(),
    dob: patient.dateOfBirth.toISOString().slice(0, 10),
    age: ageAt(patient.dateOfBirth, now),
    sex: patient.sexAtBirth ?? "Not recorded",
    pronouns: patient.pronouns ?? "Not recorded",
    phone: patient.phone ?? "Not on file",
    email: patient.email ?? "Not on file",
    preferredLanguage: patient.preferredLanguage,
    insurance: aggregate.insurance?.payer ?? "Not on file",
    plan: aggregate.insurance?.planName ?? "Not on file",
    memberId: aggregate.insurance?.memberId ?? "Not on file",
    copay: (aggregate.verification?.copayCents ?? 0) / 100,
    balance: (aggregate.balance?.balanceCents ?? 0) / 100,
    portalStatus: portalStatus(patient.portalStatus),
    riskLevel,
    riskFlags,
    nextAppointment: aggregate.appointment
      ? appointmentLabel(aggregate.appointment.startsAt, now, timezone)
      : "Not scheduled",
    provider: aggregate.provider
      ? `${aggregate.provider.name}, ${aggregate.provider.credential}`
      : "Unassigned",
    location: aggregate.location?.name ?? "Not assigned",
    allergies: aggregate.allergies.length > 0
      ? aggregate.allergies.map((allergy) => `${allergy.substance}${allergy.reaction ? ` - ${allergy.reaction}` : ""}`)
      : ["No known drug allergies"],
    medications: aggregate.medications.map((medication) => [medication.name, medication.dose, medication.frequency].filter(Boolean).join(" ")),
    problems: aggregate.problems.map((problem) => problem.label),
    lastVisit: aggregate.encounter
      ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: timezone }).format(aggregate.encounter.serviceDate)
      : "New patient",
  };
}

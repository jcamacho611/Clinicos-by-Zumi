import { encounterStatusLabel } from "@/lib/encounter-lifecycle";
import type { Encounter, EncounterAuditEvent } from "@/lib/types";

interface AuditRecord {
  id: string;
  action: string;
  actorId: string | null;
  actorType: string;
  metadata: unknown;
  createdAt: Date;
}

export interface EncounterAggregate {
  encounter: {
    id: string;
    organizationId: string;
    patientId: string;
    type: string;
    serviceDate: Date;
    status: string;
    chiefComplaint: string | null;
    hpi: string | null;
    assessment: string | null;
    plan: string | null;
    patientInstructions: string | null;
    followUpPlan: string | null;
    requiresCosignature: boolean;
  };
  patient: { firstName: string; lastName: string; mrn: string };
  provider?: { name: string; credential: string };
  soapNote?: {
    subjective: string | null;
    objective: string | null;
    assessment: string | null;
    plan: string | null;
  };
  diagnoses: Array<{ code: string; label: string; primary: boolean }>;
  procedures: Array<{ code: string; label: string; modifiers: string[] }>;
  addenda: Array<{ id: string; content: unknown; signedBy: string | null; signedAt: Date | null; createdAt: Date }>;
  addendumAuthors: Array<{ id: string; name: string }>;
  auditHistory: AuditRecord[];
}

function mapAddendum(addendum: EncounterAggregate["addenda"][number], authors: EncounterAggregate["addendumAuthors"]) {
  const content = addendum.content && typeof addendum.content === "object"
    ? addendum.content as { reason?: unknown; text?: unknown }
    : {};
  return {
    id: addendum.id,
    reason: typeof content.reason === "string" ? content.reason : "Clinical clarification",
    text: typeof content.text === "string" ? content.text : "",
    author: authors.find((author) => author.id === addendum.signedBy)?.name ?? addendum.signedBy ?? "Authorized clinician",
    signedAt: (addendum.signedAt ?? addendum.createdAt).toISOString(),
  };
}

function actorName(record: AuditRecord) {
  if (record.metadata && typeof record.metadata === "object" && "actorName" in record.metadata) {
    const value = (record.metadata as { actorName?: unknown }).actorName;
    if (typeof value === "string" && value.trim()) return value;
  }
  return record.actorId ?? record.actorType;
}

function mapAudit(record: AuditRecord): EncounterAuditEvent {
  return {
    id: record.id,
    action: record.action.split(".").at(-1)?.replaceAll("_", " ") ?? record.action,
    actor: actorName(record),
    timestamp: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
    }).format(record.createdAt),
  };
}

export function mapEncounterAggregate(aggregate: EncounterAggregate): Encounter {
  const { encounter, patient } = aggregate;
  const initials = `${patient.firstName[0] ?? ""}${patient.lastName[0] ?? ""}`.toUpperCase();

  return {
    id: encounter.id,
    organizationId: encounter.organizationId,
    patientId: encounter.patientId,
    patientName: `${patient.firstName} ${patient.lastName}`,
    patientInitials: initials,
    patientMrn: patient.mrn,
    date: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "America/New_York",
    }).format(encounter.serviceDate),
    type: encounter.type,
    provider: aggregate.provider
      ? `${aggregate.provider.name}, ${aggregate.provider.credential}`
      : "Unassigned",
    status: encounterStatusLabel(encounter.status),
    chiefComplaint: encounter.chiefComplaint ?? "",
    hpi: encounter.hpi ?? "",
    subjective: aggregate.soapNote?.subjective ?? "",
    objective: aggregate.soapNote?.objective ?? "",
    assessment: aggregate.soapNote?.assessment ?? encounter.assessment ?? "",
    plan: aggregate.soapNote?.plan ?? encounter.plan ?? "",
    diagnoses: aggregate.diagnoses,
    procedures: aggregate.procedures,
    patientInstructions: encounter.patientInstructions ?? "",
    followUp: encounter.followUpPlan ?? "",
    requiresCosignature: encounter.requiresCosignature,
    addenda: aggregate.addenda.map((addendum) => mapAddendum(addendum, aggregate.addendumAuthors)),
    auditHistory: aggregate.auditHistory.map(mapAudit),
  };
}

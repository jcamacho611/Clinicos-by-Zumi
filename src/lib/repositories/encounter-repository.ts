import "server-only";

import { EncounterStatus as PrismaEncounterStatus } from "@prisma/client";
import {
  canEditEncounter,
  canTransitionEncounter,
  missingEncounterReviewFields,
  type EncounterTransition,
} from "@/lib/encounter-lifecycle";
import { db } from "@/lib/db";
import {
  mapEncounterAggregate,
  type EncounterAggregate,
} from "@/lib/repositories/encounter-mapper";
import type { Encounter } from "@/lib/types";
import type { CreateEncounterInput, EncounterAddendumInput, EncounterCodingInput } from "@/lib/encounter-authoring-rules";

export interface EncounterDraftInput {
  chiefComplaint?: string;
  hpi?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  patientInstructions?: string;
  followUp?: string;
}

interface EncounterMutationActor {
  userId: string;
  name: string;
  ipAddress?: string;
  userAgent?: string;
}

interface EncounterQueryOptions {
  encounterId?: string;
  patientId?: string;
}

async function loadEncounterAggregates(
  organizationId: string,
  options: EncounterQueryOptions = {},
): Promise<EncounterAggregate[]> {
  const encounters = await db.encounter.findMany({
    where: {
      organizationId,
      patient: { organizationId },
      ...(options.encounterId ? { id: options.encounterId } : {}),
      ...(options.patientId ? { patientId: options.patientId } : {}),
    },
    include: { patient: true },
    orderBy: { serviceDate: "desc" },
  });

  if (encounters.length === 0) return [];
  const encounterIds = encounters.map((encounter) => encounter.id);
  const providerIds = encounters.flatMap((encounter) => encounter.providerId ? [encounter.providerId] : []);

  const [providers, soapNotes, diagnoses, procedures, addenda, auditHistory] = await Promise.all([
    db.provider.findMany({ where: { organizationId, id: { in: providerIds } } }),
    db.soapNote.findMany({ where: { organizationId, encounterId: { in: encounterIds } } }),
    db.diagnosis.findMany({ where: { organizationId, encounterId: { in: encounterIds } }, orderBy: { primary: "desc" } }),
    db.procedure.findMany({ where: { organizationId, encounterId: { in: encounterIds } } }),
    db.clinicalNote.findMany({ where: { organizationId, encounterId: { in: encounterIds }, type: "addendum" }, orderBy: { createdAt: "asc" } }),
    db.auditLog.findMany({
      where: { organizationId, resourceType: "encounter", resourceId: { in: encounterIds } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);
  const addendumAuthors = await db.user.findMany({
    where: { organizationId, id: { in: addenda.flatMap((addendum) => addendum.signedBy ? [addendum.signedBy] : []) } },
    select: { id: true, name: true },
  });

  return encounters.map((encounter) => ({
    encounter,
    patient: encounter.patient,
    provider: encounter.providerId ? providers.find((provider) => provider.id === encounter.providerId) : undefined,
    soapNote: soapNotes.find((note) => note.encounterId === encounter.id),
    diagnoses: diagnoses.filter((diagnosis) => diagnosis.encounterId === encounter.id),
    procedures: procedures.filter((procedure) => procedure.encounterId === encounter.id),
    addenda: addenda.filter((addendum) => addendum.encounterId === encounter.id),
    addendumAuthors,
    auditHistory: auditHistory.filter((event) => event.resourceId === encounter.id),
  }));
}

export async function listEncountersForOrganization(organizationId: string): Promise<Encounter[]> {
  return (await loadEncounterAggregates(organizationId)).map((aggregate) => mapEncounterAggregate(aggregate));
}

export async function findEncounterForOrganization(encounterId: string, organizationId: string) {
  const aggregate = (await loadEncounterAggregates(organizationId, { encounterId }))[0];
  return aggregate ? mapEncounterAggregate(aggregate) : null;
}

export async function listEncountersForPatient(patientId: string, organizationId: string): Promise<Encounter[]> {
  return (await loadEncounterAggregates(organizationId, { patientId })).map((aggregate) => mapEncounterAggregate(aggregate));
}

export async function listEncounterCreationOptions(organizationId: string) {
  const [patients, providers, locations] = await Promise.all([
    db.patient.findMany({ where: { organizationId, status: "active" }, select: { id: true, firstName: true, lastName: true, mrn: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] }),
    db.provider.findMany({ where: { organizationId, status: "active" }, select: { id: true, name: true, credential: true }, orderBy: { name: "asc" } }),
    db.location.findMany({ where: { organizationId, status: "active" }, select: { id: true, name: true, timezone: true }, orderBy: { name: "asc" } }),
  ]);
  return {
    patients: patients.map((patient) => ({ id: patient.id, name: `${patient.firstName} ${patient.lastName}`, mrn: patient.mrn })),
    providers: providers.map((provider) => ({ id: provider.id, name: `${provider.name}, ${provider.credential}` })),
    locations,
  };
}

export async function createEncounterForOrganization(input: {
  organizationId: string;
  fields: CreateEncounterInput;
  actor: EncounterMutationActor;
}) {
  const result = await db.$transaction(async (transaction) => {
    const patient = await transaction.patient.findFirst({ where: { id: input.fields.patientId, organizationId: input.organizationId, status: "active" } });
    if (!patient) return { kind: "patient_not_found" as const };
    if (input.fields.providerId && !(await transaction.provider.findFirst({ where: { id: input.fields.providerId, organizationId: input.organizationId, status: "active" } }))) return { kind: "provider_not_found" as const };
    if (input.fields.locationId && !(await transaction.location.findFirst({ where: { id: input.fields.locationId, organizationId: input.organizationId, status: "active" } }))) return { kind: "location_not_found" as const };
    if (input.fields.appointmentId) {
      const appointment = await transaction.appointment.findFirst({ where: { id: input.fields.appointmentId, organizationId: input.organizationId, patientId: patient.id } });
      if (!appointment) return { kind: "appointment_not_found" as const };
      if (await transaction.encounter.findFirst({ where: { organizationId: input.organizationId, appointmentId: appointment.id } })) return { kind: "appointment_used" as const };
    }

    const encounter = await transaction.encounter.create({
      data: {
        organizationId: input.organizationId,
        patientId: patient.id,
        providerId: input.fields.providerId,
        locationId: input.fields.locationId,
        appointmentId: input.fields.appointmentId,
        type: input.fields.type,
        serviceDate: new Date(input.fields.serviceDate),
        chiefComplaint: input.fields.chiefComplaint,
        createdBy: input.actor.userId,
        updatedBy: input.actor.userId,
      },
    });
    await transaction.soapNote.create({ data: { organizationId: input.organizationId, patientId: patient.id, encounterId: encounter.id } });
    await transaction.auditLog.create({ data: { organizationId: input.organizationId, actorId: input.actor.userId, actorType: "user", action: "encounter.created", resourceType: "encounter", resourceId: encounter.id, patientId: patient.id, ipAddress: input.actor.ipAddress, userAgent: input.actor.userAgent, metadata: { actorName: input.actor.name, encounterType: encounter.type, providerId: encounter.providerId, locationId: encounter.locationId } } });
    return { kind: "created" as const, encounterId: encounter.id };
  });
  if (result.kind !== "created") return result;
  return { kind: "created" as const, encounter: await findEncounterForOrganization(result.encounterId, input.organizationId) };
}

export async function replaceEncounterCodingForOrganization(input: {
  encounterId: string;
  organizationId: string;
  fields: EncounterCodingInput;
  actor: EncounterMutationActor;
}) {
  const result = await db.$transaction(async (transaction) => {
    const encounter = await transaction.encounter.findFirst({ where: { id: input.encounterId, organizationId: input.organizationId, patient: { organizationId: input.organizationId } } });
    if (!encounter) return { kind: "not_found" as const };
    if (!canEditEncounter(encounter.status)) return { kind: "locked" as const };
    const [priorDiagnoses, priorProcedures] = await Promise.all([
      transaction.diagnosis.findMany({ where: { organizationId: input.organizationId, encounterId: encounter.id }, select: { code: true } }),
      transaction.procedure.findMany({ where: { organizationId: input.organizationId, encounterId: encounter.id }, select: { code: true } }),
    ]);
    await transaction.diagnosis.deleteMany({ where: { organizationId: input.organizationId, encounterId: encounter.id } });
    await transaction.procedure.deleteMany({ where: { organizationId: input.organizationId, encounterId: encounter.id } });
    if (input.fields.diagnoses.length) await transaction.diagnosis.createMany({ data: input.fields.diagnoses.map((diagnosis) => ({ organizationId: input.organizationId, patientId: encounter.patientId, encounterId: encounter.id, ...diagnosis })) });
    if (input.fields.procedures.length) await transaction.procedure.createMany({ data: input.fields.procedures.map((procedure) => ({ organizationId: input.organizationId, patientId: encounter.patientId, encounterId: encounter.id, ...procedure })) });
    await transaction.superbill.updateMany({ where: { organizationId: input.organizationId, encounterId: encounter.id, status: "draft" }, data: { diagnoses: input.fields.diagnoses, procedures: input.fields.procedures } });
    await transaction.auditLog.create({ data: { organizationId: input.organizationId, actorId: input.actor.userId, actorType: "user", action: "encounter.coding_updated", resourceType: "encounter", resourceId: encounter.id, patientId: encounter.patientId, ipAddress: input.actor.ipAddress, userAgent: input.actor.userAgent, changes: { diagnoses: { from: priorDiagnoses.map((item) => item.code), to: input.fields.diagnoses.map((item) => item.code) }, procedures: { from: priorProcedures.map((item) => item.code), to: input.fields.procedures.map((item) => item.code) } }, metadata: { actorName: input.actor.name, humanReviewRequired: true } } });
    return { kind: "updated" as const };
  });
  if (result.kind !== "updated") return result;
  return { kind: "updated" as const, encounter: await findEncounterForOrganization(input.encounterId, input.organizationId) };
}

export async function createEncounterAddendumForOrganization(input: {
  encounterId: string;
  organizationId: string;
  fields: EncounterAddendumInput;
  actor: EncounterMutationActor;
}) {
  const result = await db.$transaction(async (transaction) => {
    const encounter = await transaction.encounter.findFirst({ where: { id: input.encounterId, organizationId: input.organizationId, patient: { organizationId: input.organizationId } } });
    if (!encounter) return { kind: "not_found" as const };
    if (encounter.status !== PrismaEncounterStatus.SIGNED && encounter.status !== PrismaEncounterStatus.LOCKED && encounter.status !== PrismaEncounterStatus.ADDENDUM_NEEDED) return { kind: "not_locked" as const };
    const now = new Date();
    const addendum = await transaction.clinicalNote.create({ data: { organizationId: input.organizationId, patientId: encounter.patientId, encounterId: encounter.id, type: "addendum", content: { reason: input.fields.reason, text: input.fields.text, attestation: "signed_by_author" }, status: PrismaEncounterStatus.LOCKED, signedBy: input.actor.userId, signedAt: now, lockedAt: now } });
    await transaction.auditLog.create({ data: { organizationId: input.organizationId, actorId: input.actor.userId, actorType: "user", action: "encounter.addendum_signed", resourceType: "encounter", resourceId: encounter.id, patientId: encounter.patientId, ipAddress: input.actor.ipAddress, userAgent: input.actor.userAgent, changes: { addendumId: addendum.id }, metadata: { actorName: input.actor.name, reason: input.fields.reason, originalNotePreserved: true } } });
    return { kind: "created" as const };
  });
  if (result.kind !== "created") return result;
  return { kind: "created" as const, encounter: await findEncounterForOrganization(input.encounterId, input.organizationId) };
}

export async function saveEncounterDraftForOrganization(input: {
  encounterId: string;
  organizationId: string;
  fields: EncounterDraftInput;
  actor: EncounterMutationActor;
}) {
  const result = await db.$transaction(async (transaction) => {
    const current = await transaction.encounter.findFirst({
      where: {
        id: input.encounterId,
        organizationId: input.organizationId,
        patient: { organizationId: input.organizationId },
      },
    });

    if (!current) return { kind: "not_found" as const };
    if (!canEditEncounter(current.status)) return { kind: "locked" as const };

    const update = await transaction.encounter.updateMany({
      where: { id: current.id, organizationId: input.organizationId, status: PrismaEncounterStatus.DRAFT },
      data: {
        chiefComplaint: input.fields.chiefComplaint,
        hpi: input.fields.hpi,
        assessment: input.fields.assessment,
        plan: input.fields.plan,
        patientInstructions: input.fields.patientInstructions,
        followUpPlan: input.fields.followUp,
        updatedBy: input.actor.userId,
      },
    });

    if (update.count !== 1) return { kind: "conflict" as const };

    const existingSoapNote = await transaction.soapNote.findFirst({
      where: { encounterId: current.id, organizationId: input.organizationId },
      select: { id: true },
    });
    const soapFields = {
      subjective: input.fields.subjective,
      objective: input.fields.objective,
      assessment: input.fields.assessment,
      plan: input.fields.plan,
    };

    if (existingSoapNote) {
      await transaction.soapNote.updateMany({
        where: { id: existingSoapNote.id, organizationId: input.organizationId },
        data: soapFields,
      });
    } else {
      await transaction.soapNote.create({
        data: {
          organizationId: input.organizationId,
          patientId: current.patientId,
          encounterId: current.id,
          ...soapFields,
        },
      });
    }

    await transaction.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorId: input.actor.userId,
        actorType: "user",
        action: "encounter.draft_saved",
        resourceType: "encounter",
        resourceId: current.id,
        patientId: current.patientId,
        ipAddress: input.actor.ipAddress,
        userAgent: input.actor.userAgent,
        changes: { fields: Object.keys(input.fields) },
        metadata: { actorName: input.actor.name },
      },
    });

    return { kind: "updated" as const };
  });

  if (result.kind !== "updated") return result;
  return {
    kind: "updated" as const,
    encounter: await findEncounterForOrganization(input.encounterId, input.organizationId),
  };
}

export async function transitionEncounterForOrganization(input: {
  encounterId: string;
  organizationId: string;
  transition: EncounterTransition;
  actor: EncounterMutationActor;
}) {
  const result = await db.$transaction(async (transaction) => {
    const current = await transaction.encounter.findFirst({
      where: {
        id: input.encounterId,
        organizationId: input.organizationId,
        patient: { organizationId: input.organizationId },
      },
    });

    if (!current) return { kind: "not_found" as const };
    if (!canTransitionEncounter(current.status, input.transition)) return { kind: "invalid_transition" as const };

    if (input.transition === "ready_for_review") {
      const missingFields = missingEncounterReviewFields(current);
      if (missingFields.length > 0) return { kind: "missing_fields" as const, missingFields };
    }

    const targetStatus = input.transition === "ready_for_review"
      ? PrismaEncounterStatus.READY_FOR_REVIEW
      : PrismaEncounterStatus.LOCKED;
    const now = new Date();
    const update = await transaction.encounter.updateMany({
      where: { id: current.id, organizationId: input.organizationId, status: current.status },
      data: {
        status: targetStatus,
        signedAt: input.transition === "sign_and_lock" ? now : current.signedAt,
        lockedAt: input.transition === "sign_and_lock" ? now : current.lockedAt,
        updatedBy: input.actor.userId,
      },
    });

    if (update.count !== 1) return { kind: "conflict" as const };

    await transaction.soapNote.updateMany({
      where: { organizationId: input.organizationId, encounterId: current.id },
      data: {
        status: targetStatus,
        signedBy: input.transition === "sign_and_lock" ? input.actor.userId : undefined,
        signedAt: input.transition === "sign_and_lock" ? now : undefined,
        lockedAt: input.transition === "sign_and_lock" ? now : undefined,
      },
    });

    await transaction.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorId: input.actor.userId,
        actorType: "user",
        action: input.transition === "ready_for_review"
          ? "encounter.ready_for_review"
          : "encounter.signed_and_locked",
        resourceType: "encounter",
        resourceId: current.id,
        patientId: current.patientId,
        ipAddress: input.actor.ipAddress,
        userAgent: input.actor.userAgent,
        changes: { status: { from: current.status, to: targetStatus } },
        metadata: { actorName: input.actor.name },
      },
    });

    return { kind: "updated" as const };
  });

  if (result.kind !== "updated") return result;
  return {
    kind: "updated" as const,
    encounter: await findEncounterForOrganization(input.encounterId, input.organizationId),
  };
}

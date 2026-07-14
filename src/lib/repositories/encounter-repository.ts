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

  const [providers, soapNotes, diagnoses, procedures, auditHistory] = await Promise.all([
    db.provider.findMany({ where: { organizationId, id: { in: providerIds } } }),
    db.soapNote.findMany({ where: { organizationId, encounterId: { in: encounterIds } } }),
    db.diagnosis.findMany({ where: { organizationId, encounterId: { in: encounterIds } }, orderBy: { primary: "desc" } }),
    db.procedure.findMany({ where: { organizationId, encounterId: { in: encounterIds } } }),
    db.auditLog.findMany({
      where: { organizationId, resourceType: "encounter", resourceId: { in: encounterIds } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return encounters.map((encounter) => ({
    encounter,
    patient: encounter.patient,
    provider: encounter.providerId ? providers.find((provider) => provider.id === encounter.providerId) : undefined,
    soapNote: soapNotes.find((note) => note.encounterId === encounter.id),
    diagnoses: diagnoses.filter((diagnosis) => diagnosis.encounterId === encounter.id),
    procedures: procedures.filter((procedure) => procedure.encounterId === encounter.id),
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

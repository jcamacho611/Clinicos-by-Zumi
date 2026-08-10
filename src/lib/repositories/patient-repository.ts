import "server-only";

import { db } from "@/lib/db";
import type { ClinicSession } from "@/lib/auth/types";
import { mapPatientAggregate, type PatientAggregate } from "@/lib/repositories/patient-mapper";
import type { Patient } from "@/lib/types";
import type { PatientCreateInput } from "@/lib/patient-intake-rules";

async function loadPatientAggregates(organizationId: string, patientId?: string): Promise<PatientAggregate[]> {
  const patientRows = await db.patient.findMany({
    where: {
      organizationId,
      status: "active",
      ...(patientId ? { id: patientId } : {}),
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  if (patientRows.length === 0) return [];
  const patientIds = patientRows.map((patient) => patient.id);

  const [insurances, verifications, balances, appointments, encounters, providers, locations, allergies, medications, problems] = await Promise.all([
    db.patientInsurance.findMany({ where: { organizationId, patientId: { in: patientIds }, status: "active" }, orderBy: { priority: "asc" } }),
    db.insuranceVerification.findMany({ where: { organizationId, patientId: { in: patientIds } }, orderBy: { createdAt: "desc" } }),
    db.patientBalance.findMany({ where: { organizationId, patientId: { in: patientIds } }, orderBy: { asOf: "desc" } }),
    db.appointment.findMany({ where: { organizationId, patientId: { in: patientIds }, status: { notIn: ["CANCELLED", "NO_SHOW"] } }, orderBy: { startsAt: "asc" } }),
    db.encounter.findMany({ where: { organizationId, patientId: { in: patientIds } }, orderBy: { serviceDate: "desc" } }),
    db.provider.findMany({ where: { organizationId, status: "active" } }),
    db.location.findMany({ where: { organizationId, status: "active" } }),
    db.allergy.findMany({ where: { organizationId, patientId: { in: patientIds }, status: "active" } }),
    db.medication.findMany({ where: { organizationId, patientId: { in: patientIds }, status: "active" } }),
    db.problem.findMany({ where: { organizationId, patientId: { in: patientIds }, status: "active" } }),
  ]);

  const firstForPatient = <T extends { patientId: string }>(records: T[], id: string) => records.find((record) => record.patientId === id);

  return patientRows.map((patient) => {
    const appointment = firstForPatient(appointments, patient.id);
    return {
      patient,
      insurance: firstForPatient(insurances, patient.id),
      verification: firstForPatient(verifications, patient.id),
      balance: firstForPatient(balances, patient.id),
      appointment,
      encounter: firstForPatient(encounters, patient.id),
      provider: appointment?.providerId ? providers.find((provider) => provider.id === appointment.providerId) : undefined,
      location: patient.locationId ? locations.find((location) => location.id === patient.locationId) : undefined,
      allergies: allergies.filter((allergy) => allergy.patientId === patient.id),
      medications: medications.filter((medication) => medication.patientId === patient.id),
      problems: problems.filter((problem) => problem.patientId === patient.id),
    };
  });
}

export async function listPatientsForOrganization(organizationId: string): Promise<Patient[]> {
  return (await loadPatientAggregates(organizationId)).map((aggregate) => mapPatientAggregate(aggregate));
}

export async function findPatientForOrganization(patientId: string, organizationId: string): Promise<Patient | null> {
  const aggregate = (await loadPatientAggregates(organizationId, patientId))[0];
  return aggregate ? mapPatientAggregate(aggregate) : null;
}

async function nextMrn(organizationId: string) {
  const prefix = `K-${new Date().getUTCFullYear()}-`;
  const latest = await db.patient.findFirst({ where: { organizationId, mrn: { startsWith: prefix } }, orderBy: { mrn: "desc" }, select: { mrn: true } });
  const previous = latest?.mrn.match(/(\d+)$/)?.[1];
  return `${prefix}${String((previous ? Number(previous) : 0) + 1).padStart(5, "0")}`;
}

export async function createPatientForOrganization(session: ClinicSession, input: PatientCreateInput) {
  return db.$transaction(async (tx) => {
    const primaryLocation = await tx.location.findFirst({ where: { organizationId: session.organizationId, status: "active" }, orderBy: { createdAt: "asc" }, select: { id: true } });
    let mrn = await nextMrn(session.organizationId);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const exists = await tx.patient.findFirst({ where: { organizationId: session.organizationId, mrn }, select: { id: true } });
      if (!exists) break;
      mrn = `K-${new Date().getUTCFullYear()}-${String(Number(mrn.split("-").at(-1) ?? "0") + 1).padStart(5, "0")}`;
    }
    const duplicate = await tx.patient.findFirst({
      where: {
        organizationId: session.organizationId,
        status: "active",
        firstName: { equals: input.firstName, mode: "insensitive" },
        lastName: { equals: input.lastName, mode: "insensitive" },
        dateOfBirth: input.dateOfBirth,
      },
      select: { id: true, mrn: true },
    });
    if (duplicate) throw new Error(`POTENTIAL_DUPLICATE:${duplicate.id}`);

    const created = await tx.patient.create({
      data: {
        organizationId: session.organizationId,
        locationId: primaryLocation?.id ?? null,
        mrn,
        firstName: input.firstName,
        lastName: input.lastName,
        dateOfBirth: input.dateOfBirth,
        sexAtBirth: input.sexAtBirth || null,
        phone: input.phone || null,
        email: input.email || null,
        preferredLanguage: input.preferredLanguage,
        identityStatus: "unverified",
        createdBy: session.userId,
        updatedBy: session.userId,
      },
    });
    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: "patient.created",
        resourceType: "patient",
        resourceId: created.id,
        metadata: { mrn: created.mrn, identityStatus: created.identityStatus },
      },
    });
    return created;
  });
}

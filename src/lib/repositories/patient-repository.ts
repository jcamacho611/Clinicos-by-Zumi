import "server-only";

import { db } from "@/lib/db";
import { mapPatientAggregate, type PatientAggregate } from "@/lib/repositories/patient-mapper";
import type { Patient } from "@/lib/types";

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

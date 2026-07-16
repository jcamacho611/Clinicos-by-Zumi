import "server-only";

import type { Prisma } from "@prisma/client";
import { can } from "@/lib/auth/rbac";
import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";
import { confirmIntakePassportSchema, refreshPassportSchema, updateConsentWalletSchema } from "@/lib/passport-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

type Transaction = Prisma.TransactionClient;

function iso(value: Date | null | undefined) { return value?.toISOString() ?? null; }
function fullName(patient: { firstName: string; lastName: string }) { return `${patient.firstName} ${patient.lastName}`; }

async function requirePatient(tx: Transaction, organizationId: string, patientId: string) {
  const patient = await tx.patient.findFirst({ where: { id: patientId, organizationId, status: "active" } });
  if (!patient) throw new NetworkAccessError("Patient not found for this organization.", 404);
  return patient;
}

export async function listPassportWorkspace(organizationId: string) {
  const [patients, passports, wallets, intakes, consents] = await Promise.all([
    db.patient.findMany({ where: { organizationId, status: "active" }, select: { id: true, firstName: true, lastName: true, mrn: true, preferredLanguage: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] }),
    db.healthPassport.findMany({ where: { organizationId }, orderBy: { updatedAt: "desc" } }),
    db.consentWallet.findMany({ where: { organizationId }, orderBy: { updatedAt: "desc" } }),
    db.intakePassport.findMany({ where: { organizationId }, orderBy: { updatedAt: "desc" } }),
    db.consent.findMany({ where: { organizationId }, select: { id: true, patientId: true, status: true, purposeOfUse: true, dataCategories: true, expiresAt: true, withdrawnAt: true, signedAt: true }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  const patientMap = new Map(patients.map((patient) => [patient.id, patient]));
  return {
    patients: patients.map((patient) => ({ ...patient, name: fullName(patient) })),
    passports: passports.map((passport) => ({ ...passport, patientName: fullName(patientMap.get(passport.patientId) ?? { firstName: "Unknown", lastName: "patient" }), patientMrn: patientMap.get(passport.patientId)?.mrn ?? null, lastConfirmedAt: iso(passport.lastConfirmedAt), createdAt: passport.createdAt.toISOString(), updatedAt: passport.updatedAt.toISOString() })),
    wallets: wallets.map((wallet) => ({ ...wallet, patientName: fullName(patientMap.get(wallet.patientId) ?? { firstName: "Unknown", lastName: "patient" }), createdAt: wallet.createdAt.toISOString(), updatedAt: wallet.updatedAt.toISOString() })),
    intakes: intakes.map((intake) => ({ ...intake, patientName: fullName(patientMap.get(intake.patientId) ?? { firstName: "Unknown", lastName: "patient" }), confirmedAt: iso(intake.confirmedAt), createdAt: intake.createdAt.toISOString(), updatedAt: intake.updatedAt.toISOString() })),
    consents: consents.map((consent) => ({ ...consent, expiresAt: iso(consent.expiresAt), withdrawnAt: iso(consent.withdrawnAt), signedAt: iso(consent.signedAt) })),
  };
}

export type PassportWorkspace = Awaited<ReturnType<typeof listPassportWorkspace>>;

export async function refreshHealthPassport(session: ClinicSession, rawInput: unknown) {
  if (!can(session.role, "identity", "update")) throw new NetworkAccessError("Passport refresh permission is required.", 403);
  const input = refreshPassportSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const patient = await requirePatient(tx, session.organizationId, input.patientId);
    const [allergies, medications, problems, immunizations, insurance, encounters, labs, imaging, referrals, carePlans] = await Promise.all([
      tx.allergy.findMany({ where: { organizationId: session.organizationId, patientId: patient.id, status: "active" }, select: { substance: true, reaction: true, severity: true } }),
      tx.medication.findMany({ where: { organizationId: session.organizationId, patientId: patient.id, status: "active" }, select: { name: true, dose: true, frequency: true, route: true, reconciliationStatus: true }, orderBy: { updatedAt: "desc" }, take: 50 }),
      tx.problem.findMany({ where: { organizationId: session.organizationId, patientId: patient.id, status: "active" }, select: { code: true, label: true }, orderBy: { updatedAt: "desc" }, take: 50 }),
      tx.immunization.findMany({ where: { organizationId: session.organizationId, patientId: patient.id }, select: { vaccine: true, administeredAt: true, status: true }, orderBy: { administeredAt: "desc" }, take: 50 }),
      tx.patientInsurance.findMany({ where: { organizationId: session.organizationId, patientId: patient.id, status: "active" }, select: { payer: true, planName: true, memberId: true, priority: true } }),
      tx.encounter.findMany({ where: { organizationId: session.organizationId, patientId: patient.id, status: { in: ["SIGNED", "LOCKED"] } }, select: { type: true, serviceDate: true, providerId: true }, orderBy: { serviceDate: "desc" }, take: 10 }),
      tx.labResult.findMany({ where: { organizationId: session.organizationId, patientId: patient.id, patientVisible: true }, select: { panelName: true, resultedAt: true, status: true }, orderBy: { resultedAt: "desc" }, take: 25 }),
      tx.imagingResult.findMany({ where: { organizationId: session.organizationId, patientId: patient.id, patientVisible: true }, select: { reportTitle: true, studyPerformedAt: true, status: true }, orderBy: { studyPerformedAt: "desc" }, take: 25 }),
      tx.referral.findMany({ where: { organizationId: session.organizationId, patientId: patient.id }, select: { reason: true, status: true, updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 25 }),
      tx.carePlan.findMany({ where: { organizationId: session.organizationId, patientId: patient.id, status: "active" }, select: { title: true, goals: true, status: true }, orderBy: { updatedAt: "desc" }, take: 25 }),
    ]);
    const summary = {
      demographics: { name: fullName(patient), preferredName: patient.preferredName, dateOfBirth: patient.dateOfBirth.toISOString(), phone: patient.phone, preferredLanguage: patient.preferredLanguage },
      allergies,
      medications,
      problems,
      immunizations: immunizations.map((item) => ({ ...item, administeredAt: iso(item.administeredAt) })),
      insurance,
      recentVisits: encounters.map((item) => ({ ...item, serviceDate: item.serviceDate.toISOString() })),
      labs: labs.map((item) => ({ ...item, resultedAt: iso(item.resultedAt) })),
      imaging: imaging.map((item) => ({ ...item, studyPerformedAt: iso(item.studyPerformedAt) })),
      referrals: referrals.map((item) => ({ ...item, updatedAt: item.updatedAt.toISOString() })),
      carePlans,
      provenance: { sourceOrganizationId: session.organizationId, generatedAt: new Date().toISOString(), humanConfirmationRequired: true, syntheticDemo: session.demo },
    } satisfies Prisma.InputJsonValue;
    const passport = await tx.healthPassport.upsert({ where: { patientId: patient.id }, update: { organizationId: session.organizationId, summary, status: "needs_confirmation", lastConfirmedAt: null }, create: { organizationId: session.organizationId, patientId: patient.id, summary, status: "needs_confirmation" } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "health_passport.refreshed", resourceType: "health_passport", resourceId: passport.id, patientId: patient.id, metadata: { source: "current_chart", humanConfirmationRequired: true } } });
    return passport;
  });
}

export async function updateConsentWallet(session: ClinicSession, rawInput: unknown) {
  if (!can(session.role, "consents", "update")) throw new NetworkAccessError("Consent-wallet update permission is required.", 403);
  const input = updateConsentWalletSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    await requirePatient(tx, session.organizationId, input.patientId);
    const wallet = await tx.consentWallet.upsert({ where: { patientId: input.patientId }, update: { organizationId: session.organizationId, sharingDefaults: input.sharingDefaults, emergencyPreference: input.emergencyPreference, recoveryStatus: "active" }, create: { organizationId: session.organizationId, patientId: input.patientId, sharingDefaults: input.sharingDefaults, emergencyPreference: input.emergencyPreference } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "consent_wallet.updated", resourceType: "consent_wallet", resourceId: wallet.id, patientId: input.patientId, metadata: { sharingDefaults: input.sharingDefaults, emergencyPreference: input.emergencyPreference } } });
    return wallet;
  });
}

export async function confirmIntakePassport(session: ClinicSession, rawInput: unknown) {
  if (!can(session.role, "consents", "update")) throw new NetworkAccessError("Intake-passport confirmation permission is required.", 403);
  const input = confirmIntakePassportSchema.parse(rawInput);
  const reusableFields = input.reusableFields as Prisma.InputJsonValue;
  return db.$transaction(async (tx) => {
    await requirePatient(tx, session.organizationId, input.patientId);
    const existing = await tx.intakePassport.findUnique({ where: { patientId: input.patientId } });
    const intake = await tx.intakePassport.upsert({ where: { patientId: input.patientId }, update: { organizationId: session.organizationId, reusableFields, confirmedAt: new Date(), version: (existing?.version ?? 0) + 1, status: "active" }, create: { organizationId: session.organizationId, patientId: input.patientId, reusableFields, confirmedAt: new Date(), version: 1, status: "active" } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "intake_passport.confirmed", resourceType: "intake_passport", resourceId: intake.id, patientId: input.patientId, metadata: { version: intake.version, reusableFieldKeys: Object.keys(input.reusableFields) } } });
    return intake;
  });
}

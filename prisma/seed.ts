import "dotenv/config";
import { AppointmentStatus, EncounterStatus, PrismaClient, RiskLevel } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env.CLINICOS_SEED_ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 12 || adminPassword.includes("replace-with")) {
    throw new Error("CLINICOS_SEED_ADMIN_PASSWORD must be set to a non-placeholder value with at least 12 characters.");
  }

  const passwordHash = await hash(adminPassword, 12);

  await prisma.patientBalance.deleteMany();
  await prisma.insuranceVerification.deleteMany();
  await prisma.patientInsurance.deleteMany();
  await prisma.allergy.deleteMany();
  await prisma.medication.deleteMany();
  await prisma.problem.deleteMany();
  await prisma.encounter.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.user.deleteMany();
  await prisma.location.deleteMany();
  await prisma.integration.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.organization.deleteMany();

  const bfm = await prisma.organization.create({
    data: {
      id: "org-bfm",
      name: "Brooklyn Family Medicine",
      slug: "brooklyn-family-medicine",
      clinicType: "Primary Care",
      demoMode: true,
      locations: {
        create: [
          { id: "loc-brooklyn-heights", name: "Brooklyn Heights", address: { line1: "100 Demo Street", city: "Brooklyn", state: "NY", postalCode: "11201" } },
          { id: "loc-crown-heights", name: "Crown Heights", address: { line1: "200 Sample Avenue", city: "Brooklyn", state: "NY", postalCode: "11213" } },
        ],
      },
      users: {
        create: {
          id: "user-nadja",
          email: "nadja@example.test",
          name: "Nadja R., NP",
          roleKey: "clinic_owner",
          authCredential: { create: { passwordHash } },
        },
      },
    },
  });

  const luxe = await prisma.organization.create({
    data: {
      id: "org-luxe",
      name: "Luxe Medi",
      slug: "luxe-medi",
      clinicType: "Med Spa",
      demoMode: true,
      locations: { create: { id: "loc-midtown", name: "Midtown Manhattan", address: { line1: "300 Example Plaza", city: "New York", state: "NY", postalCode: "10001" } } },
    },
  });

  await prisma.provider.createMany({
    data: [
      { id: "provider-nadja", organizationId: bfm.id, userId: "user-nadja", name: "Nadja R.", credential: "NP", specialty: "Family Medicine", status: "active" },
      { id: "provider-lee", organizationId: bfm.id, name: "Samuel Lee", credential: "MD", specialty: "Family Medicine", status: "active" },
      { id: "provider-nadja-luxe", organizationId: luxe.id, name: "Nadja R.", credential: "NP", specialty: "Aesthetic Medicine", status: "active" },
    ],
  });

  const maya = await prisma.patient.create({
    data: {
      id: "pt-1001",
      organizationId: bfm.id,
      locationId: "loc-brooklyn-heights",
      mrn: "BFM-28419",
      firstName: "Maya",
      lastName: "Thompson",
      dateOfBirth: new Date("1985-09-12T00:00:00.000Z"),
      sexAtBirth: "Female",
      genderIdentity: "Woman",
      pronouns: "she/her",
      phone: "(917) 555-0142",
      email: "maya.thompson@example.test",
      portalStatus: "active",
      riskLevel: RiskLevel.NEEDS_PROVIDER,
      requiresHumanReview: true,
    },
  });

  await prisma.patient.createMany({
    data: [
      { id: "pt-1002", organizationId: bfm.id, locationId: "loc-crown-heights", mrn: "BFM-28104", firstName: "Darius", lastName: "Coleman", dateOfBirth: new Date("1972-02-07T00:00:00.000Z"), sexAtBirth: "Male", pronouns: "he/him", phone: "(718) 555-0188", email: "darius.coleman@example.test", portalStatus: "active" },
      { id: "pt-1003", organizationId: bfm.id, locationId: "loc-brooklyn-heights", mrn: "BFM-29011", firstName: "Elena", lastName: "Rivera", dateOfBirth: new Date("1993-11-21T00:00:00.000Z"), sexAtBirth: "Female", pronouns: "she/her", phone: "(347) 555-0109", email: "elena.rivera@example.test", preferredLanguage: "Spanish", portalStatus: "invited", riskLevel: RiskLevel.NEEDS_STAFF },
      { id: "pt-1005", organizationId: bfm.id, locationId: "loc-crown-heights", mrn: "BFM-27618", firstName: "Anthony", lastName: "Nguyen", dateOfBirth: new Date("1966-01-31T00:00:00.000Z"), sexAtBirth: "Male", pronouns: "he/him", phone: "(917) 555-0124", email: "anthony.nguyen@example.test", portalStatus: "inactive", riskLevel: RiskLevel.URGENT, requiresHumanReview: true },
      { id: "pt-1004", organizationId: luxe.id, locationId: "loc-midtown", mrn: "LUX-10428", firstName: "Camille", lastName: "Brooks", dateOfBirth: new Date("1989-05-15T00:00:00.000Z"), sexAtBirth: "Female", pronouns: "she/her", phone: "(646) 555-0165", email: "camille.brooks@example.test", portalStatus: "active" },
    ],
  });

  await prisma.appointment.createMany({
    data: [
      { id: "apt-1", organizationId: bfm.id, locationId: "loc-brooklyn-heights", patientId: maya.id, providerId: "provider-nadja", startsAt: new Date("2026-07-14T13:00:00.000Z"), endsAt: new Date("2026-07-14T13:30:00.000Z"), status: AppointmentStatus.CHECKED_IN, formsComplete: true, insuranceVerified: true, paymentDueCents: 2500 },
      { id: "apt-2", organizationId: bfm.id, locationId: "loc-brooklyn-heights", patientId: "pt-1003", providerId: "provider-lee", startsAt: new Date("2026-07-14T13:45:00.000Z"), endsAt: new Date("2026-07-14T14:30:00.000Z"), status: AppointmentStatus.IN_ROOM, formsComplete: false, insuranceVerified: false, paymentDueCents: 1500 },
      { id: "apt-3", organizationId: bfm.id, locationId: "loc-brooklyn-heights", patientId: "pt-1002", providerId: "provider-nadja", startsAt: new Date("2026-07-14T14:45:00.000Z"), endsAt: new Date("2026-07-14T15:15:00.000Z"), status: AppointmentStatus.CONFIRMED, telemedicine: true, formsComplete: true, insuranceVerified: true, paymentDueCents: 3000 },
      { id: "apt-4", organizationId: luxe.id, locationId: "loc-midtown", patientId: "pt-1004", providerId: "provider-nadja-luxe", startsAt: new Date("2026-07-14T18:00:00.000Z"), endsAt: new Date("2026-07-14T18:45:00.000Z"), status: AppointmentStatus.CONFIRMED, formsComplete: true, insuranceVerified: true, paymentDueCents: 35000 },
    ],
  });

  await prisma.patientInsurance.createMany({
    data: [
      { id: "ins-1001", organizationId: bfm.id, patientId: "pt-1001", payer: "Healthfirst", planName: "Essential Plan 3", memberId: "HF-TEST-40218", status: "active" },
      { id: "ins-1002", organizationId: bfm.id, patientId: "pt-1002", payer: "EmblemHealth", planName: "GHI CBP", memberId: "EMB-TEST-90116", status: "active" },
      { id: "ins-1003", organizationId: bfm.id, patientId: "pt-1003", payer: "MetroPlus", planName: "GoldPlus", memberId: "MP-TEST-33981", status: "active" },
      { id: "ins-1005", organizationId: bfm.id, patientId: "pt-1005", payer: "Aetna", planName: "Open Access", memberId: "AET-TEST-77241", status: "active" },
      { id: "ins-1004", organizationId: luxe.id, patientId: "pt-1004", payer: "Self Pay", planName: "Luxe Membership", memberId: "N/A", status: "active" },
    ],
  });

  await prisma.insuranceVerification.createMany({
    data: [
      { organizationId: bfm.id, patientId: "pt-1001", insuranceId: "ins-1001", payer: "Healthfirst", eligibilityStatus: "active", copayCents: 2500, source: "demo_seed", verifiedAt: new Date("2026-07-14T12:00:00.000Z") },
      { organizationId: bfm.id, patientId: "pt-1002", insuranceId: "ins-1002", payer: "EmblemHealth", eligibilityStatus: "active", copayCents: 3000, source: "demo_seed", verifiedAt: new Date("2026-07-14T12:00:00.000Z") },
      { organizationId: bfm.id, patientId: "pt-1003", insuranceId: "ins-1003", payer: "MetroPlus", eligibilityStatus: "pending", copayCents: 1500, source: "demo_seed" },
      { organizationId: bfm.id, patientId: "pt-1005", insuranceId: "ins-1005", payer: "Aetna", eligibilityStatus: "active", copayCents: 3500, source: "demo_seed", verifiedAt: new Date("2026-07-12T12:00:00.000Z") },
      { organizationId: luxe.id, patientId: "pt-1004", insuranceId: "ins-1004", payer: "Self Pay", eligibilityStatus: "not_applicable", copayCents: 0, source: "demo_seed" },
    ],
  });

  await prisma.patientBalance.createMany({
    data: [
      { organizationId: bfm.id, patientId: "pt-1001", balanceCents: 7500 },
      { organizationId: bfm.id, patientId: "pt-1002", balanceCents: 0 },
      { organizationId: bfm.id, patientId: "pt-1003", balanceCents: 4000 },
      { organizationId: bfm.id, patientId: "pt-1005", balanceCents: 11000 },
      { organizationId: luxe.id, patientId: "pt-1004", balanceCents: 35000 },
    ],
  });

  await prisma.allergy.createMany({
    data: [
      { organizationId: bfm.id, patientId: "pt-1001", substance: "Penicillin", reaction: "hives", severity: "moderate" },
      { organizationId: bfm.id, patientId: "pt-1003", substance: "Latex", reaction: "rash", severity: "mild" },
      { organizationId: bfm.id, patientId: "pt-1005", substance: "Sulfa", reaction: "swelling", severity: "severe" },
    ],
  });

  await prisma.medication.createMany({
    data: [
      { organizationId: bfm.id, patientId: "pt-1001", name: "Metformin", dose: "500 mg", frequency: "twice daily" },
      { organizationId: bfm.id, patientId: "pt-1001", name: "Lisinopril", dose: "10 mg", frequency: "daily" },
      { organizationId: bfm.id, patientId: "pt-1002", name: "Atorvastatin", dose: "20 mg", frequency: "nightly" },
      { organizationId: bfm.id, patientId: "pt-1003", name: "Albuterol HFA", frequency: "as needed" },
      { organizationId: bfm.id, patientId: "pt-1005", name: "Amlodipine", dose: "10 mg", frequency: "daily" },
    ],
  });

  await prisma.problem.createMany({
    data: [
      { organizationId: bfm.id, patientId: "pt-1001", code: "E11.9", label: "Type 2 diabetes" },
      { organizationId: bfm.id, patientId: "pt-1001", code: "I10", label: "Essential hypertension" },
      { organizationId: bfm.id, patientId: "pt-1002", code: "E78.5", label: "Hyperlipidemia" },
      { organizationId: bfm.id, patientId: "pt-1003", code: "J45.20", label: "Mild intermittent asthma" },
      { organizationId: bfm.id, patientId: "pt-1005", code: "I10", label: "Uncontrolled hypertension" },
      { organizationId: luxe.id, patientId: "pt-1004", label: "Weight management program" },
    ],
  });

  await prisma.encounter.create({
    data: {
      id: "enc-1001",
      organizationId: bfm.id,
      locationId: "loc-brooklyn-heights",
      patientId: maya.id,
      providerId: "provider-nadja",
      appointmentId: "apt-1",
      type: "Diabetes follow-up",
      serviceDate: new Date("2026-07-14T13:00:00.000Z"),
      status: EncounterStatus.DRAFT,
      chiefComplaint: "Follow-up for diabetes and elevated home glucose readings.",
      hpi: "Returns for chronic-care follow-up with recent above-goal home readings.",
      assessment: "Provider review required.",
      plan: "Draft plan pending provider review and signature.",
      createdBy: "user-nadja",
    },
  });

  await prisma.integration.createMany({
    data: [
      { organizationId: bfm.id, type: "lab", vendor: "Quest Diagnostics", status: "roadmap", riskLevel: "high", baaRequired: true, phase: "Phase 4" },
      { organizationId: bfm.id, type: "lab", vendor: "Labcorp", status: "roadmap", riskLevel: "high", baaRequired: true, phase: "Phase 4" },
      { organizationId: bfm.id, type: "lab", vendor: "BioReference", status: "roadmap", riskLevel: "high", baaRequired: true, phase: "Phase 4" },
      { organizationId: bfm.id, type: "payments", vendor: "Stripe", status: "roadmap", riskLevel: "medium", baaRequired: false, phase: "Phase 2" },
    ],
  });

  await prisma.setting.create({
    data: {
      organizationId: bfm.id,
      key: "clinical_safety",
      value: { blockDiagnosis: true, blockPrescribing: true, blockLabInterpretation: true, requireHumanReview: true },
    },
  });

  console.log("Seeded ClinicOS demo organizations, patients, scheduling, encounter, and roadmap data.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

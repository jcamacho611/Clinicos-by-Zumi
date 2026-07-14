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

  await prisma.auditLog.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.soapNote.deleteMany();
  await prisma.diagnosis.deleteMany();
  await prisma.procedure.deleteMany();
  await prisma.patientBalance.deleteMany();
  await prisma.insuranceVerification.deleteMany();
  await prisma.patientInsurance.deleteMany();
  await prisma.allergy.deleteMany();
  await prisma.medication.deleteMany();
  await prisma.problem.deleteMany();
  await prisma.encounter.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.appointmentType.deleteMany();
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

  await prisma.appointmentType.createMany({
    data: [
      { id: "type-diabetes-follow-up", organizationId: bfm.id, name: "Diabetes follow-up", durationMinutes: 30, color: "teal" },
      { id: "type-new-patient", organizationId: bfm.id, name: "New patient visit", durationMinutes: 45, color: "sky" },
      { id: "type-annual-wellness", organizationId: bfm.id, name: "Annual wellness", durationMinutes: 30, color: "amber", telemedicine: true },
      { id: "type-weight-management", organizationId: luxe.id, name: "Weight management", durationMinutes: 45, color: "violet" },
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
      { id: "apt-1", organizationId: bfm.id, locationId: "loc-brooklyn-heights", patientId: maya.id, providerId: "provider-nadja", appointmentTypeId: "type-diabetes-follow-up", startsAt: new Date("2026-07-14T13:00:00.000Z"), endsAt: new Date("2026-07-14T13:30:00.000Z"), status: AppointmentStatus.CHECKED_IN, formsComplete: true, insuranceVerified: true, paymentDueCents: 2500 },
      { id: "apt-2", organizationId: bfm.id, locationId: "loc-brooklyn-heights", patientId: "pt-1003", providerId: "provider-lee", appointmentTypeId: "type-new-patient", startsAt: new Date("2026-07-14T13:45:00.000Z"), endsAt: new Date("2026-07-14T14:30:00.000Z"), status: AppointmentStatus.IN_ROOM, formsComplete: false, insuranceVerified: false, paymentDueCents: 1500 },
      { id: "apt-3", organizationId: bfm.id, locationId: "loc-brooklyn-heights", patientId: "pt-1002", providerId: "provider-nadja", appointmentTypeId: "type-annual-wellness", startsAt: new Date("2026-07-14T14:45:00.000Z"), endsAt: new Date("2026-07-14T15:15:00.000Z"), status: AppointmentStatus.CONFIRMED, telemedicine: true, formsComplete: true, insuranceVerified: true, paymentDueCents: 3000 },
      { id: "apt-4", organizationId: luxe.id, locationId: "loc-midtown", patientId: "pt-1004", providerId: "provider-nadja-luxe", appointmentTypeId: "type-weight-management", startsAt: new Date("2026-07-14T18:00:00.000Z"), endsAt: new Date("2026-07-14T18:45:00.000Z"), status: AppointmentStatus.CONFIRMED, formsComplete: true, insuranceVerified: true, paymentDueCents: 35000 },
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

  await prisma.encounter.createMany({
    data: [
      {
        id: "enc-1001", organizationId: bfm.id, locationId: "loc-brooklyn-heights", patientId: maya.id,
        providerId: "provider-nadja", appointmentId: "apt-1", type: "Diabetes follow-up",
        serviceDate: new Date("2026-07-14T13:00:00.000Z"), status: EncounterStatus.DRAFT,
        chiefComplaint: "Follow-up for diabetes and elevated home glucose readings.",
        hpi: "40-year-old patient returns for chronic care follow-up with recent above-goal home readings.",
        assessment: "Type 2 diabetes with above-goal recent A1C; hypertension currently controlled.",
        plan: "Provider to review medication plan. Reinforce nutrition and activity goals.",
        patientInstructions: "Continue the plan reviewed with the provider. Contact the office with questions or concerns.",
        followUpPlan: "Repeat A1C and follow up in 3 months or sooner as directed.", createdBy: "user-nadja",
      },
      {
        id: "enc-1002", organizationId: bfm.id, locationId: "loc-brooklyn-heights", patientId: "pt-1003",
        providerId: "provider-lee", appointmentId: "apt-2", type: "New patient visit",
        serviceDate: new Date("2026-07-14T13:45:00.000Z"), status: EncounterStatus.READY_FOR_REVIEW,
        chiefComplaint: "Establish care and review intermittent shortness of breath.",
        hpi: "New patient intake reviewed with episodic symptoms and no current respiratory distress.",
        assessment: "History requires provider confirmation before finalization.",
        plan: "Review inhaler use and preventive care history with the patient.",
        patientInstructions: "Seek urgent care for severe breathing difficulty.",
        followUpPlan: "Follow up after provider review.", createdBy: "user-nadja", updatedBy: "user-nadja",
      },
      {
        id: "enc-1003", organizationId: bfm.id, locationId: "loc-brooklyn-heights", patientId: "pt-1002",
        providerId: "provider-nadja", appointmentId: "apt-3", type: "Annual wellness",
        serviceDate: new Date("2026-07-14T14:45:00.000Z"), status: EncounterStatus.LOCKED,
        chiefComplaint: "Annual wellness visit.", hpi: "Preventive history and medication list reviewed.",
        assessment: "Annual wellness review completed.", plan: "Continue preventive screening schedule.",
        patientInstructions: "Continue current medications as reviewed.", followUpPlan: "Return in one year or as needed.",
        signedAt: new Date("2026-07-14T15:10:00.000Z"), lockedAt: new Date("2026-07-14T15:10:00.000Z"),
        createdBy: "user-nadja", updatedBy: "user-nadja",
      },
      {
        id: "enc-luxe-1001", organizationId: luxe.id, locationId: "loc-midtown", patientId: "pt-1004",
        providerId: "provider-nadja-luxe", appointmentId: "apt-4", type: "Weight management",
        serviceDate: new Date("2026-07-14T18:00:00.000Z"), status: EncounterStatus.DRAFT,
        chiefComplaint: "Program follow-up.", hpi: "Demo record for tenant-isolation verification.",
        assessment: "Requires clinician review.", plan: "Continue reviewed program follow-up.",
        patientInstructions: "Contact the practice with questions.", followUpPlan: "Follow up as scheduled.",
      },
    ],
  });

  await prisma.soapNote.createMany({
    data: [
      { id: "soap-1001", organizationId: bfm.id, patientId: maya.id, encounterId: "enc-1001", subjective: "Home fasting readings reported between 145-170 mg/dL. Working on meal planning and walking three days per week.", objective: "BP 132/84, HR 76, Temp 98.4 F, Weight 171 lb, BMI 29.4. Alert and in no acute distress.", assessment: "Type 2 diabetes with above-goal recent A1C; hypertension currently controlled.", plan: "Provider to review medication plan. Reinforce nutrition and activity goals.", status: EncounterStatus.DRAFT },
      { id: "soap-1002", organizationId: bfm.id, patientId: "pt-1003", encounterId: "enc-1002", subjective: "Reports intermittent symptoms without current distress.", objective: "Intake vitals reviewed; provider exam pending confirmation.", assessment: "History requires provider confirmation before finalization.", plan: "Review inhaler use and preventive care history with the patient.", status: EncounterStatus.READY_FOR_REVIEW },
      { id: "soap-1003", organizationId: bfm.id, patientId: "pt-1002", encounterId: "enc-1003", subjective: "No acute concerns reported during wellness review.", objective: "Preventive screening history reconciled.", assessment: "Annual wellness review completed.", plan: "Continue preventive screening schedule.", status: EncounterStatus.LOCKED, signedBy: "user-nadja", signedAt: new Date("2026-07-14T15:10:00.000Z"), lockedAt: new Date("2026-07-14T15:10:00.000Z") },
      { id: "soap-luxe-1001", organizationId: luxe.id, patientId: "pt-1004", encounterId: "enc-luxe-1001", subjective: "Demo tenant-isolation record.", objective: "No clinical content for production use.", assessment: "Requires clinician review.", plan: "Continue reviewed program follow-up.", status: EncounterStatus.DRAFT },
    ],
  });

  await prisma.diagnosis.createMany({
    data: [
      { id: "dx-1001", organizationId: bfm.id, patientId: maya.id, encounterId: "enc-1001", code: "E11.65", label: "Type 2 diabetes mellitus with hyperglycemia", primary: true },
      { id: "dx-1002", organizationId: bfm.id, patientId: maya.id, encounterId: "enc-1001", code: "I10", label: "Essential hypertension" },
      { id: "dx-1003", organizationId: bfm.id, patientId: "pt-1002", encounterId: "enc-1003", code: "Z00.00", label: "General adult medical examination", primary: true },
    ],
  });

  await prisma.procedure.createMany({
    data: [
      { id: "proc-1001", organizationId: bfm.id, patientId: maya.id, encounterId: "enc-1001", code: "99214", label: "Established patient office visit", modifiers: [] },
      { id: "proc-1002", organizationId: bfm.id, patientId: "pt-1002", encounterId: "enc-1003", code: "G0439", label: "Subsequent annual wellness visit", modifiers: [] },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      { id: "audit-enc-1", organizationId: bfm.id, actorId: "user-nadja", actorType: "user", action: "encounter.created", resourceType: "encounter", resourceId: "enc-1001", patientId: maya.id, metadata: { actorName: "Nadja R., NP" }, createdAt: new Date("2026-07-14T13:06:00.000Z") },
      { id: "audit-enc-2", organizationId: bfm.id, actorId: "user-nadja", actorType: "user", action: "encounter.ready_for_review", resourceType: "encounter", resourceId: "enc-1002", patientId: "pt-1003", metadata: { actorName: "Samuel Lee, MD" }, createdAt: new Date("2026-07-14T14:18:00.000Z") },
      { id: "audit-enc-3", organizationId: bfm.id, actorId: "user-nadja", actorType: "user", action: "encounter.signed_and_locked", resourceType: "encounter", resourceId: "enc-1003", patientId: "pt-1002", metadata: { actorName: "Nadja R., NP" }, createdAt: new Date("2026-07-14T15:10:00.000Z") },
    ],
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

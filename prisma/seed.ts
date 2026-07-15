import "dotenv/config";
import { AppointmentStatus, EncounterStatus, PrismaClient, RiskLevel } from "@prisma/client";
import { hash } from "bcryptjs";
import {
  buildCompletionPlan,
  canonicalCapabilityId,
  clinicOsDayOneRegistry,
  REGISTRY_CANON_VERSION,
  slugifyRegistryValue,
} from "../src/lib/feature-registry-canon";

const prisma = new PrismaClient();

async function seedPriorityZeroRegistry() {
  for (const registrySection of clinicOsDayOneRegistry) {
    const sectionId = `p0-section-${String(registrySection.number).padStart(2, "0")}`;

    await prisma.featureRegistrySection.upsert({
      where: { id: sectionId },
      update: {
        number: registrySection.number,
        slug: registrySection.slug,
        title: registrySection.title,
        mandate: registrySection.mandate,
        priority: "P0",
        deliveryStatus: registrySection.deliveryStatus,
        deliveryMode: registrySection.deliveryMode,
        interfaceRoute: registrySection.interfaceRoute,
        ownerRoles: registrySection.ownerRoles,
        databaseObjects: registrySection.databaseObjects,
        featureCount: registrySection.features.length,
        canonVersion: REGISTRY_CANON_VERSION,
        immutable: true,
      },
      create: {
        id: sectionId,
        number: registrySection.number,
        slug: registrySection.slug,
        title: registrySection.title,
        mandate: registrySection.mandate,
        priority: "P0",
        deliveryStatus: registrySection.deliveryStatus,
        deliveryMode: registrySection.deliveryMode,
        interfaceRoute: registrySection.interfaceRoute,
        ownerRoles: registrySection.ownerRoles,
        databaseObjects: registrySection.databaseObjects,
        featureCount: registrySection.features.length,
        canonVersion: REGISTRY_CANON_VERSION,
        immutable: true,
      },
    });

    await prisma.featureRegistryCapability.createMany({
      skipDuplicates: true,
      data: registrySection.features.map((feature) => ({
        id: canonicalCapabilityId(registrySection.number, feature),
        sectionId,
        slug: slugifyRegistryValue(feature),
        name: feature,
        priority: "P0",
        deliveryStatus: registrySection.deliveryStatus,
        deliveryMode: registrySection.deliveryMode,
        completionPlan: buildCompletionPlan(registrySection, feature),
        canonVersion: REGISTRY_CANON_VERSION,
        immutable: true,
      })),
    });

    await prisma.featureRegistryCapability.updateMany({
      where: { sectionId },
      data: {
        priority: "P0",
        deliveryStatus: registrySection.deliveryStatus,
        deliveryMode: registrySection.deliveryMode,
        canonVersion: REGISTRY_CANON_VERSION,
        immutable: true,
      },
    });
  }
}

async function main() {
  const adminPassword = process.env.CLINICOS_SEED_ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 12 || adminPassword.includes("replace-with")) {
    throw new Error("CLINICOS_SEED_ADMIN_PASSWORD must be set to a non-placeholder value with at least 12 characters.");
  }

  const passwordHash = await hash(adminPassword, 12);

  await seedPriorityZeroRegistry();

  await prisma.labEvent.deleteMany();
  await prisma.labResultItem.deleteMany();
  await prisma.labResult.deleteMany();
  await prisma.labOrder.deleteMany();
  await prisma.referralEvent.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.clinicalOrder.deleteMany();
  await prisma.integrationEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.task.deleteMany();
  await prisma.escalation.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.signature.deleteMany();
  await prisma.consent.deleteMany();
  await prisma.documentReview.deleteMany();
  await prisma.document.deleteMany();
  await prisma.documentCategory.deleteMany();
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
      users: {
        create: {
          id: "user-luxe-owner",
          email: "owner@luxe.example.test",
          name: "Nadja R., NP",
          roleKey: "clinic_owner",
          authCredential: { create: { passwordHash } },
        },
      },
    },
  });

  await prisma.provider.createMany({
    data: [
      { id: "provider-nadja", organizationId: bfm.id, userId: "user-nadja", name: "Nadja R.", credential: "NP", specialty: "Family Medicine", status: "active" },
      { id: "provider-lee", organizationId: bfm.id, name: "Samuel Lee", credential: "MD", specialty: "Family Medicine", status: "active" },
      { id: "provider-nadja-luxe", organizationId: luxe.id, userId: "user-luxe-owner", name: "Nadja R.", credential: "NP", specialty: "Aesthetic Medicine", status: "active" },
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
      { id: "pt-2001", organizationId: luxe.id, locationId: "loc-midtown", mrn: "LUX-10931", firstName: "Maya", lastName: "Thompson", preferredName: "Maya T.", dateOfBirth: new Date("1985-09-12T00:00:00.000Z"), sexAtBirth: "Female", pronouns: "she/her", phone: "(917) 555-0142", email: "maya.thompson@example.test", portalStatus: "invited", identityStatus: "possible_match", requiresHumanReview: true },
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

  await prisma.facility.createMany({
    data: [
      { id: "facility-bfm-main", organizationId: bfm.id, locationId: "loc-brooklyn-heights", name: "Brooklyn Family Medicine", type: "primary_care", specialty: "Family Medicine", status: "verified", verifiedAt: new Date("2026-07-01T12:00:00.000Z") },
      { id: "facility-bfm-diagnostic", organizationId: bfm.id, locationId: "loc-crown-heights", name: "Brooklyn Diagnostic Exchange Demo", type: "imaging", specialty: "Diagnostic Radiology", status: "verified", verifiedAt: new Date("2026-07-01T12:00:00.000Z") },
      { id: "facility-luxe-main", organizationId: luxe.id, locationId: "loc-midtown", name: "Luxe Medi", type: "medical_spa", specialty: "Aesthetic Medicine", status: "verified", verifiedAt: new Date("2026-07-01T12:00:00.000Z") },
    ],
  });

  await prisma.networkConnection.create({
    data: {
      id: "network-bfm-luxe",
      sourceOrganizationId: bfm.id,
      targetOrganizationId: luxe.id,
      status: "active",
      trustLevel: "verified_demo",
      allowedPurposes: ["treatment", "operations"],
      requestedBy: "user-nadja",
      approvedBy: "user-nadja",
      activatedAt: new Date("2026-07-01T12:00:00.000Z"),
    },
  });

  await prisma.dataSharingAgreement.create({
    data: {
      id: "sharing-bfm-luxe",
      sourceOrganizationId: bfm.id,
      targetOrganizationId: luxe.id,
      status: "active_demo",
      allowedPurposes: ["treatment"],
      dataCategories: ["demographics", "allergies", "medications", "approved_visit_summary", "referrals"],
      effectiveAt: new Date("2026-07-01T12:00:00.000Z"),
      expiresAt: new Date("2027-07-01T12:00:00.000Z"),
    },
  });

  await prisma.dataSharingAgreement.create({
    data: {
      id: "sharing-luxe-bfm-identity",
      sourceOrganizationId: luxe.id,
      targetOrganizationId: bfm.id,
      status: "active_demo",
      allowedPurposes: ["operations"],
      dataCategories: ["demographics"],
      effectiveAt: new Date("2026-07-01T12:00:00.000Z"),
      expiresAt: new Date("2027-07-01T12:00:00.000Z"),
    },
  });

  await prisma.patientIdentifier.createMany({
    data: [
      { id: "identifier-maya-bfm", organizationId: bfm.id, patientId: maya.id, system: "urn:clinicos:mrn:org-bfm", value: "BFM-28419", sourceOrganizationId: bfm.id, status: "verified", verifiedAt: new Date("2026-07-14T12:00:00.000Z") },
      { id: "identifier-camille-luxe", organizationId: luxe.id, patientId: "pt-1004", system: "urn:clinicos:mrn:org-luxe", value: "LUX-10428", sourceOrganizationId: luxe.id, status: "verified", verifiedAt: new Date("2026-07-14T12:00:00.000Z") },
      { id: "identifier-maya-luxe", organizationId: luxe.id, patientId: "pt-2001", system: "urn:clinicos:mrn:org-luxe", value: "LUX-10931", sourceOrganizationId: luxe.id, status: "verified", verifiedAt: new Date("2026-07-14T12:00:00.000Z") },
    ],
  });

  await prisma.patientMatch.create({
    data: {
      id: "patient-match-maya-demo",
      organizationId: bfm.id,
      patientId: maya.id,
      candidatePatientId: "pt-2001",
      confidenceScore: 1,
      matchedFields: { matched: ["first_name", "last_name", "date_of_birth", "email", "phone", "sex_at_birth"], conflicts: [], classification: "likely_match" },
      sourceSnapshot: { patientId: maya.id, organizationId: bfm.id, mrn: "BFM-28419", firstName: "Maya", lastName: "Thompson", dateOfBirth: "1985-09-12T00:00:00.000Z", phone: "(917) 555-0142", email: "maya.thompson@example.test" },
      candidateSnapshot: { patientId: "pt-2001", organizationId: luxe.id, mrn: "LUX-10931", firstName: "Maya", lastName: "Thompson", preferredName: "Maya T.", dateOfBirth: "1985-09-12T00:00:00.000Z", phone: "(917) 555-0142", email: "maya.thompson@example.test" },
      status: "possible",
    },
  });

  await prisma.consent.create({
    data: {
      id: "consent-demo-network",
      organizationId: bfm.id,
      patientId: maya.id,
      type: "network_sharing",
      version: 1,
      purposeOfUse: "treatment",
      dataCategories: ["demographics", "allergies", "medications", "approved_visit_summary", "referrals"],
      grantedToOrganizationId: luxe.id,
      source: "demo_seed",
      signerName: "Maya Thompson",
      signerRelationship: "self",
      capturedBy: "user-nadja",
      status: "active",
      effectiveAt: new Date("2026-07-01T12:00:00.000Z"),
      signedAt: new Date("2026-07-01T12:00:00.000Z"),
      expiresAt: new Date("2027-07-01T12:00:00.000Z"),
    },
  });

  await prisma.signature.create({
    data: {
      id: "signature-consent-demo-network",
      organizationId: bfm.id,
      patientId: maya.id,
      entityType: "consent",
      entityId: "consent-demo-network",
      signerName: "Maya Thompson",
      signatureHash: "demo-only-synthetic-consent-receipt-not-a-production-signature",
      context: { signerRelationship: "self", source: "demo_seed", syntheticDemo: true },
      signedAt: new Date("2026-07-01T12:00:00.000Z"),
    },
  });

  await prisma.accessGrant.create({
    data: {
      id: "grant-maya-network-demo",
      organizationId: bfm.id,
      patientId: maya.id,
      granteeOrganizationId: luxe.id,
      purposeOfUse: "treatment",
      dataCategories: ["demographics", "allergies", "medications"],
      accessLevel: "read_only",
      requestId: "record-request-maya-demo",
      reason: "Approved for treatment coordination in the connected-care demo.",
      approvedBy: "user-nadja",
      approvedAt: new Date("2026-07-14T12:30:00.000Z"),
      startsAt: new Date("2026-07-14T12:00:00.000Z"),
      expiresAt: new Date("2026-08-14T12:00:00.000Z"),
      consentId: "consent-demo-network",
      createdBy: "user-nadja",
    },
  });

  await prisma.recordRequest.create({
    data: {
      id: "record-request-maya-demo",
      organizationId: bfm.id,
      patientId: maya.id,
      requestingOrganizationId: luxe.id,
      receivingOrganizationId: bfm.id,
      purposeOfUse: "treatment",
      dataCategories: ["approved_visit_summary", "medications", "allergies"],
      status: "approved",
      deliveryStatus: "delivered",
      requestedBy: "user-luxe-owner",
      reviewedBy: "user-nadja",
      reviewedAt: new Date("2026-07-14T12:30:00.000Z"),
      decisionReason: "Approved for treatment coordination in the connected-care demo.",
      approvedGrantId: "grant-maya-network-demo",
      deliveredAt: new Date("2026-07-14T12:35:00.000Z"),
    },
  });

  await prisma.clinicalOrder.createMany({
    data: [
      { id: "order-referral-cardio", organizationId: bfm.id, patientId: maya.id, encounterId: "enc-1001", providerId: "provider-nadja", type: "referral", details: { specialty: "Cardiology", reason: "Exertional symptoms require specialty evaluation.", clinicalQuestion: "Please evaluate cardiac risk and return consultation recommendations.", priority: "urgent" }, status: "ordered", orderedAt: new Date("2026-07-14T14:00:00.000Z") },
      { id: "order-referral-neuro", organizationId: bfm.id, patientId: "pt-1002", providerId: "provider-nadja", type: "referral", details: { specialty: "Neurology", reason: "Persistent headaches warrant specialist review.", clinicalQuestion: "Please evaluate persistent headaches and recommend next diagnostic steps.", priority: "routine" }, status: "ordered", orderedAt: new Date("2026-07-14T14:20:00.000Z") },
      { id: "order-referral-derm", organizationId: bfm.id, patientId: maya.id, providerId: "provider-nadja", type: "referral", details: { specialty: "Dermatology", reason: "Skin lesion requires specialty evaluation.", clinicalQuestion: "Please assess the lesion and return the consultation plan.", priority: "routine" }, status: "completed", orderedAt: new Date("2026-06-20T14:00:00.000Z") },
      { id: "clinical-lab-a1c", organizationId: bfm.id, patientId: maya.id, encounterId: "enc-1001", providerId: "provider-nadja", type: "lab", details: { tests: [{ name: "Hemoglobin A1C", loincCode: "4548-4" }], diagnosisCodes: ["E11.65"], priority: "routine", vendor: "Quest Diagnostics" }, status: "result_received", orderedAt: new Date("2026-07-10T13:00:00.000Z") },
      { id: "clinical-lab-critical", organizationId: bfm.id, patientId: "pt-1005", providerId: "provider-lee", type: "lab", details: { tests: [{ name: "Comprehensive metabolic panel" }], diagnosisCodes: ["I10"], priority: "stat", vendor: "Brooklyn Hospital Laboratory" }, status: "result_received", orderedAt: new Date("2026-07-14T11:00:00.000Z") },
      { id: "clinical-lab-pending", organizationId: bfm.id, patientId: "pt-1003", providerId: "provider-lee", type: "lab", details: { tests: [{ name: "CBC with differential", loincCode: "57021-8" }], diagnosisCodes: ["J45.20"], priority: "urgent", vendor: "BioReference" }, status: "ordered", orderedAt: new Date("2026-07-14T12:00:00.000Z") },
      { id: "clinical-lab-lipid-current", organizationId: bfm.id, patientId: "pt-1002", providerId: "provider-nadja", type: "lab", details: { tests: [{ name: "Lipid panel", loincCode: "57698-3" }], diagnosisCodes: ["E78.5"], priority: "routine", vendor: "Labcorp" }, status: "result_received", orderedAt: new Date("2026-07-08T12:00:00.000Z") },
      { id: "clinical-lab-lipid-prior", organizationId: bfm.id, patientId: "pt-1002", providerId: "provider-nadja", type: "lab", details: { tests: [{ name: "Lipid panel", loincCode: "57698-3" }], diagnosisCodes: ["E78.5"], priority: "routine", vendor: "Labcorp" }, status: "result_received", orderedAt: new Date("2026-04-08T12:00:00.000Z") },
    ],
  });

  await prisma.document.create({
    data: { id: "doc-critical-lab-source", organizationId: bfm.id, patientId: "pt-1005", name: "Hospital CMP source report - synthetic demo", storageKey: "synthetic/demo/critical-cmp.pdf", mimeType: "application/pdf", sizeBytes: 48211, accessLevel: "INTERNAL", patientVisible: false, internalOnly: true, lockedAt: new Date("2026-07-14T11:40:00.000Z"), uploadedBy: "user-nadja", createdAt: new Date("2026-07-14T11:40:00.000Z") },
  });

  await prisma.labOrder.createMany({
    data: [
      { id: "lab-order-a1c", organizationId: bfm.id, patientId: maya.id, encounterId: "enc-1001", providerId: "provider-nadja", clinicalOrderId: "clinical-lab-a1c", vendor: "Quest Diagnostics", tests: [{ name: "Hemoglobin A1C", loincCode: "4548-4" }], diagnosisCodes: ["E11.65"], priority: "routine", specimenType: "Whole blood", collectionSite: "Clinic", deliveryMethod: "manual", deliveryStatus: "delivered", deliveryAttempts: 1, lastDeliveryAttemptAt: new Date("2026-07-10T13:05:00.000Z"), status: "resulted", orderedAt: new Date("2026-07-10T13:00:00.000Z"), readyAt: new Date("2026-07-10T13:02:00.000Z"), transmittedAt: new Date("2026-07-10T13:05:00.000Z"), collectedAt: new Date("2026-07-10T13:30:00.000Z"), resultsReceivedAt: new Date("2026-07-11T13:42:00.000Z"), createdBy: "user-nadja", provenance: { source: "synthetic_seed", fallback: true } },
      { id: "lab-order-critical", organizationId: bfm.id, patientId: "pt-1005", providerId: "provider-lee", clinicalOrderId: "clinical-lab-critical", vendor: "Brooklyn Hospital Laboratory", tests: [{ name: "Comprehensive metabolic panel" }], diagnosisCodes: ["I10"], priority: "stat", specimenType: "Serum", collectionSite: "Hospital", deliveryMethod: "fax", deliveryStatus: "delivered", deliveryAttempts: 1, lastDeliveryAttemptAt: new Date("2026-07-14T11:05:00.000Z"), status: "resulted", orderedAt: new Date("2026-07-14T11:00:00.000Z"), readyAt: new Date("2026-07-14T11:02:00.000Z"), transmittedAt: new Date("2026-07-14T11:05:00.000Z"), collectedAt: new Date("2026-07-14T11:20:00.000Z"), resultsReceivedAt: new Date("2026-07-14T11:45:00.000Z"), createdBy: "user-nadja", provenance: { source: "synthetic_seed", fallback: true } },
      { id: "lab-order-pending", organizationId: bfm.id, patientId: "pt-1003", providerId: "provider-lee", clinicalOrderId: "clinical-lab-pending", vendor: "BioReference", tests: [{ name: "CBC with differential", loincCode: "57021-8" }], diagnosisCodes: ["J45.20"], priority: "urgent", specimenType: "Whole blood", collectionSite: "Clinic", deliveryMethod: "fax", deliveryStatus: "pending_manual", deliveryAttempts: 1, lastDeliveryAttemptAt: new Date("2026-07-14T12:05:00.000Z"), status: "ready_to_send", orderedAt: new Date("2026-07-14T12:00:00.000Z"), readyAt: new Date("2026-07-14T12:02:00.000Z"), createdBy: "user-nadja", provenance: { source: "synthetic_seed", fallback: true } },
      { id: "lab-order-lipid-current", organizationId: bfm.id, patientId: "pt-1002", providerId: "provider-nadja", clinicalOrderId: "clinical-lab-lipid-current", vendor: "Labcorp", tests: [{ name: "Lipid panel", loincCode: "57698-3" }], diagnosisCodes: ["E78.5"], priority: "routine", specimenType: "Serum", collectionSite: "Clinic", deliveryMethod: "manual", deliveryStatus: "delivered", deliveryAttempts: 1, status: "resulted", orderedAt: new Date("2026-07-08T12:00:00.000Z"), readyAt: new Date("2026-07-08T12:02:00.000Z"), transmittedAt: new Date("2026-07-08T12:05:00.000Z"), collectedAt: new Date("2026-07-08T12:30:00.000Z"), resultsReceivedAt: new Date("2026-07-09T12:00:00.000Z"), createdBy: "user-nadja", provenance: { source: "synthetic_seed" } },
      { id: "lab-order-lipid-prior", organizationId: bfm.id, patientId: "pt-1002", providerId: "provider-nadja", clinicalOrderId: "clinical-lab-lipid-prior", vendor: "Labcorp", tests: [{ name: "Lipid panel", loincCode: "57698-3" }], diagnosisCodes: ["E78.5"], priority: "routine", specimenType: "Serum", collectionSite: "Clinic", deliveryMethod: "manual", deliveryStatus: "delivered", deliveryAttempts: 1, status: "resulted", orderedAt: new Date("2026-04-08T12:00:00.000Z"), readyAt: new Date("2026-04-08T12:02:00.000Z"), transmittedAt: new Date("2026-04-08T12:05:00.000Z"), collectedAt: new Date("2026-04-08T12:30:00.000Z"), resultsReceivedAt: new Date("2026-04-09T12:00:00.000Z"), createdBy: "user-nadja", provenance: { source: "synthetic_seed" } },
      { id: "lab-order-luxe-isolation", organizationId: luxe.id, patientId: "pt-1004", providerId: "provider-nadja-luxe", vendor: "Luxe Manual Laboratory", tests: [{ name: "Demo metabolic panel" }], diagnosisCodes: ["Z71.3"], priority: "routine", specimenType: "Serum", deliveryMethod: "manual", deliveryStatus: "not_started", status: "draft", createdBy: "user-luxe-owner", provenance: { source: "synthetic_seed", tenantIsolation: true } },
    ],
  });

  await prisma.labResult.createMany({
    data: [
      { id: "lab-result-a1c", organizationId: bfm.id, patientId: maya.id, orderId: "lab-order-a1c", vendor: "Quest Diagnostics", panelName: "Hemoglobin A1C", sourceType: "manual_entry", sourceReference: "SYNTHETIC-A1C-20260711", specimenType: "Whole blood", collectedAt: new Date("2026-07-10T13:30:00.000Z"), resultedAt: new Date("2026-07-11T13:42:00.000Z"), receivedAt: new Date("2026-07-11T13:45:00.000Z"), status: "needs_review", abnormal: true, critical: false, provenance: { source: "synthetic_seed", noClinicalInterpretation: true } },
      { id: "lab-result-critical", organizationId: bfm.id, patientId: "pt-1005", orderId: "lab-order-critical", vendor: "Brooklyn Hospital Laboratory", panelName: "Comprehensive metabolic panel", sourceType: "manual_upload", sourceReference: "SYNTHETIC-HOSPITAL-CMP", sourceDocumentId: "doc-critical-lab-source", specimenType: "Serum", collectedAt: new Date("2026-07-14T11:20:00.000Z"), resultedAt: new Date("2026-07-14T11:40:00.000Z"), receivedAt: new Date("2026-07-14T11:45:00.000Z"), status: "needs_review", abnormal: true, critical: true, provenance: { source: "synthetic_seed", sourceDocumentId: "doc-critical-lab-source", noClinicalInterpretation: true } },
      { id: "lab-result-lipid-current", organizationId: bfm.id, patientId: "pt-1002", orderId: "lab-order-lipid-current", vendor: "Labcorp", panelName: "Lipid panel", sourceType: "manual_entry", specimenType: "Serum", collectedAt: new Date("2026-07-08T12:30:00.000Z"), resultedAt: new Date("2026-07-09T12:00:00.000Z"), receivedAt: new Date("2026-07-09T12:05:00.000Z"), status: "released", abnormal: false, critical: false, reviewComments: "Provider reviewed source values and documented follow-up in the chart.", reviewedBy: "user-nadja", reviewedAt: new Date("2026-07-09T13:00:00.000Z"), releaseApprovedBy: "user-nadja", releaseApprovedAt: new Date("2026-07-09T13:05:00.000Z"), patientVisible: true, releasedAt: new Date("2026-07-09T13:05:00.000Z"), patientNotificationStatus: "notified", patientNotifiedAt: new Date("2026-07-09T13:10:00.000Z"), provenance: { source: "synthetic_seed", noClinicalInterpretation: true } },
      { id: "lab-result-lipid-prior", organizationId: bfm.id, patientId: "pt-1002", orderId: "lab-order-lipid-prior", vendor: "Labcorp", panelName: "Lipid panel", sourceType: "manual_entry", specimenType: "Serum", collectedAt: new Date("2026-04-08T12:30:00.000Z"), resultedAt: new Date("2026-04-09T12:00:00.000Z"), receivedAt: new Date("2026-04-09T12:05:00.000Z"), status: "released", abnormal: true, critical: false, reviewComments: "Provider reviewed source values and documented follow-up in the chart.", reviewedBy: "user-nadja", reviewedAt: new Date("2026-04-09T13:00:00.000Z"), releaseApprovedBy: "user-nadja", releaseApprovedAt: new Date("2026-04-09T13:05:00.000Z"), patientVisible: true, releasedAt: new Date("2026-04-09T13:05:00.000Z"), patientNotificationStatus: "notified", patientNotifiedAt: new Date("2026-04-09T13:10:00.000Z"), provenance: { source: "synthetic_seed", noClinicalInterpretation: true } },
      { id: "lab-result-luxe-isolation", organizationId: luxe.id, patientId: "pt-1004", vendor: "Luxe Manual Laboratory", panelName: "Demo metabolic panel", sourceType: "manual_entry", resultedAt: new Date("2026-07-13T18:00:00.000Z"), receivedAt: new Date("2026-07-13T18:05:00.000Z"), status: "needs_review", abnormal: false, critical: false, provenance: { source: "synthetic_seed", tenantIsolation: true } },
    ],
  });

  await prisma.labResultItem.createMany({
    data: [
      { id: "lab-item-a1c", organizationId: bfm.id, labResultId: "lab-result-a1c", sequence: 0, name: "Hemoglobin A1C", loincCode: "4548-4", value: "8.1", numericValue: 8.1, unit: "%", referenceRange: "4.0-5.6", abnormalFlag: "high" },
      { id: "lab-item-critical-k", organizationId: bfm.id, labResultId: "lab-result-critical", sequence: 0, name: "Potassium", loincCode: "2823-3", value: "6.8", numericValue: 6.8, unit: "mmol/L", referenceRange: "3.5-5.1", abnormalFlag: "critical", critical: true },
      { id: "lab-item-critical-na", organizationId: bfm.id, labResultId: "lab-result-critical", sequence: 1, name: "Sodium", loincCode: "2951-2", value: "138", numericValue: 138, unit: "mmol/L", referenceRange: "136-145", abnormalFlag: "normal" },
      { id: "lab-item-lipid-current", organizationId: bfm.id, labResultId: "lab-result-lipid-current", sequence: 0, name: "LDL cholesterol", loincCode: "13457-7", value: "94", numericValue: 94, unit: "mg/dL", referenceRange: "0-99", abnormalFlag: "normal" },
      { id: "lab-item-lipid-prior", organizationId: bfm.id, labResultId: "lab-result-lipid-prior", sequence: 0, name: "LDL cholesterol", loincCode: "13457-7", value: "128", numericValue: 128, unit: "mg/dL", referenceRange: "0-99", abnormalFlag: "high" },
      { id: "lab-item-luxe-isolation", organizationId: luxe.id, labResultId: "lab-result-luxe-isolation", sequence: 0, name: "Synthetic demo value", value: "Within source range", abnormalFlag: "normal" },
    ],
  });

  await prisma.labEvent.createMany({
    data: [
      { id: "lab-event-a1c-received", organizationId: bfm.id, labOrderId: "lab-order-a1c", labResultId: "lab-result-a1c", actorId: "user-nadja", eventType: "result_received", fromStatus: "collected", toStatus: "needs_review", metadata: { abnormal: true, critical: false }, createdAt: new Date("2026-07-11T13:45:00.000Z") },
      { id: "lab-event-critical-received", organizationId: bfm.id, labOrderId: "lab-order-critical", labResultId: "lab-result-critical", actorId: "user-nadja", eventType: "result_received", fromStatus: "collected", toStatus: "needs_review", metadata: { abnormal: true, critical: true }, createdAt: new Date("2026-07-14T11:45:00.000Z") },
      { id: "lab-event-pending-queued", organizationId: bfm.id, labOrderId: "lab-order-pending", actorId: "user-nadja", eventType: "queue_delivery", fromStatus: "ready_to_send", toStatus: "ready_to_send", note: "Fax order queued for staff delivery confirmation.", createdAt: new Date("2026-07-14T12:05:00.000Z") },
      { id: "lab-event-lipid-current-release", organizationId: bfm.id, labOrderId: "lab-order-lipid-current", labResultId: "lab-result-lipid-current", actorId: "user-nadja", eventType: "release", fromStatus: "reviewed", toStatus: "released", createdAt: new Date("2026-07-09T13:05:00.000Z") },
      { id: "lab-event-lipid-prior-release", organizationId: bfm.id, labOrderId: "lab-order-lipid-prior", labResultId: "lab-result-lipid-prior", actorId: "user-nadja", eventType: "release", fromStatus: "reviewed", toStatus: "released", createdAt: new Date("2026-04-09T13:05:00.000Z") },
      { id: "lab-event-luxe-isolation", organizationId: luxe.id, labResultId: "lab-result-luxe-isolation", actorId: "user-luxe-owner", eventType: "result_received", toStatus: "needs_review", createdAt: new Date("2026-07-13T18:05:00.000Z") },
    ],
  });

  await prisma.referral.createMany({
    data: [
      {
        id: "referral-cardio-connected", organizationId: bfm.id, patientId: maya.id, encounterId: "enc-1001", orderId: "order-referral-cardio", specialty: "Cardiology", destination: "Luxe Medi", destinationType: "connected", destinationOrganizationId: luxe.id, destinationFacilityId: "facility-luxe-main", reason: "Exertional symptoms require specialty evaluation.", clinicalQuestion: "Please evaluate cardiac risk and return consultation recommendations.", priority: "urgent", authorizationStatus: "approved", deliveryMethod: "connected_network", deliveryStatus: "delivered", deliveryAttempts: 1, lastDeliveryAttemptAt: new Date("2026-07-14T14:05:00.000Z"), followUpDueAt: new Date("2026-07-16T14:05:00.000Z"), createdBy: "user-nadja", status: "sent", sentAt: new Date("2026-07-14T14:05:00.000Z"), provenance: { source: "synthetic_seed", consentId: "consent-demo-network" }, createdAt: new Date("2026-07-14T14:00:00.000Z")
      },
      {
        id: "referral-neuro-fax", organizationId: bfm.id, patientId: "pt-1002", orderId: "order-referral-neuro", specialty: "Neurology", destination: "Downtown Neurology Associates", destinationType: "external", reason: "Persistent headaches warrant specialist review.", clinicalQuestion: "Please evaluate persistent headaches and recommend next diagnostic steps.", priority: "routine", authorizationStatus: "pending", deliveryMethod: "fax", deliveryStatus: "pending_manual", deliveryAttempts: 1, lastDeliveryAttemptAt: new Date("2026-07-14T14:25:00.000Z"), followUpDueAt: new Date("2026-07-21T14:20:00.000Z"), createdBy: "user-nadja", status: "ready_to_send", provenance: { source: "synthetic_seed", fallback: true }, createdAt: new Date("2026-07-14T14:20:00.000Z")
      },
      {
        id: "referral-derm-closed", organizationId: bfm.id, patientId: maya.id, orderId: "order-referral-derm", specialty: "Dermatology", destination: "Luxe Medi", destinationType: "connected", destinationOrganizationId: luxe.id, destinationFacilityId: "facility-luxe-main", reason: "Skin lesion requires specialty evaluation.", clinicalQuestion: "Please assess the lesion and return the consultation plan.", priority: "routine", authorizationStatus: "not_required", deliveryMethod: "connected_network", deliveryStatus: "delivered", deliveryAttempts: 1, lastDeliveryAttemptAt: new Date("2026-06-20T14:05:00.000Z"), patientOutreachStatus: "notified", patientNotifiedAt: new Date("2026-06-24T16:05:00.000Z"), followUpDueAt: new Date("2026-06-27T14:00:00.000Z"), createdBy: "user-nadja", status: "closed", sentAt: new Date("2026-06-20T14:05:00.000Z"), receivedAt: new Date("2026-06-20T14:08:00.000Z"), acceptedAt: new Date("2026-06-20T14:15:00.000Z"), scheduledAt: new Date("2026-06-20T14:18:00.000Z"), appointmentAt: new Date("2026-06-24T15:00:00.000Z"), completedAt: new Date("2026-06-24T15:40:00.000Z"), consultationNoteReceivedAt: new Date("2026-06-24T16:00:00.000Z"), specialistResponse: "Consultation completed; source provider should review the returned plan with the patient.", closedLoopAt: new Date("2026-06-24T16:10:00.000Z"), closedBy: "user-nadja", provenance: { source: "synthetic_seed", consentId: "consent-demo-network" }, createdAt: new Date("2026-06-20T14:00:00.000Z")
      },
    ],
  });

  await prisma.referralEvent.createMany({
    data: [
      { id: "ref-event-cardio-created", organizationId: bfm.id, referralId: "referral-cardio-connected", actorId: "user-nadja", eventType: "created", toStatus: "draft", deliveryMethod: "connected_network", createdAt: new Date("2026-07-14T14:00:00.000Z") },
      { id: "ref-event-cardio-sent-source", organizationId: bfm.id, referralId: "referral-cardio-connected", actorId: "user-nadja", eventType: "send", fromStatus: "ready_to_send", toStatus: "sent", deliveryMethod: "connected_network", createdAt: new Date("2026-07-14T14:05:00.000Z") },
      { id: "ref-event-cardio-sent-destination", organizationId: luxe.id, referralId: "referral-cardio-connected", actorId: "user-nadja", eventType: "send", fromStatus: "ready_to_send", toStatus: "sent", deliveryMethod: "connected_network", metadata: { representedOrganizationId: bfm.id }, createdAt: new Date("2026-07-14T14:05:00.000Z") },
      { id: "ref-event-neuro-queued", organizationId: bfm.id, referralId: "referral-neuro-fax", actorId: "user-nadja", eventType: "queue_manual_delivery", fromStatus: "ready_to_send", toStatus: "ready_to_send", deliveryMethod: "fax", note: "Fax packet queued for staff delivery confirmation.", createdAt: new Date("2026-07-14T14:25:00.000Z") },
      { id: "ref-event-derm-closed-source", organizationId: bfm.id, referralId: "referral-derm-closed", actorId: "user-nadja", eventType: "close", fromStatus: "consultation_received", toStatus: "closed", deliveryMethod: "connected_network", createdAt: new Date("2026-06-24T16:10:00.000Z") },
      { id: "ref-event-derm-closed-destination", organizationId: luxe.id, referralId: "referral-derm-closed", actorId: "user-nadja", eventType: "close", fromStatus: "consultation_received", toStatus: "closed", deliveryMethod: "connected_network", metadata: { representedOrganizationId: bfm.id }, createdAt: new Date("2026-06-24T16:10:00.000Z") },
    ],
  });

  await prisma.task.create({
    data: { id: "task-referral-neuro-fax", organizationId: bfm.id, patientId: "pt-1002", category: "referral_delivery", title: "Complete fax referral delivery", details: "Referral referral-neuro-fax to Downtown Neurology Associates. Confirm only after staff verifies receipt.", priority: "normal", dueAt: new Date("2026-07-14T14:25:00.000Z"), status: "open", createdBy: "user-nadja" },
  });

  await prisma.task.createMany({
    data: [
      { id: "task-lab-a1c-review", organizationId: bfm.id, patientId: maya.id, category: "lab_review", title: "New lab result requires provider review", details: "Hemoglobin A1C result lab-result-a1c. Review source data, document clinical follow-up, and explicitly approve any patient release.", priority: "high", riskLevel: RiskLevel.NEEDS_PROVIDER, dueAt: new Date("2026-07-11T13:45:00.000Z"), status: "open", createdBy: "user-nadja" },
      { id: "task-lab-critical-review", organizationId: bfm.id, patientId: "pt-1005", category: "lab_review", title: "Critical lab result requires provider review", details: "Comprehensive metabolic panel result lab-result-critical. Review source data, document clinical follow-up, and explicitly approve any patient release.", priority: "urgent", riskLevel: RiskLevel.URGENT, dueAt: new Date("2026-07-14T11:45:00.000Z"), status: "open", createdBy: "user-nadja" },
      { id: "task-lab-pending-delivery", organizationId: bfm.id, patientId: "pt-1003", category: "lab_delivery", title: "Complete fax lab order delivery", details: "Order lab-order-pending for BioReference. Confirm only after staff verifies delivery.", priority: "high", dueAt: new Date("2026-07-14T12:05:00.000Z"), status: "open", createdBy: "user-nadja" },
    ],
  });

  await prisma.escalation.create({
    data: { id: "escalation-lab-critical", organizationId: bfm.id, patientId: "pt-1005", sourceType: "lab_result", sourceId: "lab-result-critical", category: "critical_lab_result", riskLevel: RiskLevel.URGENT, assignedTeam: "clinical_provider", status: "open" },
  });

  await prisma.notification.create({
    data: { id: "notification-lab-critical-owner", organizationId: bfm.id, userId: "user-nadja", type: "critical_lab_result", title: "Critical result requires immediate human review", body: "Comprehensive metabolic panel is flagged critical by source data. ClinicOS has not interpreted the result.", createdAt: new Date("2026-07-14T11:45:00.000Z") },
  });

  await prisma.auditLog.createMany({
    data: [
      { id: "audit-lab-a1c-received", organizationId: bfm.id, actorId: "user-nadja", actorType: "user", action: "lab_result.received", resourceType: "lab_result", resourceId: "lab-result-a1c", patientId: maya.id, metadata: { sourceType: "manual_entry", abnormal: true, critical: false }, createdAt: new Date("2026-07-11T13:45:00.000Z") },
      { id: "audit-lab-critical-received", organizationId: bfm.id, actorId: "user-nadja", actorType: "user", action: "lab_result.received", resourceType: "lab_result", resourceId: "lab-result-critical", patientId: "pt-1005", metadata: { sourceType: "manual_upload", sourceDocumentId: "doc-critical-lab-source", abnormal: true, critical: true }, createdAt: new Date("2026-07-14T11:45:00.000Z") },
      { id: "audit-lab-lipid-release", organizationId: bfm.id, actorId: "user-nadja", actorType: "user", action: "lab_result.release", resourceType: "lab_result", resourceId: "lab-result-lipid-current", patientId: "pt-1002", changes: { status: { from: "reviewed", to: "released" } }, createdAt: new Date("2026-07-09T13:05:00.000Z") },
    ],
  });

  await prisma.recordRequest.create({
    data: {
      id: "record-request-maya-pending",
      organizationId: bfm.id,
      patientId: maya.id,
      requestingOrganizationId: luxe.id,
      receivingOrganizationId: bfm.id,
      purposeOfUse: "treatment",
      dataCategories: ["approved_visit_summary"],
      status: "requested",
      deliveryStatus: "not_started",
      requestedBy: "user-luxe-owner",
      createdAt: new Date("2026-07-14T15:20:00.000Z"),
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        id: "audit-network-approved-demo",
        organizationId: bfm.id,
        actorId: "user-nadja",
        actorType: "user",
        action: "network.record_request_approved",
        resourceType: "access_grant",
        resourceId: "grant-maya-network-demo",
        patientId: maya.id,
        metadata: { representedOrganizationId: bfm.id, purposeOfUse: "treatment", dataCategories: ["demographics", "allergies", "medications"], downloadAllowed: false, printAllowed: false },
        createdAt: new Date("2026-07-14T12:30:00.000Z"),
      },
      {
        id: "audit-network-read-demo",
        organizationId: bfm.id,
        actorId: "user-luxe-owner",
        actorType: "user",
        action: "network.record_read",
        resourceType: "access_receipt",
        resourceId: "access-receipt-demo",
        patientId: maya.id,
        metadata: { representedOrganizationId: luxe.id, purposeOfUse: "treatment", informationAccessed: ["demographics", "allergies", "medications"], accessGrantId: "grant-maya-network-demo", downloadAllowed: false, printAllowed: false },
        createdAt: new Date("2026-07-14T12:35:00.000Z"),
      },
      {
        id: "audit-network-request-pending",
        organizationId: bfm.id,
        actorId: "user-luxe-owner",
        actorType: "user",
        action: "network.record_requested",
        resourceType: "record_request",
        resourceId: "record-request-maya-pending",
        patientId: maya.id,
        metadata: { representedOrganizationId: luxe.id, purposeOfUse: "treatment", dataCategories: ["approved_visit_summary"], minimumNecessary: true },
        createdAt: new Date("2026-07-14T15:20:00.000Z"),
      },
    ],
  });

  await prisma.clinicSubscription.createMany({
    data: [
      { id: "subscription-bfm", organizationId: bfm.id, planKey: "founding-clinic", status: "demo", modules: ["emr", "network", "revenue", "quality", "voice"] },
      { id: "subscription-luxe", organizationId: luxe.id, planKey: "luxe-network", status: "demo", modules: ["emr", "medspa", "network", "inventory", "voice"] },
    ],
  });

  await prisma.careTeamRoom.create({
    data: {
      id: "care-team-maya",
      organizationId: bfm.id,
      patientId: maya.id,
      name: "Maya Thompson Care Constellation",
      sourceType: "care_plan",
      sourceId: "enc-1001",
      status: "active",
      sharedPlan: { goal: "Coordinate chronic-care follow-up", nextAction: "Provider reviews repeat A1C order", riskLevel: "needs_provider" },
      members: {
        create: [
          { id: "care-member-nadja", representedOrganizationId: bfm.id, userId: "user-nadja", providerId: "provider-nadja", role: "primary_care", status: "active", joinedAt: new Date("2026-07-14T12:00:00.000Z") },
          { id: "care-member-luxe-demo", representedOrganizationId: luxe.id, providerId: "provider-nadja-luxe", role: "authorized_network_provider", status: "invited" },
        ],
      },
    },
  });

  await prisma.episodeRoom.create({
    data: {
      id: "episode-maya-demo",
      organizationId: bfm.id,
      patientId: maya.id,
      type: "no_fault_demo",
      title: "Synthetic Injury Episode",
      status: "open",
      readinessScore: 82,
      nextAction: "Attach imaging report",
      responsibleRole: "case_manager",
      riskLevel: RiskLevel.NEEDS_STAFF,
    },
  });

  await prisma.healthPassport.create({
    data: {
      id: "passport-maya",
      organizationId: bfm.id,
      patientId: maya.id,
      status: "active_demo",
      summary: { allergies: ["Penicillin"], medications: ["Metformin", "Lisinopril"], problems: ["Type 2 diabetes", "Essential hypertension"], provenance: "synthetic_seed" },
      lastConfirmedAt: new Date("2026-07-14T12:00:00.000Z"),
    },
  });

  await prisma.consentWallet.create({
    data: {
      id: "consent-wallet-maya",
      organizationId: bfm.id,
      patientId: maya.id,
      sharingDefaults: { treatment: "ask_each_time", payment: "organization_only", operations: "organization_only", sensitiveRecords: "blocked" },
      emergencyPreference: "allow_break_glass_with_alert",
    },
  });

  await prisma.intakePassport.create({
    data: {
      id: "intake-passport-maya",
      organizationId: bfm.id,
      patientId: maya.id,
      reusableFields: { demographics: "confirmed", insurance: "confirmed", pharmacy: "review_due", medications: "provider_review" },
      confirmedAt: new Date("2026-07-14T12:00:00.000Z"),
    },
  });

  await prisma.careHandoff.create({
    data: {
      id: "handoff-maya-lab",
      organizationId: bfm.id,
      patientId: maya.id,
      senderId: "provider-nadja",
      receiverId: "provider-lee",
      type: "lab_review",
      summary: { situation: "Repeat A1C follow-up", background: "Above-goal recent values", assessment: "Provider review required" },
      requestedAction: "Review result and approve patient communication",
      priority: "needs_provider",
      dueAt: new Date("2026-07-15T17:00:00.000Z"),
      status: "sent",
    },
  });

  await prisma.capacityListing.create({
    data: {
      id: "capacity-mri-demo",
      organizationId: bfm.id,
      locationId: "loc-crown-heights",
      facilityId: "facility-bfm-diagnostic",
      type: "imaging",
      service: "MRI Lumbar Spine",
      startsAt: new Date("2026-07-15T18:30:00.000Z"),
      endsAt: new Date("2026-07-15T19:15:00.000Z"),
      acceptedPayers: ["GEICO No-Fault", "Self Pay"],
      urgencyLevels: ["routine", "high"],
      status: "open_demo",
      metadata: { source: "synthetic_seed", bookingMode: "manual_confirmation" },
    },
  });

  await prisma.providerConsultation.create({
    data: {
      id: "consult-maya-demo",
      organizationId: bfm.id,
      patientId: maya.id,
      requestingProviderId: "provider-nadja",
      consultantProviderId: "provider-lee",
      specialty: "Family Medicine",
      clinicalQuestion: "Synthetic demo consultation requiring provider review.",
      status: "requested_demo",
    },
  });

  await prisma.knowledgeItem.create({
    data: {
      id: "knowledge-safety-demo",
      organizationId: bfm.id,
      layer: "organization",
      title: "ClinicOS mandatory emergency routing",
      content: "If this is a medical emergency, call 911 or go to the nearest emergency room. Routine automation must stop and staff must be alerted.",
      sourceName: "ClinicOS Master Canon",
      sourceDate: new Date("2026-07-14T00:00:00.000Z"),
      status: "approved_demo",
      effectiveAt: new Date("2026-07-14T00:00:00.000Z"),
      reviews: { create: { id: "knowledge-review-safety-demo", reviewerId: "user-nadja", decision: "approved_for_demo", notes: "Synthetic demonstration policy." } },
    },
  });

  await prisma.remoteObservation.create({
    data: {
      id: "observation-maya-demo",
      organizationId: bfm.id,
      patientId: maya.id,
      type: "blood_pressure",
      value: "132/84",
      unit: "mmHg",
      source: "patient_entered_demo",
      observedAt: new Date("2026-07-14T11:00:00.000Z"),
      reviewStatus: "reviewed_demo",
      reviewedBy: "user-nadja",
      reviewedAt: new Date("2026-07-14T13:00:00.000Z"),
    },
  });

  await prisma.inventoryItem.create({
    data: {
      id: "inventory-luxe-demo",
      organizationId: luxe.id,
      locationId: "loc-midtown",
      sku: "DEMO-NEUROMODULATOR",
      name: "Synthetic neuromodulator demo lot",
      category: "injectable_demo",
      lotNumber: "LOT-DEMO-2026",
      expiresAt: new Date("2027-01-31T00:00:00.000Z"),
      quantityOnHand: "24",
      quantityReserved: "4",
      reorderPoint: "8",
      unitCostCents: 0,
      status: "demo_only",
    },
  });

  await prisma.voiceSession.create({
    data: {
      id: "voice-session-demo",
      organizationId: bfm.id,
      userId: "user-nadja",
      purpose: "command_bar_demo",
      language: "en-US",
      status: "ready_for_demo",
      provider: "browser_web_speech_demo",
      retentionExpiresAt: new Date("2026-07-15T12:00:00.000Z"),
    },
  });

  console.log(`Seeded ClinicOS demo data and ${clinicOsDayOneRegistry.length} immutable Priority Zero registry sections.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

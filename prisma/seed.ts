import "dotenv/config";
import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { AppointmentStatus, EncounterStatus, PrismaClient, RiskLevel } from "@prisma/client";
import { hash } from "bcryptjs";
import { PDFDocument, StandardFonts } from "pdf-lib";
import {
  buildCompletionPlan,
  canonicalCapabilityId,
  clinicOsDayOneRegistry,
  REGISTRY_CANON_VERSION,
  slugifyRegistryValue,
} from "../src/lib/feature-registry-canon";

const prisma = new PrismaClient();

function encryptSeedDocument(content: string | Buffer) {
  const configured = process.env.DOCUMENT_ENCRYPTION_KEY?.trim();
  const key = configured
    ? (/^[a-f0-9]{64}$/i.test(configured) ? Buffer.from(configured, "hex") : Buffer.from(configured, "base64"))
    : createHash("sha256").update(`clinicos-document-development:${process.env.AUTH_SECRET ?? ""}`).digest();
  if (key.length !== 32 || (!configured && !process.env.AUTH_SECRET)) throw new Error("DOCUMENT_ENCRYPTION_KEY or AUTH_SECRET is required to seed encrypted document demonstrations.");
  const source = Buffer.isBuffer(content) ? content : Buffer.from(content, "utf8");
  const encryptionIv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, encryptionIv);
  const encryptedContent = Buffer.concat([cipher.update(source), cipher.final()]);
  return {
    encryptedContent,
    encryptionIv,
    encryptionAuthTag: cipher.getAuthTag(),
    encryptionKeyId: createHash("sha256").update(key).digest("hex").slice(0, 16),
    checksumSha256: createHash("sha256").update(source).digest("hex"),
    sizeBytes: source.length,
  };
}

async function buildSeedFormPdf(title: string, patient: string) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([612, 792]);
  page.drawText("SYNTHETIC DEMO ONLY", { x: 48, y: 744, size: 9, font: bold });
  page.drawText(title, { x: 48, y: 708, size: 22, font: bold });
  page.drawText(`Patient: ${patient}`, { x: 48, y: 674, size: 11, font: regular });
  page.drawText("This locked demonstration artifact is generated from synthetic ClinicOS form data.", { x: 48, y: 646, size: 9, font: regular });
  page.drawText("The source template, answers, signatures, review decisions, and custody events remain in the database.", { x: 48, y: 630, size: 9, font: regular });
  return Buffer.from(await pdf.save({ useObjectStreams: false }));
}

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

  await prisma.imagingEvent.deleteMany();
  await prisma.imagingResult.deleteMany();
  await prisma.imagingOrder.deleteMany();
  await prisma.labEvent.deleteMany();
  await prisma.labResultItem.deleteMany();
  await prisma.labResult.deleteMany();
  await prisma.labOrder.deleteMany();
  await prisma.referralEvent.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.clinicalOrder.deleteMany();
  await prisma.integrationEvent.deleteMany();
  await prisma.medicationEvent.deleteMany();
  await prisma.medicationWarning.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.refillRequest.deleteMany();
  await prisma.medicationReconciliation.deleteMany();
  await prisma.aiReview.deleteMany();
  await prisma.aiDraft.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.task.deleteMany();
  await prisma.escalation.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.formEvent.deleteMany();
  await prisma.formReview.deleteMany();
  await prisma.signature.deleteMany();
  await prisma.formSubmission.deleteMany();
  await prisma.formAssignment.deleteMany();
  await prisma.formTemplate.deleteMany();
  await prisma.consent.deleteMany();
  await prisma.documentEvent.deleteMany();
  await prisma.documentReview.deleteMany();
  await prisma.document.deleteMany();
  await prisma.documentCategory.deleteMany();
  await prisma.soapNote.deleteMany();
  await prisma.diagnosis.deleteMany();
  await prisma.procedure.deleteMany();
  await prisma.patientBalance.deleteMany();
  await prisma.paymentEvent.deleteMany();
  await prisma.packagePurchase.deleteMany();
  await prisma.patientMembership.deleteMany();
  await prisma.packagePlan.deleteMany();
  await prisma.membershipPlan.deleteMany();
  await prisma.paymentLink.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.insuranceVerification.deleteMany();
  await prisma.priorAuthorization.deleteMany();
  await prisma.patientPharmacy.deleteMany();
  await prisma.patientInsurance.deleteMany();
  await prisma.allergy.deleteMany();
  await prisma.medication.deleteMany();
  await prisma.problem.deleteMany();
  await prisma.encounter.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.appointmentType.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.providerCredential.deleteMany();
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

  await prisma.providerCredential.createMany({
    data: [
      { id: "credential-nadja-dea", organizationId: bfm.id, providerId: "provider-nadja", type: "DEA", number: "DEMO-DEA-NOT-VALID", state: "NY", expiresAt: new Date("2027-12-31T00:00:00.000Z"), status: "active" },
      { id: "credential-nadja-license", organizationId: bfm.id, providerId: "provider-nadja", type: "STATE_LICENSE", number: "DEMO-NY-NP", state: "NY", expiresAt: new Date("2027-12-31T00:00:00.000Z"), status: "active" },
      { id: "credential-luxe-license", organizationId: luxe.id, providerId: "provider-nadja-luxe", type: "STATE_LICENSE", number: "DEMO-NY-NP-LUXE", state: "NY", expiresAt: new Date("2027-12-31T00:00:00.000Z"), status: "active" },
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

  await prisma.patientPharmacy.createMany({
    data: [
      { id: "pharmacy-maya", organizationId: bfm.id, patientId: maya.id, name: "Brooklyn Community Pharmacy", ncpdpId: "DEMO-100001", phone: "(718) 555-0110", fax: "(718) 555-0111", address: { line1: "110 Demo Street", city: "Brooklyn", state: "NY", postalCode: "11201" }, preferred: true, electronicPrescribingEnabled: true, controlledSubstancesEnabled: false, status: "active", source: "synthetic_seed", verifiedBy: "user-nadja", verifiedAt: new Date("2026-07-01T12:00:00.000Z") },
      { id: "pharmacy-darius", organizationId: bfm.id, patientId: "pt-1002", name: "Crown Heights Pharmacy", ncpdpId: "DEMO-100002", phone: "(718) 555-0112", preferred: true, electronicPrescribingEnabled: false, status: "active", source: "synthetic_seed" },
      { id: "pharmacy-anthony", organizationId: bfm.id, patientId: "pt-1005", name: "Prospect Care Pharmacy", phone: "(718) 555-0113", preferred: true, electronicPrescribingEnabled: false, status: "active", source: "synthetic_seed" },
      { id: "pharmacy-luxe-camille", organizationId: luxe.id, patientId: "pt-1004", name: "Midtown Wellness Pharmacy", phone: "(212) 555-0114", preferred: true, electronicPrescribingEnabled: false, status: "active", source: "synthetic_seed" },
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

  await prisma.invoice.createMany({
    data: [
      { id: "invoice-maya-001", organizationId: bfm.id, patientId: "pt-1001", number: "BFM-2026-001", totalCents: 12500, balanceCents: 7500, status: "partially_paid", dueAt: new Date("2026-07-30T00:00:00.000Z") },
      { id: "invoice-camille-001", organizationId: luxe.id, patientId: "pt-1004", number: "LUX-2026-001", totalCents: 35000, balanceCents: 35000, status: "issued", dueAt: new Date("2026-07-28T00:00:00.000Z") },
    ],
  });

  await prisma.payment.createMany({
    data: [
      { id: "payment-maya-visit", organizationId: bfm.id, patientId: "pt-1001", amountCents: 5000, source: "manual_card", status: "posted", postedAt: new Date("2026-07-14T14:00:00.000Z") },
      { id: "payment-camille-deposit", organizationId: luxe.id, patientId: "pt-1004", amountCents: 15000, source: "manual_card", status: "posted", postedAt: new Date("2026-07-13T16:30:00.000Z") },
    ],
  });

  await prisma.paymentLink.createMany({
    data: [
      { id: "payment-link-maya-balance", organizationId: bfm.id, patientId: "pt-1001", amountCents: 7500, tokenHash: "seed-token-hash-maya", status: "active", expiresAt: new Date("2026-07-30T00:00:00.000Z") },
      { id: "payment-link-camille-deposit", organizationId: luxe.id, patientId: "pt-1004", amountCents: 20000, tokenHash: "seed-token-hash-camille", status: "active", expiresAt: new Date("2026-07-25T00:00:00.000Z") },
    ],
  });

  await prisma.membershipPlan.createMany({
    data: [
      { id: "membership-luxe-essential", organizationId: luxe.id, name: "Luxe Essential", description: "Synthetic demo membership for recurring wellness visits.", priceCents: 14900, billingInterval: "monthly", includedSessions: 1 },
      { id: "membership-luxe-premium", organizationId: luxe.id, name: "Luxe Premium", description: "Synthetic demo membership with two monthly sessions.", priceCents: 24900, billingInterval: "monthly", includedSessions: 2 },
    ],
  });

  await prisma.patientMembership.create({
    data: { id: "patient-membership-camille", organizationId: luxe.id, patientId: "pt-1004", planId: "membership-luxe-essential", status: "active", startedAt: new Date("2026-07-01T12:00:00.000Z"), renewsAt: new Date("2026-08-01T12:00:00.000Z"), remainingSessions: 1 },
  });

  await prisma.packagePlan.createMany({
    data: [
      { id: "package-luxe-iv-3", organizationId: luxe.id, name: "IV Hydration · 3 pack", description: "Synthetic demo session package.", priceCents: 39900, includedSessions: 3, expirationDays: 180 },
      { id: "package-luxe-injectables", organizationId: luxe.id, name: "Injectables consultation pack", description: "Synthetic demo package requiring provider review for treatment eligibility.", priceCents: 59900, includedSessions: 2, expirationDays: 180 },
    ],
  });

  await prisma.packagePurchase.create({
    data: { id: "package-purchase-camille-iv", organizationId: luxe.id, patientId: "pt-1004", packagePlanId: "package-luxe-iv-3", paymentId: "payment-camille-deposit", status: "active", purchasedAt: new Date("2026-07-13T16:30:00.000Z"), expiresAt: new Date("2027-01-09T16:30:00.000Z"), remainingSessions: 2 },
  });

  await prisma.paymentEvent.createMany({
    data: [
      { id: "payment-event-maya-posted", organizationId: bfm.id, paymentId: "payment-maya-visit", patientId: "pt-1001", actorId: "user-nadja", eventType: "payment_posted", fromStatus: "pending", toStatus: "posted", amountCents: 5000, metadata: { source: "synthetic_seed", invoiceId: "invoice-maya-001" }, createdAt: new Date("2026-07-14T14:00:00.000Z") },
      { id: "payment-event-camille-membership", organizationId: luxe.id, paymentId: "payment-camille-deposit", patientId: "pt-1004", actorId: "user-luxe-owner", eventType: "package_purchased", toStatus: "active", amountCents: 15000, metadata: { source: "synthetic_seed", packagePurchaseId: "package-purchase-camille-iv" }, createdAt: new Date("2026-07-13T16:30:00.000Z") },
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
      { id: "med-maya-metformin", organizationId: bfm.id, patientId: "pt-1001", name: "Metformin", genericName: "metformin", rxNormCode: "860975", strength: "500 mg", dose: "500 mg", route: "oral", frequency: "twice daily", pharmacyId: "pharmacy-maya", prescribingProviderId: "provider-nadja", source: "provider_entered", reconciliationStatus: "reconciled", reconciledBy: "provider-nadja", reconciledAt: new Date("2026-07-10T14:00:00.000Z"), provenance: { source: "synthetic_seed" }, createdBy: "user-nadja" },
      { id: "med-maya-lisinopril", organizationId: bfm.id, patientId: "pt-1001", name: "Lisinopril", genericName: "lisinopril", rxNormCode: "314076", strength: "10 mg", dose: "10 mg", route: "oral", frequency: "daily", pharmacyId: "pharmacy-maya", prescribingProviderId: "provider-nadja", source: "provider_entered", reconciliationStatus: "reconciled", reconciledBy: "provider-nadja", reconciledAt: new Date("2026-07-10T14:00:00.000Z"), provenance: { source: "synthetic_seed" }, createdBy: "user-nadja" },
      { id: "med-maya-penicillin-reported", organizationId: bfm.id, patientId: "pt-1001", name: "Penicillin", dose: "Patient unsure", frequency: "Patient unsure", source: "patient_reported", patientReported: true, reconciliationStatus: "review_due", provenance: { source: "synthetic_seed", safetyDemonstration: true }, createdBy: "user-nadja" },
      { id: "med-darius-atorvastatin", organizationId: bfm.id, patientId: "pt-1002", name: "Atorvastatin", genericName: "atorvastatin", strength: "20 mg", dose: "20 mg", route: "oral", frequency: "nightly", pharmacyId: "pharmacy-darius", prescribingProviderId: "provider-nadja", source: "provider_entered", reconciliationStatus: "reconciled", reconciledBy: "provider-nadja", reconciledAt: new Date("2026-07-09T14:00:00.000Z"), createdBy: "user-nadja" },
      { id: "med-elena-albuterol", organizationId: bfm.id, patientId: "pt-1003", name: "Albuterol HFA", frequency: "as needed", source: "patient_reported", patientReported: true, reconciliationStatus: "unreconciled", createdBy: "user-nadja" },
      { id: "med-anthony-amlodipine", organizationId: bfm.id, patientId: "pt-1005", name: "Amlodipine", strength: "10 mg", dose: "10 mg", route: "oral", frequency: "daily", pharmacyId: "pharmacy-anthony", prescribingProviderId: "provider-nadja", source: "provider_entered", reconciliationStatus: "review_due", createdBy: "user-nadja" },
      { id: "med-luxe-camille-history", organizationId: luxe.id, patientId: "pt-1004", name: "Weight-management medication history", dose: "See provider-reviewed plan", source: "patient_reported", patientReported: true, reconciliationStatus: "unreconciled", createdBy: "user-luxe-owner", provenance: { source: "synthetic_seed", noTreatmentClaim: true } },
    ],
  });

  await prisma.problem.createMany({
    data: [
      { organizationId: bfm.id, patientId: "pt-1001", code: "E11.9", label: "Type 2 diabetes" },
      { organizationId: bfm.id, patientId: "pt-1001", code: "I10", label: "Essential hypertension" },
      { organizationId: bfm.id, patientId: "pt-1002", code: "E78.5", label: "Hyperlipidemia" },
      { organizationId: bfm.id, patientId: "pt-1003", code: "J45.20", label: "Mild intermittent asthma" },
      { organizationId: bfm.id, patientId: "pt-1005", code: "I10", label: "Uncontrolled hypertension" },
      { organizationId: luxe.id, patientId: "pt-1004", code: "Z71.3", label: "Dietary counseling and surveillance" },
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
      { organizationId: bfm.id, type: "imaging", vendor: "Lenox Hill / RadNet-style adapter", status: "roadmap", riskLevel: "high", baaRequired: true, phase: "Adapter discovery" },
      { organizationId: bfm.id, type: "imaging", vendor: "Hospital radiology interface", status: "roadmap", riskLevel: "high", baaRequired: true, phase: "HL7/FHIR contract" },
      { organizationId: luxe.id, type: "imaging", vendor: "Luxe manual imaging exchange", status: "manual_only", riskLevel: "high", baaRequired: true, phase: "Manual fallback" },
      { id: "integration-bfm-erx-demo", organizationId: bfm.id, type: "e_prescribing", vendor: "Synthetic eRx sandbox adapter", status: "connected", riskLevel: "high", baaRequired: true, phase: "Sandbox contract test", config: { sandbox: true, epcsVerified: false, noProductionTransmission: true } },
      { organizationId: bfm.id, type: "formulary", vendor: "Formulary service roadmap", status: "roadmap", riskLevel: "high", baaRequired: true, phase: "Vendor discovery" },
      { organizationId: bfm.id, type: "pdmp", vendor: "New York PDMP roadmap", status: "roadmap", riskLevel: "high", baaRequired: true, phase: "Legal and vendor review" },
      { organizationId: luxe.id, type: "e_prescribing", vendor: "Luxe manual prescribing fallback", status: "manual_only", riskLevel: "high", baaRequired: true, phase: "Manual fallback" },
      { organizationId: bfm.id, type: "payments", vendor: "Stripe", status: "roadmap", riskLevel: "medium", baaRequired: false, phase: "Phase 2" },
    ],
  });

  await prisma.medicationReconciliation.createMany({
    data: [
      { id: "medrec-maya-completed", organizationId: bfm.id, patientId: maya.id, encounterId: "enc-1001", status: "completed", source: "provider_review", summary: "Synthetic medication sources reviewed with the patient; exact-name warning remains separately governed.", discrepancies: [{ medicationId: "med-maya-penicillin-reported", type: "other", detail: "Patient-reported entry conflicts with recorded allergy and requires provider review." }], medicationIds: ["med-maya-metformin", "med-maya-lisinopril"], createdBy: "user-nadja", completedBy: "provider-nadja", completedAt: new Date("2026-07-10T14:00:00.000Z"), createdAt: new Date("2026-07-10T13:50:00.000Z") },
      { id: "medrec-elena-draft", organizationId: bfm.id, patientId: "pt-1003", status: "draft", source: "staff_review", summary: "Patient-reported inhaler history awaits provider reconciliation.", discrepancies: [], medicationIds: ["med-elena-albuterol"], createdBy: "user-nadja", createdAt: new Date("2026-07-14T13:20:00.000Z") },
      { id: "medrec-luxe-draft", organizationId: luxe.id, patientId: "pt-1004", status: "draft", source: "patient_confirmation", summary: "Synthetic Luxe intake medication history requires licensed provider review.", discrepancies: [], medicationIds: ["med-luxe-camille-history"], createdBy: "user-luxe-owner", createdAt: new Date("2026-07-13T15:20:00.000Z") },
    ],
  });

  await prisma.refillRequest.createMany({
    data: [
      { id: "refill-maya-approved", organizationId: bfm.id, patientId: maya.id, medicationId: "med-maya-metformin", pharmacyId: "pharmacy-maya", providerId: "provider-nadja", requestSource: "patient_portal", requestNote: "Synthetic portal request for normal refill workflow demonstration.", urgency: "routine", status: "approved", providerDecision: "approved", decisionReason: "Synthetic provider-reviewed demonstration only.", decidedBy: "provider-nadja", decidedAt: new Date("2026-07-14T12:20:00.000Z"), createdBy: "user-nadja", createdAt: new Date("2026-07-14T12:00:00.000Z") },
      { id: "refill-darius-failed", organizationId: bfm.id, patientId: "pt-1002", medicationId: "med-darius-atorvastatin", pharmacyId: "pharmacy-darius", providerId: "provider-nadja", requestSource: "pharmacy", requestNote: "Synthetic pharmacy request demonstrating failed manual delivery recovery.", urgency: "routine", status: "failed", providerDecision: "approved", decisionReason: "Synthetic provider-reviewed demonstration only.", decidedBy: "provider-nadja", decidedAt: new Date("2026-07-13T13:00:00.000Z"), deliveryMethod: "fax", transmissionStatus: "failed", failureReason: "Synthetic fax confirmation was not received.", retryCount: 1, lastAttemptAt: new Date("2026-07-13T13:15:00.000Z"), createdBy: "user-nadja", createdAt: new Date("2026-07-13T12:30:00.000Z") },
      { id: "refill-anthony-urgent", organizationId: bfm.id, patientId: "pt-1005", medicationId: "med-anthony-amlodipine", pharmacyId: "pharmacy-anthony", providerId: "provider-nadja", requestSource: "phone", requestNote: "Urgent synthetic request routed for immediate provider review; no automated approval.", urgency: "urgent", status: "needs_provider", createdBy: "user-nadja", createdAt: new Date("2026-07-14T11:10:00.000Z") },
    ],
  });

  await prisma.prescription.createMany({
    data: [
      { id: "rx-maya-draft", organizationId: bfm.id, patientId: maya.id, medicationId: "med-maya-metformin", refillRequestId: "refill-maya-approved", providerId: "provider-nadja", pharmacyId: "pharmacy-maya", status: "draft", dosageInstructions: "Synthetic draft instructions: follow the provider-reviewed medication plan.", quantity: "60", refills: 0, deliveryMethod: "electronic_adapter", integrationId: "integration-bfm-erx-demo", transmissionStatus: "not_started", provenance: { source: "synthetic_seed", humanApprovalRequired: true, noProductionTransmission: true }, createdBy: "user-nadja", createdAt: new Date("2026-07-14T12:25:00.000Z") },
      { id: "rx-darius-failed", organizationId: bfm.id, patientId: "pt-1002", medicationId: "med-darius-atorvastatin", providerId: "provider-nadja", pharmacyId: "pharmacy-darius", status: "failed", dosageInstructions: "Synthetic demonstration instructions from provider-reviewed chart.", quantity: "30", refills: 0, deliveryMethod: "fax", transmissionStatus: "failed", approvedBy: "provider-nadja", approvedAt: new Date("2026-07-13T13:00:00.000Z"), failureReason: "Synthetic fax delivery lacked receipt confirmation.", retryCount: 1, lastAttemptAt: new Date("2026-07-13T13:15:00.000Z"), provenance: { source: "synthetic_seed", manualFallback: true }, createdBy: "user-nadja", createdAt: new Date("2026-07-13T12:50:00.000Z") },
      { id: "rx-luxe-manual", organizationId: luxe.id, patientId: "pt-1004", medicationId: "med-luxe-camille-history", providerId: "provider-nadja-luxe", pharmacyId: "pharmacy-luxe-camille", status: "approved", dosageInstructions: "Synthetic demo only; follow the licensed provider-reviewed plan.", quantity: "1 demo plan", refills: 0, deliveryMethod: "manual", transmissionStatus: "not_started", approvedBy: "provider-nadja-luxe", approvedAt: new Date("2026-07-13T15:40:00.000Z"), provenance: { source: "synthetic_seed", noTreatmentClaim: true }, createdBy: "user-luxe-owner", createdAt: new Date("2026-07-13T15:30:00.000Z") },
    ],
  });

  await prisma.medicationWarning.createMany({
    data: [
      { id: "med-warning-maya-penicillin", organizationId: bfm.id, patientId: maya.id, medicationId: "med-maya-penicillin-reported", warningType: "exact_allergy_name_match", severity: "high", summary: "Exact name match with recorded allergy: Penicillin. Provider review is required.", source: "clinicos_exact_name_rule", evidence: { allergySubstance: "Penicillin", reaction: "hives", rule: "normalized_exact_name" }, status: "open", requiresProviderReview: true, createdAt: new Date("2026-07-14T12:15:00.000Z") },
      { id: "med-warning-darius-reviewed", organizationId: bfm.id, patientId: "pt-1002", medicationId: "med-darius-atorvastatin", prescriptionId: "rx-darius-failed", warningType: "external_formulary_status_unavailable", severity: "warning", summary: "Formulary service is not connected; staff used the documented manual verification fallback.", source: "integration_availability_rule", evidence: { vendorStatus: "roadmap", fallback: "manual" }, status: "acknowledged", requiresProviderReview: true, acknowledgedBy: "provider-nadja", acknowledgedAt: new Date("2026-07-13T12:58:00.000Z"), acknowledgmentReason: "Synthetic provider acknowledged unavailable formulary adapter and reviewed manual verification evidence." },
    ],
  });

  await prisma.medicationEvent.createMany({
    data: [
      { id: "med-event-maya-reconciled", organizationId: bfm.id, patientId: maya.id, reconciliationId: "medrec-maya-completed", actorId: "user-nadja", eventType: "reconciliation_complete", fromStatus: "draft", toStatus: "completed", note: "Synthetic provider completed medication reconciliation.", createdAt: new Date("2026-07-10T14:00:00.000Z") },
      { id: "med-event-maya-refill-approved", organizationId: bfm.id, patientId: maya.id, medicationId: "med-maya-metformin", refillRequestId: "refill-maya-approved", actorId: "user-nadja", eventType: "refill_approve", fromStatus: "needs_provider", toStatus: "approved", note: "Synthetic provider-reviewed demonstration only.", createdAt: new Date("2026-07-14T12:20:00.000Z") },
      { id: "med-event-maya-rx-draft", organizationId: bfm.id, patientId: maya.id, medicationId: "med-maya-metformin", refillRequestId: "refill-maya-approved", prescriptionId: "rx-maya-draft", actorId: "user-nadja", eventType: "prescription_drafted", toStatus: "draft", metadata: { humanApprovalRequired: true }, createdAt: new Date("2026-07-14T12:25:00.000Z") },
      { id: "med-event-maya-warning", organizationId: bfm.id, patientId: maya.id, medicationId: "med-maya-penicillin-reported", actorId: "system", eventType: "warning_created", toStatus: "open", metadata: { warningId: "med-warning-maya-penicillin", source: "clinicos_exact_name_rule" }, createdAt: new Date("2026-07-14T12:15:00.000Z") },
      { id: "med-event-darius-rx-failed", organizationId: bfm.id, patientId: "pt-1002", medicationId: "med-darius-atorvastatin", refillRequestId: "refill-darius-failed", prescriptionId: "rx-darius-failed", actorId: "user-nadja", eventType: "prescription_fail", fromStatus: "queued", toStatus: "failed", note: "Synthetic fax delivery lacked receipt confirmation.", createdAt: new Date("2026-07-13T13:15:00.000Z") },
      { id: "med-event-luxe-approved", organizationId: luxe.id, patientId: "pt-1004", medicationId: "med-luxe-camille-history", prescriptionId: "rx-luxe-manual", actorId: "user-luxe-owner", eventType: "prescription_approve", fromStatus: "draft", toStatus: "approved", note: "Synthetic Luxe provider approval with tenant isolation.", createdAt: new Date("2026-07-13T15:40:00.000Z") },
    ],
  });

  await prisma.integrationEvent.createMany({
    data: [
      { id: "integration-event-rx-darius-failed", organizationId: bfm.id, resourceType: "prescription", resourceId: "rx-darius-failed", direction: "outbound", eventType: "prescription_fail", status: "failed", errorMessage: "Synthetic fax delivery lacked receipt confirmation.", retryCount: 1, metadata: { deliveryMethod: "fax", manualFallback: true }, occurredAt: new Date("2026-07-13T13:15:00.000Z") },
      { id: "integration-event-rx-maya-draft", organizationId: bfm.id, integrationId: "integration-bfm-erx-demo", resourceType: "prescription", resourceId: "rx-maya-draft", direction: "outbound", eventType: "draft_created", status: "manual_review", metadata: { noProductionTransmission: true, providerApprovalRequired: true, displayStatus: "held_for_provider" }, occurredAt: new Date("2026-07-14T12:25:00.000Z") },
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

  await prisma.priorAuthorization.createMany({
    data: [
      { id: "pa-anthony-mri", organizationId: bfm.id, patientId: "pt-1005", payer: "Aetna", service: "MRI lumbar spine without contrast", referenceNumber: "SYNTH-PA-8821", status: "approved", submittedAt: new Date("2026-07-09T14:00:00.000Z"), expiresAt: new Date("2026-08-09T23:59:59.000Z") },
      { id: "pa-elena-ultrasound", organizationId: bfm.id, patientId: "pt-1003", payer: "MetroPlus", service: "Pelvic ultrasound", referenceNumber: "SYNTH-PA-9014", status: "pending", submittedAt: new Date("2026-07-14T11:30:00.000Z") },
    ],
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
      { id: "clinical-imaging-darius", organizationId: bfm.id, patientId: "pt-1002", providerId: "provider-nadja", type: "imaging", details: { study: "Chest radiograph, 2 views", modality: "xray", bodyPart: "Chest", diagnosisCodes: ["E78.5"], clinicalIndication: "Persistent cough documented in the source chart.", priority: "routine", facility: "Brooklyn Diagnostic Exchange Demo" }, status: "result_received", orderedAt: new Date("2026-07-07T13:00:00.000Z") },
      { id: "clinical-imaging-anthony", organizationId: bfm.id, patientId: "pt-1005", providerId: "provider-lee", type: "imaging", details: { study: "MRI lumbar spine without contrast", modality: "mri", bodyPart: "Lumbar spine", diagnosisCodes: ["I10"], clinicalIndication: "Persistent symptoms documented by the ordering provider.", priority: "urgent", facility: "Brooklyn Diagnostic Exchange Demo" }, status: "result_received", orderedAt: new Date("2026-07-10T13:00:00.000Z") },
      { id: "clinical-imaging-elena", organizationId: bfm.id, patientId: "pt-1003", providerId: "provider-lee", type: "imaging", details: { study: "Pelvic ultrasound complete", modality: "ultrasound", bodyPart: "Pelvis", diagnosisCodes: ["J45.20"], clinicalIndication: "Imaging request documented during chart review.", priority: "routine", facility: "Community Diagnostic Imaging" }, status: "draft" },
      { id: "clinical-imaging-maya", organizationId: bfm.id, patientId: maya.id, encounterId: "enc-1001", providerId: "provider-nadja", type: "imaging", details: { study: "DEXA bone density", modality: "dexa", bodyPart: "Hip and spine", diagnosisCodes: ["E11.65"], clinicalIndication: "Preventive imaging review documented in the encounter.", priority: "routine", facility: "Community Diagnostic Imaging" }, status: "result_received", orderedAt: new Date("2026-06-28T13:00:00.000Z") },
      { id: "clinical-imaging-luxe", organizationId: luxe.id, patientId: "pt-1004", providerId: "provider-nadja-luxe", type: "imaging", details: { study: "Ultrasound source report", modality: "ultrasound", bodyPart: "Abdomen", diagnosisCodes: ["Z71.3"], clinicalIndication: "Synthetic tenant-isolation demonstration only.", priority: "routine", facility: "Luxe Manual Imaging Exchange" }, status: "result_received", orderedAt: new Date("2026-07-12T15:00:00.000Z") },
    ],
  });

  await prisma.documentCategory.createMany({
    data: [
      { id: "doccat-bfm-identification", organizationId: bfm.id, code: "identification", name: "Identification", description: "Government-issued patient identity documents.", color: "slate", defaultAccess: "RESTRICTED", reviewRequired: true, retentionDays: 2555, allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png", "image/webp"] },
      { id: "doccat-bfm-insurance", organizationId: bfm.id, code: "insurance_card", name: "Insurance card", color: "sky", defaultAccess: "RESTRICTED", reviewRequired: true, retentionDays: 2555, allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png", "image/webp"] },
      { id: "doccat-bfm-intake", organizationId: bfm.id, code: "intake", name: "Intake", color: "amber", reviewRequired: true, retentionDays: 2555 },
      { id: "doccat-bfm-consent", organizationId: bfm.id, code: "consent", name: "Consent", color: "teal", defaultPatientVisible: true, reviewRequired: true, retentionDays: 3650 },
      { id: "doccat-bfm-clinical", organizationId: bfm.id, code: "clinical_note", name: "Clinical note", color: "indigo", reviewRequired: true, retentionDays: 3650 },
      { id: "doccat-bfm-lab", organizationId: bfm.id, code: "laboratory_result", name: "Laboratory result", color: "emerald", reviewRequired: true, retentionDays: 3650, allowedMimeTypes: ["application/pdf", "text/plain"] },
      { id: "doccat-bfm-imaging", organizationId: bfm.id, code: "imaging_report", name: "Imaging report", color: "blue", reviewRequired: true, retentionDays: 3650, allowedMimeTypes: ["application/pdf", "text/plain"] },
      { id: "doccat-bfm-referral", organizationId: bfm.id, code: "referral", name: "Referral", color: "violet", reviewRequired: true, retentionDays: 3650 },
      { id: "doccat-bfm-prior-auth", organizationId: bfm.id, code: "prior_authorization", name: "Prior authorization", color: "orange", reviewRequired: true, retentionDays: 2555 },
      { id: "doccat-bfm-education", organizationId: bfm.id, code: "patient_education", name: "Patient education", color: "lime", defaultPatientVisible: true, reviewRequired: true, retentionDays: 2555, allowedMimeTypes: ["application/pdf", "text/plain"] },
      { id: "doccat-bfm-billing", organizationId: bfm.id, code: "billing", name: "Billing and claim", color: "stone", defaultAccess: "RESTRICTED", reviewRequired: true, retentionDays: 2555 },
      { id: "doccat-bfm-nofault", organizationId: bfm.id, code: "nofault", name: "No-fault", color: "rose", defaultAccess: "RESTRICTED", reviewRequired: true, retentionDays: 3650 },
      { id: "doccat-bfm-workers", organizationId: bfm.id, code: "workers_comp", name: "Workers compensation", color: "red", defaultAccess: "RESTRICTED", reviewRequired: true, retentionDays: 3650 },
      { id: "doccat-bfm-legal", organizationId: bfm.id, code: "legal", name: "Attorney and adjuster", color: "zinc", defaultAccess: "RESTRICTED", reviewRequired: true, retentionDays: 3650 },
      { id: "doccat-bfm-signed", organizationId: bfm.id, code: "signed_agreement", name: "Signed agreement", color: "cyan", defaultPatientVisible: true, reviewRequired: true, retentionDays: 3650 },
      { id: "doccat-bfm-media", organizationId: bfm.id, code: "before_after_media", name: "Before and after media", color: "pink", defaultAccess: "RESTRICTED", reviewRequired: true, retentionDays: 2555, allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"] },
      { id: "doccat-bfm-misc", organizationId: bfm.id, code: "miscellaneous", name: "Miscellaneous", color: "slate", reviewRequired: true, retentionDays: 2555 },
      { id: "doccat-luxe-consent", organizationId: luxe.id, code: "treatment_consent", name: "Treatment consent", color: "teal", defaultPatientVisible: true, reviewRequired: true, retentionDays: 3650 },
      { id: "doccat-luxe-aftercare", organizationId: luxe.id, code: "aftercare", name: "Aftercare instructions", color: "amber", defaultPatientVisible: true, reviewRequired: true, retentionDays: 2555, allowedMimeTypes: ["application/pdf", "text/plain"] },
      { id: "doccat-luxe-imaging", organizationId: luxe.id, code: "imaging_report", name: "Imaging report", color: "blue", reviewRequired: true, retentionDays: 3650, allowedMimeTypes: ["application/pdf", "text/plain"] },
      { id: "doccat-luxe-media", organizationId: luxe.id, code: "before_after_media", name: "Before and after media", color: "pink", defaultAccess: "RESTRICTED", reviewRequired: true, retentionDays: 2555, allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"] },
      { id: "doccat-luxe-misc", organizationId: luxe.id, code: "miscellaneous", name: "Miscellaneous", color: "slate", reviewRequired: true, retentionDays: 2555 },
    ],
  });

  const carePlanV1 = encryptSeedDocument("SYNTHETIC DEMO ONLY\nMaya Thompson care plan, version 1. This version was replaced and is retained for custody history.");
  const carePlanV2 = encryptSeedDocument("SYNTHETIC DEMO ONLY\nMaya Thompson current care plan, version 2. Follow the provider-authored instructions in the signed encounter.");
  const telemedicineConsent = encryptSeedDocument("SYNTHETIC DEMO ONLY\nDarius Coleman acknowledged the telemedicine consent in this demonstration record.");
  const intakeDraft = encryptSeedDocument("SYNTHETIC DEMO ONLY\nElena Rivera submitted an intake document awaiting authorized human review.");
  const luxeAftercare = encryptSeedDocument("SYNTHETIC DEMO ONLY\nCamille Brooks aftercare instructions. Follow the licensed provider plan and contact the clinic with questions.");
  const mayaLockedForm = encryptSeedDocument(await buildSeedFormPdf("New patient intake - locked form", "Maya Thompson"));
  const luxeLockedForm = encryptSeedDocument(await buildSeedFormPdf("Weight management consent - locked form", "Camille Brooks"));

  await prisma.document.createMany({
    data: [
      { id: "doc-critical-lab-source", organizationId: bfm.id, patientId: "pt-1005", categoryId: "doccat-bfm-lab", versionGroupId: "doc-group-critical-lab", originalFileName: "critical-cmp.pdf", name: "Hospital CMP source report - synthetic demo", storageProvider: "synthetic_reference", storageKey: "synthetic/demo/critical-cmp.pdf", mimeType: "application/pdf", sizeBytes: 48211, accessLevel: "INTERNAL", reviewStatus: "approved", patientVisible: false, internalOnly: true, lockedAt: new Date("2026-07-14T11:40:00.000Z"), uploadedBy: "user-nadja", provenance: { source: "synthetic_seed", externalSourceFallback: true }, createdAt: new Date("2026-07-14T11:40:00.000Z") },
      { id: "doc-anthony-mri-source", organizationId: bfm.id, patientId: "pt-1005", categoryId: "doccat-bfm-imaging", versionGroupId: "doc-group-anthony-mri", originalFileName: "anthony-mri-source.pdf", name: "MRI lumbar spine source report - synthetic demo", storageProvider: "synthetic_reference", storageKey: "synthetic/demo/anthony-mri-source.pdf", mimeType: "application/pdf", sizeBytes: 68420, accessLevel: "INTERNAL", reviewStatus: "approved", patientVisible: false, internalOnly: true, lockedAt: new Date("2026-07-14T10:35:00.000Z"), uploadedBy: "user-nadja", provenance: { source: "synthetic_seed", externalSourceFallback: true }, createdAt: new Date("2026-07-14T10:35:00.000Z") },
      { id: "doc-maya-care-plan-v1", organizationId: bfm.id, patientId: maya.id, encounterId: "enc-1001", categoryId: "doccat-bfm-education", versionGroupId: "doc-group-maya-care-plan", version: 1, originalFileName: "maya-care-plan-v1.txt", name: "Diabetes care plan", description: "Superseded patient education version retained for custody history.", tags: ["diabetes", "care-plan"], sourceType: "generated", storageProvider: "database_encrypted", storageKey: "dbenc/org-bfm/doc-group-maya-care-plan/v1/seed", mimeType: "text/plain", ...carePlanV1, accessLevel: "INTERNAL", reviewStatus: "approved", releaseStatus: "revoked", patientVisible: false, internalOnly: true, status: "superseded", lockedAt: new Date("2026-07-10T14:00:00.000Z"), uploadedBy: "user-nadja", provenance: { source: "synthetic_seed", replaced: true }, createdAt: new Date("2026-07-10T13:30:00.000Z") },
      { id: "doc-maya-care-plan-v2", organizationId: bfm.id, patientId: maya.id, encounterId: "enc-1001", categoryId: "doccat-bfm-education", versionGroupId: "doc-group-maya-care-plan", version: 2, supersedesId: "doc-maya-care-plan-v1", originalFileName: "maya-care-plan-v2.txt", name: "Diabetes care plan", description: "Current provider-reviewed patient education plan.", tags: ["diabetes", "care-plan", "current"], sourceType: "generated", storageProvider: "database_encrypted", storageKey: "dbenc/org-bfm/doc-group-maya-care-plan/v2/seed", mimeType: "text/plain", ...carePlanV2, accessLevel: "PATIENT_VISIBLE", reviewStatus: "approved", releaseStatus: "approved", releaseRequestedAt: new Date("2026-07-11T14:00:00.000Z"), releaseApprovedBy: "user-nadja", releaseApprovedAt: new Date("2026-07-11T14:10:00.000Z"), patientVisible: true, internalOnly: false, status: "active", lockedAt: new Date("2026-07-11T14:10:00.000Z"), uploadedBy: "user-nadja", provenance: { source: "synthetic_seed", supersedesId: "doc-maya-care-plan-v1" }, createdAt: new Date("2026-07-11T14:00:00.000Z") },
      { id: "doc-darius-telemed-consent", organizationId: bfm.id, patientId: "pt-1002", categoryId: "doccat-bfm-consent", versionGroupId: "doc-group-darius-telemed", originalFileName: "darius-telemedicine-consent.txt", name: "Telemedicine consent", tags: ["telemedicine", "signed"], sourceType: "generated", storageProvider: "database_encrypted", storageKey: "dbenc/org-bfm/doc-group-darius-telemed/v1/seed", mimeType: "text/plain", ...telemedicineConsent, accessLevel: "PATIENT_VISIBLE", reviewStatus: "approved", releaseStatus: "approved", releaseRequestedAt: new Date("2026-07-13T12:00:00.000Z"), releaseApprovedBy: "user-nadja", releaseApprovedAt: new Date("2026-07-13T12:10:00.000Z"), patientVisible: true, internalOnly: false, status: "active", lockedAt: new Date("2026-07-13T12:10:00.000Z"), uploadedBy: "user-nadja", provenance: { source: "synthetic_seed", signedFormFallback: true }, createdAt: new Date("2026-07-13T12:00:00.000Z") },
      { id: "doc-elena-intake", organizationId: bfm.id, patientId: "pt-1003", encounterId: "enc-1002", categoryId: "doccat-bfm-intake", versionGroupId: "doc-group-elena-intake", originalFileName: "elena-intake.txt", name: "New patient intake", tags: ["intake", "new-patient"], sourceType: "scan", storageProvider: "database_encrypted", storageKey: "dbenc/org-bfm/doc-group-elena-intake/v1/seed", mimeType: "text/plain", ...intakeDraft, accessLevel: "INTERNAL", reviewStatus: "needs_review", releaseStatus: "pending", releaseRequestedAt: new Date("2026-07-14T13:30:00.000Z"), patientVisible: false, internalOnly: true, status: "active", uploadedBy: "user-nadja", provenance: { source: "synthetic_seed", scannedFallback: true }, createdAt: new Date("2026-07-14T13:30:00.000Z") },
      { id: "doc-anthony-expired-insurance", organizationId: bfm.id, patientId: "pt-1005", categoryId: "doccat-bfm-insurance", versionGroupId: "doc-group-anthony-expired-insurance", originalFileName: "anthony-old-insurance.pdf", name: "Expired insurance card", sourceType: "import", storageProvider: "synthetic_reference", storageKey: "synthetic/demo/anthony-old-insurance.pdf", mimeType: "application/pdf", sizeBytes: 30110, accessLevel: "RESTRICTED", reviewStatus: "approved", releaseStatus: "not_requested", patientVisible: false, internalOnly: true, status: "archived", expiresAt: new Date("2026-06-30T23:59:59.000Z"), lockedAt: new Date("2026-07-01T12:00:00.000Z"), uploadedBy: "user-nadja", provenance: { source: "synthetic_seed", archivedExpired: true }, createdAt: new Date("2025-06-30T12:00:00.000Z") },
      { id: "doc-form-maya-intake-locked", organizationId: bfm.id, patientId: maya.id, categoryId: "doccat-bfm-intake", versionGroupId: "doc-group-form-maya-intake", originalFileName: "maya-new-patient-intake-v2.pdf", name: "New patient intake - locked form", description: "Generated from approved synthetic form submission form-submission-maya-locked.", tags: ["form", "intake", "locked"], sourceType: "generated", storageProvider: "database_encrypted", storageKey: "dbenc/org-bfm/forms/form-submission-maya-locked/seed", mimeType: "application/pdf", ...mayaLockedForm, accessLevel: "PATIENT_VISIBLE", reviewRequired: false, reviewStatus: "approved", releaseStatus: "approved", releaseRequestedAt: new Date("2026-07-10T13:20:00.000Z"), releaseApprovedBy: "user-nadja", releaseApprovedAt: new Date("2026-07-10T13:20:00.000Z"), patientVisible: true, internalOnly: false, status: "active", lockedAt: new Date("2026-07-10T13:20:00.000Z"), uploadedBy: "user-nadja", provenance: { source: "form_submission", submissionId: "form-submission-maya-locked", templateId: "form-template-new-patient-v2", templateVersion: 2, generatedPdf: true, syntheticDemo: true }, createdAt: new Date("2026-07-10T13:20:00.000Z") },
      { id: "doc-luxe-imaging-source", organizationId: luxe.id, patientId: "pt-1004", categoryId: "doccat-luxe-imaging", versionGroupId: "doc-group-luxe-imaging", originalFileName: "luxe-imaging-source.pdf", name: "Luxe imaging source report - synthetic demo", storageProvider: "synthetic_reference", storageKey: "synthetic/demo/luxe-imaging-source.pdf", mimeType: "application/pdf", sizeBytes: 32550, accessLevel: "INTERNAL", patientVisible: false, internalOnly: true, uploadedBy: "user-luxe-owner", provenance: { source: "synthetic_seed", tenantIsolation: true }, createdAt: new Date("2026-07-13T14:00:00.000Z") },
      { id: "doc-luxe-aftercare", organizationId: luxe.id, patientId: "pt-1004", categoryId: "doccat-luxe-aftercare", versionGroupId: "doc-group-luxe-aftercare", originalFileName: "camille-aftercare.txt", name: "Weight management aftercare", tags: ["aftercare", "weight-management"], sourceType: "generated", storageProvider: "database_encrypted", storageKey: "dbenc/org-luxe/doc-group-luxe-aftercare/v1/seed", mimeType: "text/plain", ...luxeAftercare, accessLevel: "PATIENT_VISIBLE", reviewStatus: "approved", releaseStatus: "approved", releaseRequestedAt: new Date("2026-07-13T16:00:00.000Z"), releaseApprovedBy: "user-luxe-owner", releaseApprovedAt: new Date("2026-07-13T16:10:00.000Z"), patientVisible: true, internalOnly: false, lockedAt: new Date("2026-07-13T16:10:00.000Z"), uploadedBy: "user-luxe-owner", provenance: { source: "synthetic_seed", tenantIsolation: true }, createdAt: new Date("2026-07-13T16:00:00.000Z") },
      { id: "doc-form-luxe-consent-locked", organizationId: luxe.id, patientId: "pt-1004", categoryId: "doccat-luxe-consent", versionGroupId: "doc-group-form-luxe-consent", originalFileName: "camille-weight-management-consent-v1.pdf", name: "Weight management consent - locked form", description: "Generated from approved synthetic form submission form-submission-luxe-locked.", tags: ["form", "consent", "locked"], sourceType: "generated", storageProvider: "database_encrypted", storageKey: "dbenc/org-luxe/forms/form-submission-luxe-locked/seed", mimeType: "application/pdf", ...luxeLockedForm, accessLevel: "PATIENT_VISIBLE", reviewRequired: false, reviewStatus: "approved", releaseStatus: "approved", releaseRequestedAt: new Date("2026-07-13T15:50:00.000Z"), releaseApprovedBy: "user-luxe-owner", releaseApprovedAt: new Date("2026-07-13T15:50:00.000Z"), patientVisible: true, internalOnly: false, status: "active", lockedAt: new Date("2026-07-13T15:50:00.000Z"), uploadedBy: "user-luxe-owner", provenance: { source: "form_submission", submissionId: "form-submission-luxe-locked", templateId: "form-template-luxe-treatment", templateVersion: 1, generatedPdf: true, tenantIsolation: true, syntheticDemo: true }, createdAt: new Date("2026-07-13T15:50:00.000Z") },
    ],
  });

  await prisma.documentReview.createMany({
    data: [
      { id: "doc-review-maya-v2", organizationId: bfm.id, documentId: "doc-maya-care-plan-v2", reviewType: "content", requestedBy: "user-nadja", reviewerId: "user-nadja", status: "completed", decision: "approved", notes: "Provider reviewed the current patient education plan before portal release.", reviewedAt: new Date("2026-07-11T14:08:00.000Z"), createdAt: new Date("2026-07-11T14:00:00.000Z") },
      { id: "doc-review-darius-consent", organizationId: bfm.id, documentId: "doc-darius-telemed-consent", reviewType: "content", requestedBy: "user-nadja", reviewerId: "user-nadja", status: "completed", decision: "approved", notes: "Signed consent identity and completion were reviewed.", reviewedAt: new Date("2026-07-13T12:08:00.000Z"), createdAt: new Date("2026-07-13T12:00:00.000Z") },
      { id: "doc-review-elena-intake", organizationId: bfm.id, documentId: "doc-elena-intake", reviewType: "content", requestedBy: "user-nadja", status: "needs_review", dueAt: new Date("2026-07-14T13:30:00.000Z"), createdAt: new Date("2026-07-14T13:30:00.000Z") },
      { id: "doc-review-luxe-aftercare", organizationId: luxe.id, documentId: "doc-luxe-aftercare", reviewType: "content", requestedBy: "user-luxe-owner", reviewerId: "user-luxe-owner", status: "completed", decision: "approved", notes: "Luxe provider approved the aftercare instructions for portal release.", reviewedAt: new Date("2026-07-13T16:08:00.000Z"), createdAt: new Date("2026-07-13T16:00:00.000Z") },
    ],
  });

  await prisma.documentEvent.createMany({
    data: [
      { id: "doc-event-maya-v1-superseded", organizationId: bfm.id, documentId: "doc-maya-care-plan-v1", actorId: "user-nadja", eventType: "superseded", fromStatus: "active/approved/approved", toStatus: "superseded/approved/revoked", note: "Provider issued a corrected current care plan.", metadata: { replacementDocumentId: "doc-maya-care-plan-v2" }, createdAt: new Date("2026-07-11T14:00:00.000Z") },
      { id: "doc-event-maya-v2-version", organizationId: bfm.id, documentId: "doc-maya-care-plan-v2", actorId: "user-nadja", eventType: "version_created", toStatus: "active/needs_review/pending", note: "Provider issued a corrected current care plan.", metadata: { supersedesId: "doc-maya-care-plan-v1", version: 2 }, createdAt: new Date("2026-07-11T14:00:00.000Z") },
      { id: "doc-event-maya-v2-release", organizationId: bfm.id, documentId: "doc-maya-care-plan-v2", actorId: "user-nadja", eventType: "approve_release", fromStatus: "active/approved/pending", toStatus: "active/approved/approved", createdAt: new Date("2026-07-11T14:10:00.000Z") },
      { id: "doc-event-darius-release", organizationId: bfm.id, documentId: "doc-darius-telemed-consent", actorId: "user-nadja", eventType: "approve_release", fromStatus: "active/approved/pending", toStatus: "active/approved/approved", createdAt: new Date("2026-07-13T12:10:00.000Z") },
      { id: "doc-event-elena-upload", organizationId: bfm.id, documentId: "doc-elena-intake", actorId: "user-nadja", eventType: "uploaded", toStatus: "active/needs_review/pending", metadata: { sourceType: "scan", encryptedFallback: true }, createdAt: new Date("2026-07-14T13:30:00.000Z") },
      { id: "doc-event-anthony-archived", organizationId: bfm.id, documentId: "doc-anthony-expired-insurance", actorId: "user-nadja", eventType: "archive", fromStatus: "active/approved/not_requested", toStatus: "archived/approved/not_requested", note: "Expired insurance image replaced by current coverage record.", createdAt: new Date("2026-07-01T12:00:00.000Z") },
      { id: "doc-event-form-maya-generated", organizationId: bfm.id, documentId: "doc-form-maya-intake-locked", actorId: "user-nadja", eventType: "generated_from_form", toStatus: "active/approved/approved", metadata: { submissionId: "form-submission-maya-locked", checksumSha256: mayaLockedForm.checksumSha256, patientCopy: true }, createdAt: new Date("2026-07-10T13:20:00.000Z") },
      { id: "doc-event-luxe-release", organizationId: luxe.id, documentId: "doc-luxe-aftercare", actorId: "user-luxe-owner", eventType: "approve_release", fromStatus: "active/approved/pending", toStatus: "active/approved/approved", createdAt: new Date("2026-07-13T16:10:00.000Z") },
      { id: "doc-event-form-luxe-generated", organizationId: luxe.id, documentId: "doc-form-luxe-consent-locked", actorId: "user-luxe-owner", eventType: "generated_from_form", toStatus: "active/approved/approved", metadata: { submissionId: "form-submission-luxe-locked", checksumSha256: luxeLockedForm.checksumSha256, patientCopy: true }, createdAt: new Date("2026-07-13T15:50:00.000Z") },
    ],
  });

  const newPatientV1Definition = {
    sections: [{ id: "identity", title: "Identity and contact", repeatable: false, fields: [
      { id: "preferred_name", label: "Preferred name", type: "text", required: true, options: [] },
      { id: "contact_email", label: "Email address", type: "email", required: true, options: [] },
      { id: "preferred_language", label: "Preferred language", type: "select", required: true, options: [{ label: "English", value: "english" }, { label: "Spanish", value: "spanish" }, { label: "Other", value: "other" }] },
    ] }],
  };
  const newPatientV2Definition = {
    sections: [
      ...newPatientV1Definition.sections,
      { id: "history", title: "Medical history", repeatable: false, fields: [
        { id: "has_allergies", label: "Do you have allergies?", type: "yes_no", required: true, options: [] },
        { id: "allergy_details", label: "Describe allergies and reactions", type: "textarea", required: true, options: [], condition: { fieldId: "has_allergies", operator: "equals", value: true } },
        { id: "current_medications", label: "Current medications", type: "textarea", required: false, options: [] },
        { id: "medical_history", label: "Medical history", type: "textarea", required: true, options: [] },
      ] },
      { id: "emergency_contacts", title: "Emergency contacts", repeatable: true, fields: [
        { id: "emergency_contact_name", label: "Emergency contact name", type: "text", required: true, options: [] },
        { id: "emergency_contact_phone", label: "Emergency contact phone", type: "phone", required: true, options: [] },
      ] },
    ],
  };
  const telemedicineDefinition = { sections: [{ id: "telemedicine", title: "Telemedicine acknowledgment", repeatable: false, fields: [
    { id: "identity_confirmed", label: "I confirm my identity and current location", type: "checkbox", required: true, options: [] },
    { id: "privacy_acknowledged", label: "I understand telemedicine privacy and technology limitations", type: "checkbox", required: true, options: [] },
    { id: "emergency_plan", label: "Emergency location and callback number", type: "textarea", required: true, options: [] },
  ] }] };
  const noFaultDefinition = { sections: [{ id: "accident", title: "Accident and claim", repeatable: false, fields: [
    { id: "accident_date", label: "Accident date", type: "date", required: true, options: [] },
    { id: "claim_number", label: "Claim number", type: "text", required: true, options: [] },
    { id: "carrier", label: "Insurance carrier", type: "text", required: true, options: [] },
    { id: "injury_description", label: "Injured body parts and symptoms", type: "textarea", required: true, options: [] },
  ] }] };
  const luxeTreatmentDefinition = { sections: [{ id: "treatment", title: "Treatment consent", repeatable: false, fields: [
    { id: "service", label: "Requested service", type: "select", required: true, options: [{ label: "Weight management", value: "weight_management" }, { label: "IV hydration", value: "iv_hydration" }, { label: "Injectables", value: "injectables" }] },
    { id: "risks_reviewed", label: "A licensed provider reviewed material risks and alternatives", type: "checkbox", required: true, options: [] },
    { id: "questions_answered", label: "My questions were answered before signing", type: "checkbox", required: true, options: [] },
  ] }] };

  await prisma.formTemplate.createMany({
    data: [
      { id: "form-template-new-patient-v1", organizationId: bfm.id, templateKey: "new-patient-intake", version: 1, name: "New patient intake", description: "Prior intake version retained for active submission provenance.", category: "intake", audience: "patient", completionModes: ["patient", "staff"], schema: newPatientV1Definition, requiresSignature: true, staffReviewRequired: true, status: "superseded", publishedAt: new Date("2026-01-01T12:00:00.000Z"), retiredAt: new Date("2026-07-01T12:00:00.000Z"), createdBy: "user-nadja", provenance: { source: "synthetic_seed" }, createdAt: new Date("2026-01-01T12:00:00.000Z") },
      { id: "form-template-new-patient-v2", organizationId: bfm.id, templateKey: "new-patient-intake", version: 2, supersedesId: "form-template-new-patient-v1", name: "New patient intake", description: "Primary-care intake with conditional allergy detail and repeatable emergency contacts.", category: "intake", audience: "patient", completionModes: ["patient", "staff", "provider"], schema: newPatientV2Definition, requiresSignature: true, staffReviewRequired: true, providerReviewRequired: false, expirationDays: 365, renewalReminderDays: 30, status: "active", publishedAt: new Date("2026-07-01T12:00:00.000Z"), createdBy: "user-nadja", provenance: { source: "synthetic_seed", supersedesId: "form-template-new-patient-v1" }, createdAt: new Date("2026-07-01T12:00:00.000Z") },
      { id: "form-template-telemedicine", organizationId: bfm.id, templateKey: "telemedicine-consent", version: 1, name: "Telemedicine consent", description: "Identity, privacy, technology, and emergency-location acknowledgment.", category: "consent", audience: "patient", completionModes: ["patient", "staff"], schema: telemedicineDefinition, requiresSignature: true, requiresProviderSignature: true, staffReviewRequired: false, providerReviewRequired: true, expirationDays: 365, renewalReminderDays: 30, status: "active", publishedAt: new Date("2026-06-01T12:00:00.000Z"), createdBy: "user-nadja", provenance: { source: "synthetic_seed" }, createdAt: new Date("2026-06-01T12:00:00.000Z") },
      { id: "form-template-nofault", organizationId: bfm.id, templateKey: "no-fault-intake", version: 1, name: "No-fault intake and assignment", description: "Accident, carrier, claim, injury, and assignment-of-benefits intake.", category: "case", audience: "patient", completionModes: ["patient", "staff"], schema: noFaultDefinition, requiresSignature: true, requiresWitness: true, staffReviewRequired: true, providerReviewRequired: false, status: "active", publishedAt: new Date("2026-06-15T12:00:00.000Z"), createdBy: "user-nadja", provenance: { source: "synthetic_seed", manualFallback: true }, createdAt: new Date("2026-06-15T12:00:00.000Z") },
      { id: "form-template-chronic-draft", organizationId: bfm.id, templateKey: "chronic-care-follow-up", version: 1, name: "Chronic care follow-up", description: "Draft template awaiting administrator publication.", category: "clinical", audience: "patient", completionModes: ["patient", "staff", "provider"], schema: { sections: [{ id: "followup", title: "Follow-up", repeatable: false, fields: [{ id: "changes", label: "Changes since last visit", type: "textarea", required: true, options: [] }] }] }, staffReviewRequired: true, status: "draft", createdBy: "user-nadja", provenance: { source: "synthetic_seed" }, createdAt: new Date("2026-07-14T10:00:00.000Z") },
      { id: "form-template-luxe-treatment", organizationId: luxe.id, templateKey: "weight-management-consent", version: 1, name: "Weight management consent", description: "Provider-reviewed medical-spa treatment consent.", category: "medical_spa", audience: "patient", completionModes: ["patient", "staff", "provider"], schema: luxeTreatmentDefinition, requiresSignature: true, requiresProviderSignature: true, staffReviewRequired: true, providerReviewRequired: true, expirationDays: 180, renewalReminderDays: 14, status: "active", publishedAt: new Date("2026-06-01T12:00:00.000Z"), createdBy: "user-luxe-owner", provenance: { source: "synthetic_seed", tenantIsolation: true }, createdAt: new Date("2026-06-01T12:00:00.000Z") },
    ],
  });

  await prisma.formAssignment.createMany({
    data: [
      { id: "form-assignment-maya-locked", organizationId: bfm.id, patientId: maya.id, templateId: "form-template-new-patient-v2", templateVersion: 2, appointmentId: "apt-1", assignedBy: "user-nadja", completionMode: "patient", deliveryMethod: "portal", status: "completed", dueAt: new Date("2026-07-10T13:00:00.000Z"), expiresAt: new Date("2027-07-10T13:00:00.000Z"), sentAt: new Date("2026-07-08T13:00:00.000Z"), startedAt: new Date("2026-07-09T13:00:00.000Z"), completedAt: new Date("2026-07-10T13:20:00.000Z"), provenance: { source: "synthetic_seed" }, createdAt: new Date("2026-07-08T13:00:00.000Z") },
      { id: "form-assignment-darius-provider", organizationId: bfm.id, patientId: "pt-1002", templateId: "form-template-telemedicine", templateVersion: 1, appointmentId: "apt-3", assignedBy: "user-nadja", completionMode: "patient", deliveryMethod: "portal", status: "submitted", dueAt: new Date("2026-07-14T14:30:00.000Z"), expiresAt: new Date("2027-07-13T12:00:00.000Z"), sentAt: new Date("2026-07-13T11:00:00.000Z"), startedAt: new Date("2026-07-13T11:30:00.000Z"), provenance: { source: "synthetic_seed" }, createdAt: new Date("2026-07-13T11:00:00.000Z") },
      { id: "form-assignment-elena-draft", organizationId: bfm.id, patientId: "pt-1003", templateId: "form-template-new-patient-v2", templateVersion: 2, appointmentId: "apt-2", assignedBy: "user-nadja", completionMode: "staff", deliveryMethod: "staff_assisted", status: "in_progress", dueAt: new Date("2026-07-14T13:30:00.000Z"), expiresAt: new Date("2027-07-14T13:30:00.000Z"), sentAt: new Date("2026-07-14T12:30:00.000Z"), startedAt: new Date("2026-07-14T12:35:00.000Z"), reminderCount: 1, lastReminderAt: new Date("2026-07-14T13:00:00.000Z"), provenance: { source: "synthetic_seed", manualFallback: true }, createdAt: new Date("2026-07-14T12:30:00.000Z") },
      { id: "form-assignment-anthony-review", organizationId: bfm.id, patientId: "pt-1005", templateId: "form-template-nofault", templateVersion: 1, assignedBy: "user-nadja", completionMode: "patient", deliveryMethod: "paper_import", status: "submitted", dueAt: new Date("2026-07-14T16:00:00.000Z"), sentAt: new Date("2026-07-14T10:00:00.000Z"), startedAt: new Date("2026-07-14T10:30:00.000Z"), provenance: { source: "synthetic_seed", paperImport: true }, createdAt: new Date("2026-07-14T10:00:00.000Z") },
      { id: "form-assignment-luxe-locked", organizationId: luxe.id, patientId: "pt-1004", templateId: "form-template-luxe-treatment", templateVersion: 1, appointmentId: "apt-4", assignedBy: "user-luxe-owner", completionMode: "patient", deliveryMethod: "tablet", status: "completed", dueAt: new Date("2026-07-13T15:00:00.000Z"), expiresAt: new Date("2027-01-09T15:00:00.000Z"), sentAt: new Date("2026-07-13T14:30:00.000Z"), startedAt: new Date("2026-07-13T14:35:00.000Z"), completedAt: new Date("2026-07-13T15:50:00.000Z"), provenance: { source: "synthetic_seed", tenantIsolation: true }, createdAt: new Date("2026-07-13T14:30:00.000Z") },
    ],
  });

  await prisma.formSubmission.createMany({
    data: [
      { id: "form-submission-maya-locked", organizationId: bfm.id, patientId: maya.id, templateId: "form-template-new-patient-v2", templateVersion: 2, assignmentId: "form-assignment-maya-locked", appointmentId: "apt-1", completionMode: "patient", completionPercent: 100, answers: { preferred_name: "Maya", contact_email: "maya.thompson@example.test", preferred_language: "english", has_allergies: true, allergy_details: "Penicillin - rash", current_medications: "Metformin", medical_history: "Type 2 diabetes", emergency_contact_name: "Jordan Thompson", emergency_contact_phone: "(917) 555-0102" }, status: "locked", accessLevel: "PATIENT_VISIBLE", reviewedBy: "user-nadja", reviewedAt: new Date("2026-07-10T13:15:00.000Z"), approvedBy: "user-nadja", approvedAt: new Date("2026-07-10T13:15:00.000Z"), documentId: "doc-form-maya-intake-locked", checksumSha256: mayaLockedForm.checksumSha256, expiresAt: new Date("2027-07-10T13:00:00.000Z"), submittedAt: new Date("2026-07-10T13:00:00.000Z"), lockedAt: new Date("2026-07-10T13:20:00.000Z"), provenance: { source: "synthetic_seed", generatedPdf: true }, createdAt: new Date("2026-07-09T13:00:00.000Z") },
      { id: "form-submission-darius-provider", organizationId: bfm.id, patientId: "pt-1002", templateId: "form-template-telemedicine", templateVersion: 1, assignmentId: "form-assignment-darius-provider", appointmentId: "apt-3", completionMode: "patient", completionPercent: 100, answers: { identity_confirmed: true, privacy_acknowledged: true, emergency_plan: "Home in Brooklyn; callback number confirmed in chart." }, status: "provider_review", currentReviewStage: "provider", accessLevel: "INTERNAL", expiresAt: new Date("2027-07-13T12:00:00.000Z"), submittedAt: new Date("2026-07-13T12:00:00.000Z"), provenance: { source: "synthetic_seed" }, createdAt: new Date("2026-07-13T11:30:00.000Z") },
      { id: "form-submission-elena-draft", organizationId: bfm.id, patientId: "pt-1003", templateId: "form-template-new-patient-v2", templateVersion: 2, assignmentId: "form-assignment-elena-draft", appointmentId: "apt-2", completionMode: "staff", completionPercent: 44, answers: { preferred_name: "Elena", contact_email: "elena.rivera@example.test", preferred_language: "spanish", has_allergies: false }, status: "draft", accessLevel: "INTERNAL", expiresAt: new Date("2027-07-14T13:30:00.000Z"), provenance: { source: "synthetic_seed", staffAssisted: true }, createdAt: new Date("2026-07-14T12:35:00.000Z") },
      { id: "form-submission-anthony-review", organizationId: bfm.id, patientId: "pt-1005", templateId: "form-template-nofault", templateVersion: 1, assignmentId: "form-assignment-anthony-review", completionMode: "paper_import", completionPercent: 100, answers: { accident_date: "2026-06-30", claim_number: "SYNTH-NF-1102", carrier: "Demo Mutual", injury_description: "Synthetic demonstration injury details for workflow testing only." }, status: "staff_review", currentReviewStage: "staff", accessLevel: "RESTRICTED", submittedAt: new Date("2026-07-14T11:00:00.000Z"), provenance: { source: "synthetic_seed", paperImport: true }, createdAt: new Date("2026-07-14T10:30:00.000Z") },
      { id: "form-submission-luxe-locked", organizationId: luxe.id, patientId: "pt-1004", templateId: "form-template-luxe-treatment", templateVersion: 1, assignmentId: "form-assignment-luxe-locked", appointmentId: "apt-4", completionMode: "patient", completionPercent: 100, answers: { service: "weight_management", risks_reviewed: true, questions_answered: true }, status: "locked", accessLevel: "PATIENT_VISIBLE", reviewedBy: "user-luxe-owner", reviewedAt: new Date("2026-07-13T15:40:00.000Z"), approvedBy: "user-luxe-owner", approvedAt: new Date("2026-07-13T15:45:00.000Z"), documentId: "doc-form-luxe-consent-locked", checksumSha256: luxeLockedForm.checksumSha256, expiresAt: new Date("2027-01-09T15:00:00.000Z"), submittedAt: new Date("2026-07-13T15:15:00.000Z"), lockedAt: new Date("2026-07-13T15:50:00.000Z"), provenance: { source: "synthetic_seed", generatedPdf: true, tenantIsolation: true }, createdAt: new Date("2026-07-13T14:35:00.000Z") },
    ],
  });

  await prisma.signature.createMany({
    data: [
      { id: "signature-form-maya-submitter", organizationId: bfm.id, patientId: maya.id, userId: "user-nadja", entityType: "form_submission", entityId: "form-submission-maya-locked", signerType: "submitter", signerName: "Maya Thompson", signerRelationship: "Self", signatureMethod: "attested_typed", signatureHash: createHash("sha256").update("synthetic-maya-form-signature").digest("hex"), attestation: "Synthetic demonstration attestation only.", context: { source: "synthetic_seed" }, signedAt: new Date("2026-07-10T13:05:00.000Z") },
      { id: "signature-form-darius-submitter", organizationId: bfm.id, patientId: "pt-1002", userId: "user-nadja", entityType: "form_submission", entityId: "form-submission-darius-provider", signerType: "submitter", signerName: "Darius Coleman", signerRelationship: "Self", signatureMethod: "attested_typed", signatureHash: createHash("sha256").update("synthetic-darius-form-signature").digest("hex"), attestation: "Synthetic demonstration attestation only.", context: { source: "synthetic_seed" }, signedAt: new Date("2026-07-13T11:58:00.000Z") },
      { id: "signature-form-anthony-submitter", organizationId: bfm.id, patientId: "pt-1005", userId: "user-nadja", entityType: "form_submission", entityId: "form-submission-anthony-review", signerType: "submitter", signerName: "Anthony Price", signerRelationship: "Self", signatureMethod: "imported", signatureHash: createHash("sha256").update("synthetic-anthony-imported-signature").digest("hex"), attestation: "Imported from synthetic paper workflow.", context: { source: "synthetic_seed", paperImport: true }, signedAt: new Date("2026-07-14T10:58:00.000Z") },
      { id: "signature-form-anthony-witness", organizationId: bfm.id, patientId: "pt-1005", userId: "user-nadja", entityType: "form_submission", entityId: "form-submission-anthony-review", signerType: "witness", signerName: "Demo Witness", signerRelationship: "Witness", signatureMethod: "imported", signatureHash: createHash("sha256").update("synthetic-anthony-witness-signature").digest("hex"), attestation: "Imported from synthetic paper workflow.", context: { source: "synthetic_seed", paperImport: true }, signedAt: new Date("2026-07-14T10:59:00.000Z") },
      { id: "signature-form-luxe-submitter", organizationId: luxe.id, patientId: "pt-1004", userId: "user-luxe-owner", entityType: "form_submission", entityId: "form-submission-luxe-locked", signerType: "submitter", signerName: "Camille Brooks", signerRelationship: "Self", signatureMethod: "attested_typed", signatureHash: createHash("sha256").update("synthetic-luxe-submitter-signature").digest("hex"), attestation: "Synthetic demonstration attestation only.", context: { source: "synthetic_seed", tenantIsolation: true }, signedAt: new Date("2026-07-13T15:18:00.000Z") },
      { id: "signature-form-luxe-provider", organizationId: luxe.id, patientId: "pt-1004", userId: "user-luxe-owner", providerId: "provider-nadja-luxe", entityType: "form_submission", entityId: "form-submission-luxe-locked", signerType: "provider", signerName: "Nadja R.", signerRelationship: "Licensed provider", signatureMethod: "system_credential", signatureHash: createHash("sha256").update("synthetic-luxe-provider-signature").digest("hex"), attestation: "Synthetic demonstration provider review only.", context: { source: "synthetic_seed", providerCredential: "Nadja R., NP", tenantIsolation: true }, signedAt: new Date("2026-07-13T15:42:00.000Z") },
    ],
  });

  await prisma.formReview.createMany({
    data: [
      { id: "form-review-maya-staff", organizationId: bfm.id, submissionId: "form-submission-maya-locked", stage: "staff", requestedBy: "user-nadja", reviewerId: "user-nadja", status: "completed", decision: "approved", notes: "Identity and required answers reviewed before lock.", reviewedAt: new Date("2026-07-10T13:15:00.000Z"), createdAt: new Date("2026-07-10T13:00:00.000Z") },
      { id: "form-review-darius-provider", organizationId: bfm.id, submissionId: "form-submission-darius-provider", stage: "provider", requestedBy: "user-nadja", status: "needs_review", dueAt: new Date("2026-07-14T14:30:00.000Z"), createdAt: new Date("2026-07-13T12:00:00.000Z") },
      { id: "form-review-anthony-staff", organizationId: bfm.id, submissionId: "form-submission-anthony-review", stage: "staff", requestedBy: "user-nadja", status: "needs_review", dueAt: new Date("2026-07-14T16:00:00.000Z"), createdAt: new Date("2026-07-14T11:00:00.000Z") },
      { id: "form-review-luxe-staff", organizationId: luxe.id, submissionId: "form-submission-luxe-locked", stage: "staff", requestedBy: "user-luxe-owner", reviewerId: "user-luxe-owner", status: "completed", decision: "approved", notes: "Staff verified completion and signer identity.", reviewedAt: new Date("2026-07-13T15:35:00.000Z"), createdAt: new Date("2026-07-13T15:15:00.000Z") },
      { id: "form-review-luxe-provider", organizationId: luxe.id, submissionId: "form-submission-luxe-locked", stage: "provider", requestedBy: "user-luxe-owner", reviewerId: "user-luxe-owner", status: "completed", decision: "approved", notes: "Licensed provider reviewed treatment consent before lock.", reviewedAt: new Date("2026-07-13T15:45:00.000Z"), createdAt: new Date("2026-07-13T15:35:00.000Z") },
    ],
  });

  await prisma.formEvent.createMany({
    data: [
      { id: "form-event-maya-assigned", organizationId: bfm.id, templateId: "form-template-new-patient-v2", assignmentId: "form-assignment-maya-locked", actorId: "user-nadja", eventType: "assigned", toStatus: "not_started", metadata: { deliveryMethod: "portal" }, createdAt: new Date("2026-07-08T13:00:00.000Z") },
      { id: "form-event-maya-locked", organizationId: bfm.id, templateId: "form-template-new-patient-v2", assignmentId: "form-assignment-maya-locked", submissionId: "form-submission-maya-locked", actorId: "user-nadja", eventType: "lock", fromStatus: "approved", toStatus: "locked", metadata: { documentId: "doc-form-maya-intake-locked", checksumSha256: mayaLockedForm.checksumSha256, patientCopy: true }, createdAt: new Date("2026-07-10T13:20:00.000Z") },
      { id: "form-event-darius-review", organizationId: bfm.id, templateId: "form-template-telemedicine", assignmentId: "form-assignment-darius-provider", submissionId: "form-submission-darius-provider", actorId: "user-nadja", eventType: "review_requested", fromStatus: "draft", toStatus: "provider_review", metadata: { stage: "provider" }, createdAt: new Date("2026-07-13T12:00:00.000Z") },
      { id: "form-event-elena-saved", organizationId: bfm.id, templateId: "form-template-new-patient-v2", assignmentId: "form-assignment-elena-draft", submissionId: "form-submission-elena-draft", actorId: "user-nadja", eventType: "saved", fromStatus: "draft", toStatus: "draft", metadata: { completionPercent: 44, completionMode: "staff" }, createdAt: new Date("2026-07-14T12:45:00.000Z") },
      { id: "form-event-anthony-review", organizationId: bfm.id, templateId: "form-template-nofault", assignmentId: "form-assignment-anthony-review", submissionId: "form-submission-anthony-review", actorId: "user-nadja", eventType: "review_requested", fromStatus: "draft", toStatus: "staff_review", metadata: { stage: "staff", paperImport: true }, createdAt: new Date("2026-07-14T11:00:00.000Z") },
      { id: "form-event-luxe-locked", organizationId: luxe.id, templateId: "form-template-luxe-treatment", assignmentId: "form-assignment-luxe-locked", submissionId: "form-submission-luxe-locked", actorId: "user-luxe-owner", eventType: "lock", fromStatus: "approved", toStatus: "locked", metadata: { documentId: "doc-form-luxe-consent-locked", checksumSha256: luxeLockedForm.checksumSha256, tenantIsolation: true }, createdAt: new Date("2026-07-13T15:50:00.000Z") },
    ],
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

  await prisma.imagingOrder.createMany({
    data: [
      { id: "img-order-darius-xray", organizationId: bfm.id, patientId: "pt-1002", providerId: "provider-nadja", clinicalOrderId: "clinical-imaging-darius", study: "Chest radiograph, 2 views", modality: "xray", bodyPart: "Chest", diagnosisCodes: ["E78.5"], clinicalIndication: "Persistent cough documented in the source chart.", priority: "routine", facility: "Brooklyn Diagnostic Exchange Demo", authorizationStatus: "not_required", deliveryMethod: "manual", deliveryStatus: "delivered", deliveryAttempts: 1, lastDeliveryAttemptAt: new Date("2026-07-07T13:10:00.000Z"), appointmentStatus: "completed", scheduledAt: new Date("2026-07-08T13:00:00.000Z"), status: "report_received", orderedAt: new Date("2026-07-07T13:00:00.000Z"), readyAt: new Date("2026-07-07T13:02:00.000Z"), transmittedAt: new Date("2026-07-07T13:10:00.000Z"), completedAt: new Date("2026-07-08T13:25:00.000Z"), reportReceivedAt: new Date("2026-07-08T16:00:00.000Z"), createdBy: "user-nadja", provenance: { source: "synthetic_seed", fallback: true } },
      { id: "img-order-anthony-mri", organizationId: bfm.id, patientId: "pt-1005", providerId: "provider-lee", clinicalOrderId: "clinical-imaging-anthony", priorAuthorizationId: "pa-anthony-mri", study: "MRI lumbar spine without contrast", modality: "mri", bodyPart: "Lumbar spine", diagnosisCodes: ["I10"], clinicalIndication: "Persistent symptoms documented by the ordering provider.", priority: "urgent", facility: "Brooklyn Diagnostic Exchange Demo", authorizationStatus: "approved", deliveryMethod: "fax", deliveryStatus: "delivered", deliveryAttempts: 1, lastDeliveryAttemptAt: new Date("2026-07-10T13:10:00.000Z"), appointmentStatus: "completed", scheduledAt: new Date("2026-07-14T09:00:00.000Z"), status: "report_received", orderedAt: new Date("2026-07-10T13:00:00.000Z"), readyAt: new Date("2026-07-10T13:02:00.000Z"), transmittedAt: new Date("2026-07-10T13:10:00.000Z"), completedAt: new Date("2026-07-14T09:45:00.000Z"), reportReceivedAt: new Date("2026-07-14T10:40:00.000Z"), createdBy: "user-nadja", provenance: { source: "synthetic_seed", priorAuthorizationId: "pa-anthony-mri", fallback: true } },
      { id: "img-order-elena-ultrasound", organizationId: bfm.id, patientId: "pt-1003", providerId: "provider-lee", clinicalOrderId: "clinical-imaging-elena", priorAuthorizationId: "pa-elena-ultrasound", study: "Pelvic ultrasound complete", modality: "ultrasound", bodyPart: "Pelvis", diagnosisCodes: ["J45.20"], clinicalIndication: "Imaging request documented during chart review.", priority: "routine", facility: "Community Diagnostic Imaging", authorizationStatus: "pending", deliveryMethod: "manual", deliveryStatus: "not_started", appointmentStatus: "not_scheduled", status: "draft", createdBy: "user-nadja", provenance: { source: "synthetic_seed", authorizationBlocked: true } },
      { id: "img-order-maya-dexa", organizationId: bfm.id, patientId: maya.id, encounterId: "enc-1001", providerId: "provider-nadja", clinicalOrderId: "clinical-imaging-maya", study: "DEXA bone density", modality: "dexa", bodyPart: "Hip and spine", diagnosisCodes: ["E11.65"], clinicalIndication: "Preventive imaging review documented in the encounter.", priority: "routine", facility: "Community Diagnostic Imaging", authorizationStatus: "not_required", deliveryMethod: "direct", deliveryStatus: "delivered", deliveryAttempts: 1, appointmentStatus: "completed", scheduledAt: new Date("2026-06-30T14:00:00.000Z"), status: "report_received", orderedAt: new Date("2026-06-28T13:00:00.000Z"), readyAt: new Date("2026-06-28T13:05:00.000Z"), transmittedAt: new Date("2026-06-28T13:15:00.000Z"), completedAt: new Date("2026-06-30T14:30:00.000Z"), reportReceivedAt: new Date("2026-06-30T17:00:00.000Z"), createdBy: "user-nadja", provenance: { source: "synthetic_seed", fallback: true } },
      { id: "img-order-luxe-isolation", organizationId: luxe.id, patientId: "pt-1004", providerId: "provider-nadja-luxe", clinicalOrderId: "clinical-imaging-luxe", study: "Ultrasound source report", modality: "ultrasound", bodyPart: "Abdomen", diagnosisCodes: ["Z71.3"], clinicalIndication: "Synthetic tenant-isolation demonstration only.", priority: "routine", facility: "Luxe Manual Imaging Exchange", authorizationStatus: "not_required", deliveryMethod: "manual", deliveryStatus: "delivered", deliveryAttempts: 1, appointmentStatus: "completed", status: "report_received", orderedAt: new Date("2026-07-12T15:00:00.000Z"), readyAt: new Date("2026-07-12T15:02:00.000Z"), transmittedAt: new Date("2026-07-12T15:10:00.000Z"), completedAt: new Date("2026-07-13T13:45:00.000Z"), reportReceivedAt: new Date("2026-07-13T14:05:00.000Z"), createdBy: "user-luxe-owner", provenance: { source: "synthetic_seed", tenantIsolation: true } },
    ],
  });

  await prisma.imagingResult.createMany({
    data: [
      { id: "img-result-darius-xray", organizationId: bfm.id, patientId: "pt-1002", orderId: "img-order-darius-xray", facility: "Brooklyn Diagnostic Exchange Demo", reportTitle: "Chest radiograph source report", sourceType: "structured_manual", sourceReference: "SYNTH-XR-20260708", findings: "Source report describes the submitted chest radiographs. Synthetic demonstration text only.", impression: "Source report impression recorded for demonstration; no ClinicOS interpretation.", imageReference: "SYNTH-PACS-XR-1002", studyPerformedAt: new Date("2026-07-08T13:25:00.000Z"), receivedAt: new Date("2026-07-08T16:00:00.000Z"), status: "released", urgentSourceFlag: false, reviewComments: "Active provider reviewed the source report and documented follow-up in the chart.", reviewedBy: "user-nadja", reviewedAt: new Date("2026-07-08T16:20:00.000Z"), releaseApprovedBy: "user-nadja", releaseApprovedAt: new Date("2026-07-08T16:25:00.000Z"), patientVisible: true, releasedAt: new Date("2026-07-08T16:25:00.000Z"), patientNotificationStatus: "notified", patientNotifiedAt: new Date("2026-07-08T16:30:00.000Z"), provenance: { source: "synthetic_seed", noClinicalInterpretation: true } },
      { id: "img-result-anthony-mri", organizationId: bfm.id, patientId: "pt-1005", orderId: "img-order-anthony-mri", reportDocumentId: "doc-anthony-mri-source", facility: "Brooklyn Diagnostic Exchange Demo", reportTitle: "MRI lumbar spine source report", sourceType: "manual_upload", sourceReference: "SYNTH-MRI-20260714", findings: "Source report findings copied from the synthetic demonstration PDF.", impression: "Source report includes an urgent flag requiring immediate provider review. ClinicOS has not interpreted it.", imageReference: "SYNTH-PACS-MRI-1005", studyPerformedAt: new Date("2026-07-14T09:45:00.000Z"), receivedAt: new Date("2026-07-14T10:40:00.000Z"), status: "needs_review", urgentSourceFlag: true, patientVisible: false, provenance: { source: "synthetic_seed", reportDocumentId: "doc-anthony-mri-source", noClinicalInterpretation: true } },
      { id: "img-result-maya-dexa-v1", organizationId: bfm.id, patientId: maya.id, orderId: "img-order-maya-dexa", facility: "Community Diagnostic Imaging", reportTitle: "DEXA source report", sourceType: "structured_manual", sourceReference: "SYNTH-DEXA-V1", findings: "Original source report version retained after a facility correction.", impression: "Original source impression retained for provenance.", studyPerformedAt: new Date("2026-06-30T14:30:00.000Z"), receivedAt: new Date("2026-06-30T17:00:00.000Z"), status: "corrected", patientVisible: false, version: 1, provenance: { source: "synthetic_seed", corrected: true, noClinicalInterpretation: true } },
      { id: "img-result-maya-dexa-v2", organizationId: bfm.id, patientId: maya.id, orderId: "img-order-maya-dexa", facility: "Community Diagnostic Imaging", reportTitle: "Corrected DEXA source report", sourceType: "structured_manual", sourceReference: "SYNTH-DEXA-V2", findings: "Corrected source report version supplied by the imaging facility.", impression: "Corrected source impression awaiting provider review.", studyPerformedAt: new Date("2026-06-30T14:30:00.000Z"), receivedAt: new Date("2026-07-01T12:00:00.000Z"), status: "needs_review", patientVisible: false, correctionOfId: "img-result-maya-dexa-v1", correctionReason: "Imaging facility supplied a corrected source report.", version: 2, provenance: { source: "synthetic_seed", correctionOfId: "img-result-maya-dexa-v1", noClinicalInterpretation: true } },
      { id: "img-result-luxe-isolation", organizationId: luxe.id, patientId: "pt-1004", orderId: "img-order-luxe-isolation", reportDocumentId: "doc-luxe-imaging-source", facility: "Luxe Manual Imaging Exchange", reportTitle: "Luxe ultrasound source report", sourceType: "manual_upload", sourceReference: "SYNTH-LUXE-US-20260713", findings: "Synthetic Luxe-only source findings.", impression: "Synthetic Luxe-only source impression awaiting provider review.", studyPerformedAt: new Date("2026-07-13T13:45:00.000Z"), receivedAt: new Date("2026-07-13T14:05:00.000Z"), status: "needs_review", patientVisible: false, provenance: { source: "synthetic_seed", tenantIsolation: true, noClinicalInterpretation: true } },
    ],
  });

  await prisma.imagingEvent.createMany({
    data: [
      { id: "img-event-darius-release", organizationId: bfm.id, imagingOrderId: "img-order-darius-xray", imagingResultId: "img-result-darius-xray", actorId: "user-nadja", eventType: "release", fromStatus: "reviewed", toStatus: "released", createdAt: new Date("2026-07-08T16:25:00.000Z") },
      { id: "img-event-anthony-received", organizationId: bfm.id, imagingOrderId: "img-order-anthony-mri", imagingResultId: "img-result-anthony-mri", actorId: "user-nadja", eventType: "report_received", toStatus: "needs_review", metadata: { urgentSourceFlag: true, sourceType: "manual_upload" }, createdAt: new Date("2026-07-14T10:40:00.000Z") },
      { id: "img-event-elena-created", organizationId: bfm.id, imagingOrderId: "img-order-elena-ultrasound", actorId: "user-nadja", eventType: "created", toStatus: "draft", metadata: { authorizationStatus: "pending" }, createdAt: new Date("2026-07-14T11:35:00.000Z") },
      { id: "img-event-maya-corrected", organizationId: bfm.id, imagingOrderId: "img-order-maya-dexa", imagingResultId: "img-result-maya-dexa-v1", actorId: "user-nadja", eventType: "corrected", fromStatus: "released", toStatus: "corrected", note: "Imaging facility supplied a corrected source report.", metadata: { replacementResultId: "img-result-maya-dexa-v2" }, createdAt: new Date("2026-07-01T12:00:00.000Z") },
      { id: "img-event-maya-v2", organizationId: bfm.id, imagingOrderId: "img-order-maya-dexa", imagingResultId: "img-result-maya-dexa-v2", actorId: "user-nadja", eventType: "correction_created", toStatus: "needs_review", metadata: { correctionOfId: "img-result-maya-dexa-v1", version: 2 }, createdAt: new Date("2026-07-01T12:00:00.000Z") },
      { id: "img-event-luxe-received", organizationId: luxe.id, imagingOrderId: "img-order-luxe-isolation", imagingResultId: "img-result-luxe-isolation", actorId: "user-luxe-owner", eventType: "report_received", toStatus: "needs_review", createdAt: new Date("2026-07-13T14:05:00.000Z") },
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
      { id: "task-imaging-anthony-review", organizationId: bfm.id, patientId: "pt-1005", category: "imaging_review", title: "Urgent-source imaging report requires provider review", details: "MRI lumbar spine source report result img-result-anthony-mri. Review the source report, document clinical follow-up, and explicitly approve any patient release.", priority: "urgent", riskLevel: RiskLevel.URGENT, dueAt: new Date("2026-07-14T10:40:00.000Z"), status: "open", createdBy: "user-nadja" },
      { id: "task-imaging-maya-correction", organizationId: bfm.id, patientId: maya.id, category: "imaging_review", title: "Corrected imaging report requires provider review", details: "Corrected DEXA source report result img-result-maya-dexa-v2. Review corrected source content before any portal release.", priority: "high", riskLevel: RiskLevel.NEEDS_PROVIDER, dueAt: new Date("2026-07-01T12:00:00.000Z"), status: "open", createdBy: "user-nadja" },
      { id: "task-imaging-luxe-review", organizationId: luxe.id, patientId: "pt-1004", category: "imaging_review", title: "New imaging report requires provider review", details: "Luxe ultrasound source report result img-result-luxe-isolation. Tenant-isolation demonstration.", priority: "high", riskLevel: RiskLevel.NEEDS_PROVIDER, dueAt: new Date("2026-07-13T14:05:00.000Z"), status: "open", createdBy: "user-luxe-owner" },
      { id: "task-document-elena-review", organizationId: bfm.id, patientId: "pt-1003", category: "document_review", title: "Document requires human review", details: "New patient intake document doc-elena-intake. Review classification, content, and release suitability.", priority: "high", riskLevel: RiskLevel.NEEDS_STAFF, dueAt: new Date("2026-07-14T13:30:00.000Z"), status: "open", createdBy: "user-nadja" },
      { id: "task-form-darius-provider", organizationId: bfm.id, patientId: "pt-1002", category: "form_provider_review", title: "Telemedicine consent requires provider review", details: "Submission form-submission-darius-provider requires an active provider identity, provider attestation, and explicit decision before lock.", priority: "high", riskLevel: RiskLevel.NEEDS_PROVIDER, dueAt: new Date("2026-07-14T14:30:00.000Z"), status: "open", createdBy: "user-nadja" },
      { id: "task-form-anthony-staff", organizationId: bfm.id, patientId: "pt-1005", category: "form_staff_review", title: "No-fault intake requires staff review", details: "Imported paper submission form-submission-anthony-review requires identity, completeness, and witness review.", priority: "normal", riskLevel: RiskLevel.NEEDS_STAFF, dueAt: new Date("2026-07-14T16:00:00.000Z"), status: "open", createdBy: "user-nadja" },
      { id: "task-form-elena-completion", organizationId: bfm.id, patientId: "pt-1003", category: "form_completion", title: "New patient intake requires completion", details: "Staff-assisted assignment form-assignment-elena-draft remains incomplete. Use the documented manual fallback if needed.", priority: "normal", riskLevel: RiskLevel.NEEDS_STAFF, dueAt: new Date("2026-07-14T13:30:00.000Z"), status: "open", createdBy: "user-nadja" },
      { id: "task-med-elena-reconciliation", organizationId: bfm.id, patientId: "pt-1003", category: "medication_reconciliation", title: "Medication reconciliation requires provider completion", details: "Review patient-reported Albuterol HFA history before completing reconciliation.", priority: "normal", riskLevel: RiskLevel.NEEDS_PROVIDER, dueAt: new Date("2026-07-14T13:20:00.000Z"), status: "open", createdBy: "user-nadja" },
      { id: "task-med-anthony-refill", organizationId: bfm.id, patientId: "pt-1005", category: "refill_review", title: "Urgent refill request requires provider review", details: "Amlodipine request refill-anthony-urgent. ClinicOS cannot approve refills.", priority: "urgent", riskLevel: RiskLevel.URGENT, dueAt: new Date("2026-07-14T11:10:00.000Z"), status: "open", ownerId: "provider-nadja", createdBy: "user-nadja" },
      { id: "task-med-maya-warning", organizationId: bfm.id, patientId: maya.id, category: "medication_safety_review", title: "Medication warning requires provider review", details: "Exact name match with recorded allergy: Penicillin. Rule source: clinicos_exact_name_rule. ClinicOS has not made a clinical determination.", priority: "high", riskLevel: RiskLevel.NEEDS_PROVIDER, dueAt: new Date("2026-07-14T12:15:00.000Z"), status: "open", createdBy: "user-nadja" },
      { id: "task-med-luxe-reconciliation", organizationId: luxe.id, patientId: "pt-1004", category: "medication_reconciliation", title: "Medication reconciliation requires provider completion", details: "Synthetic Luxe intake medication history requires licensed provider review.", priority: "normal", riskLevel: RiskLevel.NEEDS_PROVIDER, dueAt: new Date("2026-07-13T15:20:00.000Z"), status: "open", createdBy: "user-luxe-owner" },
    ],
  });

  await prisma.aiDraft.create({
    data: {
      id: "ai-draft-navigation-maya",
      organizationId: bfm.id,
      patientId: maya.id,
      sourceType: "patient_navigation",
      sourceId: "navigation-seed-maya",
      purpose: "administrative_navigation",
      content: "We can help Maya request an appointment. The front desk will review availability and follow up; this message does not confirm a visit.",
      riskLevel: RiskLevel.NEEDS_STAFF,
      requiresHumanReview: true,
      blockedFromSend: true,
      status: "draft",
      createdAt: new Date("2026-07-14T15:30:00.000Z"),
    },
  });

  await prisma.task.create({
    data: {
      id: "task-navigation-maya",
      organizationId: bfm.id,
      patientId: maya.id,
      category: "patient_navigation",
      title: "Review patient navigation request",
      details: "draft:ai-draft-navigation-maya Appointment request requires front desk review; no visit is confirmed.",
      priority: "normal",
      riskLevel: RiskLevel.NEEDS_STAFF,
      dueAt: new Date("2026-07-15T15:30:00.000Z"),
      status: "open",
      createdBy: "user-nadja",
    },
  });

  await prisma.escalation.createMany({
    data: [
      { id: "escalation-lab-critical", organizationId: bfm.id, patientId: "pt-1005", sourceType: "lab_result", sourceId: "lab-result-critical", category: "critical_lab_result", riskLevel: RiskLevel.URGENT, assignedTeam: "clinical_provider", status: "open" },
      { id: "escalation-imaging-anthony", organizationId: bfm.id, patientId: "pt-1005", sourceType: "imaging_result", sourceId: "img-result-anthony-mri", category: "urgent_imaging_source_flag", riskLevel: RiskLevel.URGENT, assignedTeam: "clinical_provider", status: "open" },
      { id: "escalation-med-anthony-refill", organizationId: bfm.id, patientId: "pt-1005", sourceType: "refill_request", sourceId: "refill-anthony-urgent", category: "urgent_refill_human_review", riskLevel: RiskLevel.URGENT, assignedTeam: "clinical_provider", status: "open" },
    ],
  });

  await prisma.notification.createMany({
    data: [
      { id: "notification-lab-critical-owner", organizationId: bfm.id, userId: "user-nadja", type: "critical_lab_result", title: "Critical result requires immediate human review", body: "Comprehensive metabolic panel is flagged critical by source data. ClinicOS has not interpreted the result.", createdAt: new Date("2026-07-14T11:45:00.000Z") },
      { id: "notification-imaging-anthony-owner", organizationId: bfm.id, userId: "user-nadja", type: "urgent_imaging_source_flag", title: "Imaging report requires urgent human review", body: "MRI lumbar spine source report carries an urgent flag from the source. ClinicOS has not interpreted the report.", createdAt: new Date("2026-07-14T10:40:00.000Z") },
      { id: "notification-med-anthony-refill", organizationId: bfm.id, userId: "user-nadja", type: "urgent_refill_review", title: "Urgent refill request requires provider review", body: "Synthetic refill request is held for human review. ClinicOS cannot approve or prescribe.", createdAt: new Date("2026-07-14T11:10:00.000Z") },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      { id: "audit-lab-a1c-received", organizationId: bfm.id, actorId: "user-nadja", actorType: "user", action: "lab_result.received", resourceType: "lab_result", resourceId: "lab-result-a1c", patientId: maya.id, metadata: { sourceType: "manual_entry", abnormal: true, critical: false }, createdAt: new Date("2026-07-11T13:45:00.000Z") },
      { id: "audit-lab-critical-received", organizationId: bfm.id, actorId: "user-nadja", actorType: "user", action: "lab_result.received", resourceType: "lab_result", resourceId: "lab-result-critical", patientId: "pt-1005", metadata: { sourceType: "manual_upload", sourceDocumentId: "doc-critical-lab-source", abnormal: true, critical: true }, createdAt: new Date("2026-07-14T11:45:00.000Z") },
      { id: "audit-lab-lipid-release", organizationId: bfm.id, actorId: "user-nadja", actorType: "user", action: "lab_result.release", resourceType: "lab_result", resourceId: "lab-result-lipid-current", patientId: "pt-1002", changes: { status: { from: "reviewed", to: "released" } }, createdAt: new Date("2026-07-09T13:05:00.000Z") },
      { id: "audit-imaging-darius-release", organizationId: bfm.id, actorId: "user-nadja", actorType: "user", action: "imaging_result.release", resourceType: "imaging_result", resourceId: "img-result-darius-xray", patientId: "pt-1002", changes: { status: { from: "reviewed", to: "released" } }, metadata: { activeProviderIdentity: true, noClinicalInterpretation: true }, createdAt: new Date("2026-07-08T16:25:00.000Z") },
      { id: "audit-imaging-anthony-received", organizationId: bfm.id, actorId: "user-nadja", actorType: "user", action: "imaging_result.received", resourceType: "imaging_result", resourceId: "img-result-anthony-mri", patientId: "pt-1005", metadata: { sourceType: "manual_upload", reportDocumentId: "doc-anthony-mri-source", urgentSourceFlag: true, noClinicalInterpretation: true }, createdAt: new Date("2026-07-14T10:40:00.000Z") },
      { id: "audit-imaging-maya-correction", organizationId: bfm.id, actorId: "user-nadja", actorType: "user", action: "imaging_result.corrected", resourceType: "imaging_result", resourceId: "img-result-maya-dexa-v1", patientId: maya.id, changes: { status: { from: "released", to: "corrected" }, replacementResultId: "img-result-maya-dexa-v2" }, metadata: { reason: "Imaging facility supplied a corrected source report.", replacementVersion: 2 }, createdAt: new Date("2026-07-01T12:00:00.000Z") },
      { id: "audit-document-elena-upload", organizationId: bfm.id, actorId: "user-nadja", actorType: "user", action: "document.uploaded", resourceType: "document", resourceId: "doc-elena-intake", patientId: "pt-1003", metadata: { categoryId: "doccat-bfm-intake", sourceType: "scan", encryptedFallback: true }, createdAt: new Date("2026-07-14T13:30:00.000Z") },
      { id: "audit-document-maya-version", organizationId: bfm.id, actorId: "user-nadja", actorType: "user", action: "document.version_created", resourceType: "document", resourceId: "doc-maya-care-plan-v2", patientId: maya.id, changes: { priorDocumentId: "doc-maya-care-plan-v1", priorVersion: 1, replacementVersion: 2 }, metadata: { reason: "Provider issued a corrected current care plan." }, createdAt: new Date("2026-07-11T14:00:00.000Z") },
      { id: "audit-document-maya-release", organizationId: bfm.id, actorId: "user-nadja", actorType: "user", action: "document.approve_release", resourceType: "document", resourceId: "doc-maya-care-plan-v2", patientId: maya.id, changes: { releaseStatus: { from: "pending", to: "approved" }, patientVisible: { from: false, to: true } }, createdAt: new Date("2026-07-11T14:10:00.000Z") },
      { id: "audit-document-darius-preview", organizationId: bfm.id, actorId: "user-nadja", actorType: "user", action: "document.content.preview", resourceType: "document", resourceId: "doc-darius-telemed-consent", patientId: "pt-1002", metadata: { version: 1, checksumVerified: true, syntheticDemo: true }, createdAt: new Date("2026-07-13T12:15:00.000Z") },
      { id: "audit-document-luxe-release", organizationId: luxe.id, actorId: "user-luxe-owner", actorType: "user", action: "document.approve_release", resourceType: "document", resourceId: "doc-luxe-aftercare", patientId: "pt-1004", changes: { releaseStatus: { from: "pending", to: "approved" } }, metadata: { tenantIsolation: true }, createdAt: new Date("2026-07-13T16:10:00.000Z") },
      { id: "audit-form-maya-lock", organizationId: bfm.id, actorId: "user-nadja", actorType: "user", action: "form_submission.lock", resourceType: "form_submission", resourceId: "form-submission-maya-locked", patientId: maya.id, changes: { status: { from: "approved", to: "locked" } }, metadata: { documentId: "doc-form-maya-intake-locked", checksumSha256: mayaLockedForm.checksumSha256, patientCopy: true }, createdAt: new Date("2026-07-10T13:20:00.000Z") },
      { id: "audit-form-darius-submit", organizationId: bfm.id, actorId: "user-nadja", actorType: "user", action: "form_submission.submit", resourceType: "form_submission", resourceId: "form-submission-darius-provider", patientId: "pt-1002", changes: { status: { from: "draft", to: "provider_review" } }, metadata: { templateId: "form-template-telemedicine", templateVersion: 1 }, createdAt: new Date("2026-07-13T12:00:00.000Z") },
      { id: "audit-form-luxe-lock", organizationId: luxe.id, actorId: "user-luxe-owner", actorType: "user", action: "form_submission.lock", resourceType: "form_submission", resourceId: "form-submission-luxe-locked", patientId: "pt-1004", changes: { status: { from: "approved", to: "locked" } }, metadata: { documentId: "doc-form-luxe-consent-locked", checksumSha256: luxeLockedForm.checksumSha256, tenantIsolation: true }, createdAt: new Date("2026-07-13T15:50:00.000Z") },
      { id: "audit-med-maya-reconciliation", organizationId: bfm.id, actorId: "user-nadja", actorType: "user", action: "medication_reconciliation.complete", resourceType: "medication_reconciliation", resourceId: "medrec-maya-completed", patientId: maya.id, changes: { status: { from: "draft", to: "completed" } }, metadata: { providerId: "provider-nadja", medicationIds: ["med-maya-metformin", "med-maya-lisinopril"], syntheticDemo: true }, createdAt: new Date("2026-07-10T14:00:00.000Z") },
      { id: "audit-med-maya-refill", organizationId: bfm.id, actorId: "user-nadja", actorType: "user", action: "refill_request.approve", resourceType: "refill_request", resourceId: "refill-maya-approved", patientId: maya.id, changes: { status: { from: "needs_provider", to: "approved" } }, metadata: { providerId: "provider-nadja", noAutonomousApproval: true }, createdAt: new Date("2026-07-14T12:20:00.000Z") },
      { id: "audit-med-darius-failure", organizationId: bfm.id, actorId: "user-nadja", actorType: "user", action: "prescription.fail", resourceType: "prescription", resourceId: "rx-darius-failed", patientId: "pt-1002", changes: { status: { from: "queued", to: "failed" } }, metadata: { deliveryMethod: "fax", manualFallback: true, failureReason: "Synthetic fax delivery lacked receipt confirmation." }, createdAt: new Date("2026-07-13T13:15:00.000Z") },
      { id: "audit-med-luxe-approval", organizationId: luxe.id, actorId: "user-luxe-owner", actorType: "user", action: "prescription.approve", resourceType: "prescription", resourceId: "rx-luxe-manual", patientId: "pt-1004", changes: { status: { from: "draft", to: "approved" } }, metadata: { providerId: "provider-nadja-luxe", tenantIsolation: true, manualFallback: true }, createdAt: new Date("2026-07-13T15:40:00.000Z") },
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

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { can, clinicActions, clinicResources, clinicRoles, roleLabel } from "../src/lib/auth/rbac";
import { buildDemoRecapDraft, buildSyntheticDemoScenario, demoOffers } from "../src/lib/sales-demo-rules";

const prisma = new PrismaClient();

async function seedSalesRoles(organizationId: string) {
  for (const roleKey of clinicRoles) {
    const role = await prisma.role.upsert({
      where: { organizationId_key: { organizationId, key: roleKey } },
      update: { name: roleLabel(roleKey), description: `Synthetic ${roleLabel(roleKey)} role for the ClinicOS sales demonstration workspace.` },
      create: { id: `role-clinicos-${roleKey}`, organizationId, key: roleKey, name: roleLabel(roleKey), description: `Synthetic ${roleLabel(roleKey)} role for the ClinicOS sales demonstration workspace.` },
    });
    await prisma.permission.deleteMany({ where: { roleId: role.id } });
    await prisma.permission.createMany({
      data: clinicResources.flatMap((resource) => clinicActions
        .filter((action) => can(roleKey, resource, action))
        .map((action) => ({ roleId: role.id, resource, action, allowed: true }))),
    });
  }
}

async function main() {
  const password = process.env.CLINICOS_SEED_ADMIN_PASSWORD;
  if (!password || password.length < 12 || password.includes("replace-with")) {
    throw new Error("CLINICOS_SEED_ADMIN_PASSWORD must be a non-placeholder value with at least 12 characters.");
  }
  const passwordHash = await hash(password, 12);
  const organization = await prisma.organization.upsert({
    where: { slug: "clinicos-by-zumi" },
    update: { name: "ClinicOS by Zumi", clinicType: "Healthcare technology platform", status: "active", demoMode: true },
    create: { id: "org-clinicos-zumi", name: "ClinicOS by Zumi", slug: "clinicos-by-zumi", clinicType: "Healthcare technology platform", status: "active", demoMode: true },
  });
  await prisma.location.upsert({
    where: { id: "loc-clinicos-demo-studio" },
    update: { organizationId: organization.id, name: "Synthetic Demo Studio", status: "active" },
    create: { id: "loc-clinicos-demo-studio", organizationId: organization.id, name: "Synthetic Demo Studio", address: { line1: "Synthetic environment only", city: "New York", state: "NY", postalCode: "10001" } },
  });
  const user = await prisma.user.upsert({
    where: { email: "founder@clinicos.example.test" },
    update: { organizationId: organization.id, name: "ClinicOS Demo Founder", roleKey: "clinic_owner", status: "active" },
    create: { id: "user-clinicos-founder", organizationId: organization.id, email: "founder@clinicos.example.test", name: "ClinicOS Demo Founder", roleKey: "clinic_owner", status: "active" },
  });
  await prisma.authCredential.upsert({
    where: { userId: user.id },
    update: { passwordHash, mustReset: false, failedAttempts: 0, lockedUntil: null },
    create: { userId: user.id, passwordHash },
  });
  await seedSalesRoles(organization.id);
  await prisma.setting.upsert({ where: { organizationId_key: { organizationId: organization.id, key: "platform.sales_admin" } }, update: { value: { enabled: true, syntheticDemo: true, paymentMode: "manual_fallback" } }, create: { organizationId: organization.id, key: "platform.sales_admin", value: { enabled: true, syntheticDemo: true, paymentMode: "manual_fallback" } } });
  await prisma.setting.upsert({ where: { organizationId_key: { organizationId: organization.id, key: "compliance.phi_mode" } }, update: { value: { enabled: false, reason: "Synthetic sales demonstration only. Do not enter patient information." } }, create: { organizationId: organization.id, key: "compliance.phi_mode", value: { enabled: false, reason: "Synthetic sales demonstration only. Do not enter patient information." } } });

  const scenario = buildSyntheticDemoScenario({ clinicType: "Primary care", biggestPainPoint: "referrals", painPoints: ["referrals", "billing_readiness", "staff_accountability"] });
  await prisma.demoScenario.upsert({
    where: { id: "demo-scenario-northstar-referrals" },
    update: { salesOwnerOrganizationId: organization.id, clinicType: scenario.clinicType, primaryPainPoint: scenario.primaryPainPoint, title: scenario.title, summary: scenario.summary, syntheticPatient: scenario.syntheticPatient, syntheticAppointment: scenario.syntheticAppointment, syntheticDocument: scenario.syntheticDocument, syntheticReferral: scenario.syntheticReferral, syntheticTask: scenario.syntheticTask, syntheticResult: scenario.syntheticResult, syntheticBillingItem: scenario.syntheticBillingItem, syntheticOwnerAlert: scenario.syntheticOwnerAlert, syntheticRevenueLeak: scenario.syntheticRevenueLeak, recommendedWorkflow: scenario.recommendedWorkflow, status: "ready" },
    create: { id: "demo-scenario-northstar-referrals", salesOwnerOrganizationId: organization.id, clinicType: scenario.clinicType, primaryPainPoint: scenario.primaryPainPoint, title: scenario.title, summary: scenario.summary, syntheticPatient: scenario.syntheticPatient, syntheticAppointment: scenario.syntheticAppointment, syntheticDocument: scenario.syntheticDocument, syntheticReferral: scenario.syntheticReferral, syntheticTask: scenario.syntheticTask, syntheticResult: scenario.syntheticResult, syntheticBillingItem: scenario.syntheticBillingItem, syntheticOwnerAlert: scenario.syntheticOwnerAlert, syntheticRevenueLeak: scenario.syntheticRevenueLeak, recommendedWorkflow: scenario.recommendedWorkflow, status: "ready" },
  });
  const prospectOrganization = await prisma.organization.findUnique({ where: { slug: "brooklyn-family-medicine" }, select: { id: true } });
  await prisma.demoReservation.upsert({
    where: { id: "demo-reservation-northstar" },
    update: { organizationId: prospectOrganization?.id ?? null, salesOwnerOrganizationId: organization.id, demoScenarioId: "demo-scenario-northstar-referrals" },
    create: { id: "demo-reservation-northstar", organizationId: prospectOrganization?.id ?? null, salesOwnerOrganizationId: organization.id, clinicName: "Northstar Family Practice", contactName: "Jordan Rivera", contactRole: "Practice owner", contactEmail: "nadja@example.test", contactPhone: "(212) 555-0198", clinicType: "Primary care", providerCount: 4, locationCount: 2, biggestPainPoint: "referrals", painPoints: ["referrals", "billing_readiness", "staff_accountability"], currentSystems: { ehr: "Legacy EHR demo", scheduling: "Shared calendar", billing: "External billing company", crm: "Spreadsheet", patientMessaging: "Phone and SMS" }, estimatedSoftwareSpendCents: 240_000, wantsPaidDemo: true, wantsFoundingEvaluation: true, selectedOffer: "private_workflow_demo", priceCents: demoOffers.private_workflow_demo.priceCents, status: "scheduled", paymentStatus: "payment_recorded", scheduledAt: new Date("2026-08-12T18:00:00.000Z"), demoScenarioId: "demo-scenario-northstar-referrals" },
  });
  const recap = buildDemoRecapDraft({ clinicName: "Northstar Family Practice", clinicType: "Primary care", biggestPainPoint: "referrals", painPoints: ["referrals", "billing_readiness", "staff_accountability"], scenarioTitle: scenario.title });
  await prisma.demoRecap.upsert({
    where: { reservationId: "demo-reservation-northstar" },
    update: { salesOwnerOrganizationId: organization.id, painPoint: recap.painPoint, whatWasShown: recap.whatWasShown, workflowGaps: recap.workflowGaps, recommendedNextStep: recap.recommendedNextStep, estimatedValueAreas: recap.estimatedValueAreas, productStatusSnapshot: recap.productStatusSnapshot, priceOption: recap.priceOption, callToAction: recap.callToAction, status: "draft", reviewStatus: "human_review_required", draftedBy: "deterministic_fallback", reviewedBy: null, reviewedAt: null, reviewNotes: null },
    create: { id: "demo-recap-northstar", reservationId: "demo-reservation-northstar", salesOwnerOrganizationId: organization.id, painPoint: recap.painPoint, whatWasShown: recap.whatWasShown, workflowGaps: recap.workflowGaps, recommendedNextStep: recap.recommendedNextStep, estimatedValueAreas: recap.estimatedValueAreas, productStatusSnapshot: recap.productStatusSnapshot, priceOption: recap.priceOption, callToAction: recap.callToAction, status: "draft", reviewStatus: "human_review_required", draftedBy: "deterministic_fallback" },
  });
  for (const event of [
    { id: "demo-sales-event-inquiry", actorType: "public_contact", eventType: "inquiry_received", fromStatus: null, toStatus: "inquiry", note: "Synthetic founding-clinic inquiry received." },
    { id: "demo-sales-event-scheduled", actorType: "user", eventType: "status_changed", fromStatus: "reserved", toStatus: "scheduled", note: "Synthetic private workflow demo scheduled after a reviewed manual payment record." },
    { id: "demo-sales-event-recap", actorType: "system", eventType: "recap_draft_generated", fromStatus: null, toStatus: null, note: "AI-ready deterministic recap draft created. Human review is required." },
  ]) {
    await prisma.demoReservationEvent.upsert({
      where: { id: event.id },
      update: { salesOwnerOrganizationId: organization.id, reservationId: "demo-reservation-northstar", actorId: event.actorType === "user" ? user.id : null, actorType: event.actorType, eventType: event.eventType, fromStatus: event.fromStatus, toStatus: event.toStatus, note: event.note },
      create: { ...event, salesOwnerOrganizationId: organization.id, reservationId: "demo-reservation-northstar", actorId: event.actorType === "user" ? user.id : null },
    });
  }
  await prisma.auditLog.create({ data: { organizationId: organization.id, actorId: user.id, actorType: "system", action: "sales.synthetic_workspace_seeded", resourceType: "sales_workspace", resourceId: organization.id, metadata: { destructive: false, syntheticOnly: true } } });
  console.log("Seeded the non-destructive ClinicOS synthetic sales workspace and founding-clinic demo pipeline.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());

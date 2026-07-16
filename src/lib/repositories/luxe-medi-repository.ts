import "server-only";

import { RiskLevel } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { luxeTreatmentPlanTransitionSchema, luxeTreatmentSessionTransitionSchema, createLuxePromotionSchema, luxeWorkspaceActionSchema } from "@/lib/luxe-medi-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

function requireRead(session: Pick<ClinicSession, "role">) {
  if (!can(session.role, "luxe_medi", "read")) throw new NetworkAccessError("Luxe Medi access is not permitted for this role.", 403);
}

function requireWrite(session: Pick<ClinicSession, "role">) {
  if (!can(session.role, "luxe_medi", "update")) throw new NetworkAccessError("Luxe Medi workflow changes are not permitted for this role.", 403);
}

function name(patient: { firstName: string; lastName: string } | undefined) {
  return patient ? `${patient.firstName} ${patient.lastName}` : "Unknown client";
}

async function serviceFor(organizationId: string, serviceId: string) {
  const service = await db.luxeService.findFirst({ where: { id: serviceId, organizationId, status: "active" } });
  if (!service) throw new NetworkAccessError("Luxe service not found for this organization.", 404);
  return service;
}

async function patientFor(organizationId: string, patientId: string) {
  const patient = await db.patient.findFirst({ where: { id: patientId, organizationId, status: "active" }, select: { id: true, firstName: true, lastName: true, mrn: true, phone: true, email: true } });
  if (!patient) throw new NetworkAccessError("Client is not active in this organization.", 404);
  return patient;
}

export async function listLuxeMediWorkspace(session: Pick<ClinicSession, "organizationId" | "role">) {
  requireRead(session);
  const [services, patients, providers, leads, plans, sessions, promotions, membershipPlans, packagePlans, memberships, purchases, formTemplates, mediaCategories, inventory] = await Promise.all([
    db.luxeService.findMany({ where: { organizationId: session.organizationId }, orderBy: [{ status: "asc" }, { category: "asc" }, { name: "asc" }] }),
    db.patient.findMany({ where: { organizationId: session.organizationId, status: "active" }, select: { id: true, firstName: true, lastName: true, mrn: true, phone: true, email: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] }),
    db.provider.findMany({ where: { organizationId: session.organizationId, status: "active" }, select: { id: true, name: true, credential: true, specialty: true, services: true } }),
    db.lead.findMany({ where: { organizationId: session.organizationId, source: { in: ["luxe_website", "social", "phone", "referral"] } }, orderBy: { updatedAt: "desc" }, take: 50 }),
    db.luxeTreatmentPlan.findMany({ where: { organizationId: session.organizationId }, orderBy: { updatedAt: "desc" }, take: 50 }),
    db.luxeTreatmentSession.findMany({ where: { organizationId: session.organizationId }, orderBy: [{ status: "asc" }, { scheduledAt: "asc" }], take: 75 }),
    db.luxePromotion.findMany({ where: { organizationId: session.organizationId }, orderBy: { updatedAt: "desc" }, take: 50 }),
    db.membershipPlan.findMany({ where: { organizationId: session.organizationId }, orderBy: { createdAt: "asc" } }),
    db.packagePlan.findMany({ where: { organizationId: session.organizationId }, orderBy: { createdAt: "asc" } }),
    db.patientMembership.findMany({ where: { organizationId: session.organizationId, status: "active" }, orderBy: { updatedAt: "desc" }, take: 50 }),
    db.packagePurchase.findMany({ where: { organizationId: session.organizationId, status: "active" }, orderBy: { updatedAt: "desc" }, take: 50 }),
    db.formTemplate.findMany({ where: { organizationId: session.organizationId, category: { in: ["medical_spa", "consent"] } }, select: { id: true, name: true, templateKey: true, category: true, status: true, requiresProviderSignature: true } }),
    db.documentCategory.findMany({ where: { organizationId: session.organizationId, code: { in: ["before_after_media", "treatment_consent", "aftercare"] } }, select: { id: true, code: true, name: true } }),
    db.inventoryItem.findMany({ where: { organizationId: session.organizationId }, select: { id: true, name: true, category: true, quantityOnHand: true, quantityReserved: true, reorderPoint: true, status: true, expiresAt: true }, orderBy: { name: "asc" }, take: 50 }),
  ]);
  const patientMap = new Map(patients.map((patient) => [patient.id, patient]));
  const providerMap = new Map(providers.map((provider) => [provider.id, provider]));
  const serviceMap = new Map(services.map((service) => [service.id, service]));
  const beforeAfterCategoryIds = new Set(mediaCategories.filter((category) => category.code === "before_after_media").map((category) => category.id));
  const media = beforeAfterCategoryIds.size ? await db.document.findMany({ where: { organizationId: session.organizationId, categoryId: { in: [...beforeAfterCategoryIds] }, status: "active" }, select: { id: true, patientId: true, name: true, reviewStatus: true, releaseStatus: true, patientVisible: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 50 }) : [];
  return {
    services: services.map((service) => ({ ...service, price: service.priceCents / 100, createdAt: service.createdAt.toISOString(), updatedAt: service.updatedAt.toISOString() })),
    patients,
    providers,
    consultations: leads.map((lead) => ({ id: lead.id, name: lead.name, serviceInterest: lead.serviceInterest, source: lead.source, status: lead.status, estimatedValue: lead.estimatedValueCents / 100, patientName: lead.patientId ? name(patientMap.get(lead.patientId)) : null, followUpDueAt: lead.followUpDueAt?.toISOString() ?? null, updatedAt: lead.updatedAt.toISOString() })),
    treatmentPlans: plans.map((plan) => ({ ...plan, patientName: name(patientMap.get(plan.patientId)), serviceName: serviceMap.get(plan.serviceId)?.name ?? "Unknown service", providerName: plan.providerId ? providerMap.get(plan.providerId)?.name ?? "Assigned provider" : "Unassigned", createdAt: plan.createdAt.toISOString(), updatedAt: plan.updatedAt.toISOString(), reviewedAt: plan.reviewedAt?.toISOString() ?? null })),
    sessions: sessions.map((item) => ({ ...item, patientName: name(patientMap.get(item.patientId)), serviceName: serviceMap.get(item.serviceId)?.name ?? "Unknown service", providerName: item.providerId ? providerMap.get(item.providerId)?.name ?? "Assigned provider" : "Unassigned", scheduledAt: item.scheduledAt?.toISOString() ?? null, completedAt: item.completedAt?.toISOString() ?? null })),
    promotions: promotions.map((promotion) => ({ ...promotion, serviceName: promotion.serviceId ? serviceMap.get(promotion.serviceId)?.name ?? "All services" : "All services", startsAt: promotion.startsAt?.toISOString() ?? null, endsAt: promotion.endsAt?.toISOString() ?? null })),
    memberships: memberships.map((membership) => ({ ...membership, patientName: name(patientMap.get(membership.patientId)), planName: membershipPlanName(membership.planId, membershipPlans), startedAt: membership.startedAt.toISOString(), renewsAt: membership.renewsAt?.toISOString() ?? null, expiresAt: membership.expiresAt?.toISOString() ?? null })),
    membershipPlans: membershipPlans.map((plan) => ({ ...plan, price: plan.priceCents / 100 })),
    packagePlans: packagePlans.map((plan) => ({ ...plan, price: plan.priceCents / 100 })),
    packagePurchases: purchases.map((purchase) => ({ ...purchase, patientName: name(patientMap.get(purchase.patientId)), packageName: packagePlanName(purchase.packagePlanId, packagePlans), purchasedAt: purchase.purchasedAt.toISOString(), expiresAt: purchase.expiresAt?.toISOString() ?? null })),
    forms: formTemplates,
    media: media.map((document) => ({ ...document, patientName: document.patientId ? name(patientMap.get(document.patientId)) : "Unlinked", createdAt: document.createdAt.toISOString() })),
    inventory: inventory.map((item) => ({ ...item, quantityOnHand: Number(item.quantityOnHand), quantityReserved: Number(item.quantityReserved), reorderPoint: item.reorderPoint == null ? null : Number(item.reorderPoint), expiresAt: item.expiresAt?.toISOString() ?? null })),
    adapterStatus: { payments: "manual_fallback", inventory: "connected_internal", consent: "governed_forms", beforeAfterMedia: "governed_documents", mobileCare: "manual_workflow" },
  };
}

function membershipPlanName(id: string, plans: { id: string; name: string }[]) { return plans.find((plan) => plan.id === id)?.name ?? "Unknown membership"; }
function packagePlanName(id: string, plans: { id: string; name: string }[]) { return plans.find((plan) => plan.id === id)?.name ?? "Unknown package"; }

export type LuxeMediWorkspace = Awaited<ReturnType<typeof listLuxeMediWorkspace>>;

export async function createLuxeWorkspaceAction(session: ClinicSession, rawInput: unknown) {
  requireWrite(session);
  const input = luxeWorkspaceActionSchema.parse(rawInput);
  if (input.kind === "consultation") {
    const service = await serviceFor(session.organizationId, input.serviceId);
    const patient = input.patientId ? await patientFor(session.organizationId, input.patientId) : null;
    const lead = await db.$transaction(async (tx) => {
      const created = await tx.lead.create({ data: { organizationId: session.organizationId, patientId: patient?.id, name: input.name, email: input.email || null, phone: input.phone || null, source: "luxe_website", campaignSource: "luxe_service_catalog", serviceInterest: service.name, appointmentInterest: "Consultation request", estimatedValueCents: service.priceCents, pipelineStage: "new", status: "new", followUpDueAt: new Date(), notes: input.notes ?? null, consentStatus: "not_recorded" } });
      const task = await tx.task.create({ data: { organizationId: session.organizationId, patientId: patient?.id, category: "luxe_consultation", title: `Review ${service.name} consultation request`, details: `lead:${created.id} Manual front-desk follow-up is required; no appointment or treatment eligibility is confirmed.`, priority: "high", riskLevel: RiskLevel.NEEDS_STAFF, dueAt: new Date(), status: "open", createdBy: session.userId } });
      await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "luxe.consultation_created", resourceType: "lead", resourceId: created.id, patientId: patient?.id, metadata: { serviceId: service.id, serviceName: service.name, taskId: task.id, humanReviewRequired: true, noAppointmentConfirmation: true } } });
      return created;
    });
    return { kind: input.kind, id: lead.id };
  }
  if (input.kind === "treatment_plan") {
    const [service, patient] = await Promise.all([serviceFor(session.organizationId, input.serviceId), patientFor(session.organizationId, input.patientId)]);
    if (input.providerId) {
      const provider = await db.provider.findFirst({ where: { id: input.providerId, organizationId: session.organizationId, status: "active" } });
      if (!provider) throw new NetworkAccessError("Provider is not active in this organization.", 404);
    }
    return db.$transaction(async (tx) => {
      const plan = await tx.luxeTreatmentPlan.create({ data: { organizationId: session.organizationId, patientId: patient.id, serviceId: service.id, providerId: input.providerId ?? null, name: input.name, goals: input.goals, recommendedSessions: input.recommendedSessions, status: "draft", reviewStatus: "needs_provider_review", createdBy: session.userId } });
      const task = await tx.task.create({ data: { organizationId: session.organizationId, patientId: patient.id, category: "luxe_treatment_review", title: `Provider review: ${service.name} treatment plan`, details: `treatment_plan:${plan.id} Review eligibility, goals, consent, and plan before activation.`, priority: "high", riskLevel: RiskLevel.NEEDS_PROVIDER, dueAt: new Date(), status: "open", createdBy: session.userId } });
      await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "luxe.treatment_plan_created", resourceType: "luxe_treatment_plan", resourceId: plan.id, patientId: patient.id, metadata: { serviceId: service.id, taskId: task.id, providerReviewRequired: true, noEligibilityDecision: true } } });
      return plan;
    });
  }
  if (input.kind === "treatment_session") {
    const [service, patient] = await Promise.all([serviceFor(session.organizationId, input.serviceId), patientFor(session.organizationId, input.patientId)]);
    if (input.providerId) {
      const provider = await db.provider.findFirst({ where: { id: input.providerId, organizationId: session.organizationId, status: "active" } });
      if (!provider) throw new NetworkAccessError("Provider is not active in this organization.", 404);
    }
    if (input.treatmentPlanId) {
      const plan = await db.luxeTreatmentPlan.findFirst({ where: { id: input.treatmentPlanId, organizationId: session.organizationId, patientId: patient.id, serviceId: service.id } });
      if (!plan) throw new NetworkAccessError("Treatment plan is not linked to this patient and service.", 404);
    }
    const sessionRecord = await db.luxeTreatmentSession.create({ data: { organizationId: session.organizationId, patientId: patient.id, serviceId: service.id, treatmentPlanId: input.treatmentPlanId ?? null, appointmentId: input.appointmentId ?? null, providerId: input.providerId ?? null, sessionNumber: input.sessionNumber, status: "scheduled", scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null, notes: input.notes ?? null, createdBy: session.userId } });
    await db.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "luxe.treatment_session_created", resourceType: "luxe_treatment_session", resourceId: sessionRecord.id, patientId: patient.id, metadata: { serviceId: service.id, treatmentPlanId: input.treatmentPlanId, manualSchedulingFallback: true } } });
    return sessionRecord;
  }
  if (!can(session.role, "luxe_medi", "manage")) throw new NetworkAccessError("Promotion management is restricted to clinic administrators.", 403);
  const promotionInput = createLuxePromotionSchema.parse(rawInput);
  if (promotionInput.serviceId) await serviceFor(session.organizationId, promotionInput.serviceId);
  const promotion = await db.luxePromotion.create({ data: { organizationId: session.organizationId, serviceId: promotionInput.serviceId ?? null, name: promotionInput.name, code: promotionInput.code || null, description: promotionInput.description || null, discountCents: promotionInput.discountCents ?? null, discountPercent: promotionInput.discountPercent ?? null, startsAt: promotionInput.startsAt ? new Date(promotionInput.startsAt) : null, endsAt: promotionInput.endsAt ? new Date(promotionInput.endsAt) : null, status: "draft", createdBy: session.userId } });
  await db.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "luxe.promotion_created", resourceType: "luxe_promotion", resourceId: promotion.id, metadata: { serviceId: promotionInput.serviceId, status: "draft", humanActivationRequired: true } } });
  return promotion;
}

export async function transitionLuxeTreatmentPlan(session: ClinicSession, planId: string, rawInput: unknown) {
  requireWrite(session);
  const input = luxeTreatmentPlanTransitionSchema.parse(rawInput);
  const plan = await db.luxeTreatmentPlan.findFirst({ where: { id: planId, organizationId: session.organizationId } });
  if (!plan) throw new NetworkAccessError("Treatment plan not found for this organization.", 404);
  if (["approve_review", "reject_review"].includes(input.action)) {
    const provider = await db.provider.findFirst({ where: { organizationId: session.organizationId, userId: session.userId, status: "active" }, select: { id: true } });
    if (!provider) throw new NetworkAccessError("An active provider identity is required for treatment-plan eligibility review.", 403);
  }
  const next = input.action === "approve_review" ? { reviewStatus: "approved", reviewedBy: session.userId, reviewedAt: new Date(), reviewNotes: input.note } : input.action === "reject_review" ? { reviewStatus: "needs_provider_review", reviewedBy: session.userId, reviewedAt: new Date(), reviewNotes: input.note, status: "draft" } : input.action === "activate" ? { status: "active" } : input.action === "complete" ? { status: "completed" } : { status: "cancelled" };
  if (input.action === "activate" && plan.reviewStatus !== "approved") throw new NetworkAccessError("A provider must approve the treatment plan before activation.", 409);
  return db.$transaction(async (tx) => {
    const updated = await tx.luxeTreatmentPlan.update({ where: { id: plan.id }, data: next });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `luxe.treatment_plan.${input.action}`, resourceType: "luxe_treatment_plan", resourceId: plan.id, patientId: plan.patientId, changes: { status: { from: plan.status, to: updated.status }, reviewStatus: { from: plan.reviewStatus, to: updated.reviewStatus } }, metadata: { note: input.note, providerReview: ["approve_review", "reject_review"].includes(input.action), noEligibilityAutomation: true } } });
    return updated;
  });
}

export async function transitionLuxeTreatmentSession(session: ClinicSession, sessionId: string, rawInput: unknown) {
  requireWrite(session);
  const input = luxeTreatmentSessionTransitionSchema.parse(rawInput);
  const current = await db.luxeTreatmentSession.findFirst({ where: { id: sessionId, organizationId: session.organizationId } });
  if (!current) throw new NetworkAccessError("Treatment session not found for this organization.", 404);
  if (input.action === "complete" && !input.note.toLowerCase().includes("review")) throw new NetworkAccessError("Completion notes must identify the human review or source documentation used.", 400);
  const updated = await db.luxeTreatmentSession.update({ where: { id: current.id }, data: input.action === "complete" ? { status: "completed", completedAt: new Date(), notes: input.note } : input.action === "cancel" ? { status: "cancelled", notes: input.note } : { status: "rescheduled", scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null, notes: input.note } });
  await db.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `luxe.treatment_session.${input.action}`, resourceType: "luxe_treatment_session", resourceId: current.id, patientId: current.patientId, changes: { status: { from: current.status, to: updated.status } }, metadata: { note: input.note, manualWorkflow: true } } });
  return updated;
}

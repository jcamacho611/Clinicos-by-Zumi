import "server-only";

import type { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import {
  buildDemoRecapDraft,
  buildSyntheticDemoScenario,
  canTransitionDemoReservation,
  demoOffers,
  painPointSchema,
  reviewDemoRecapSchema,
  salesIntakeSchema,
  transitionDemoReservationSchema,
  type SalesPainPoint,
} from "@/lib/sales-demo-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

interface PublicRequestMetadata {
  ipAddress?: string;
  userAgent?: string;
}

const SALES_OWNER_SLUG = process.env.CLINICOS_SALES_ORGANIZATION_SLUG?.trim() || "clinicos-by-zumi";

function parsePainPoints(value: Prisma.JsonValue): SalesPainPoint[] {
  const parsed = painPointSchema.array().safeParse(value);
  return parsed.success ? parsed.data : ["owner_visibility"];
}

async function requireSalesOwnerOrganization() {
  const organization = await db.organization.findFirst({
    where: { slug: SALES_OWNER_SLUG, status: "active", demoMode: true },
    select: { id: true, name: true, slug: true },
  });
  if (!organization) {
    throw new NetworkAccessError("Private demo reservations are temporarily unavailable while the synthetic sales workspace is prepared.", 503);
  }
  return organization;
}

function reservationView<T extends {
  id: string;
  clinicName: string;
  contactName: string;
  contactRole: string;
  contactEmail: string;
  contactPhone: string;
  clinicType: string;
  providerCount: number;
  locationCount: number;
  biggestPainPoint: string;
  painPoints: Prisma.JsonValue;
  currentSystems: Prisma.JsonValue;
  estimatedSoftwareSpendCents: number | null;
  selectedOffer: string;
  priceCents: number;
  status: string;
  paymentStatus: string;
  scheduledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string | null;
  demoScenarioId: string | null;
}>(reservation: T) {
  return {
    ...reservation,
    scheduledAt: reservation.scheduledAt?.toISOString() ?? null,
    createdAt: reservation.createdAt.toISOString(),
    updatedAt: reservation.updatedAt.toISOString(),
  };
}

export async function createPublicDemoReservation(rawInput: unknown, metadata: PublicRequestMetadata) {
  const input = salesIntakeSchema.parse(rawInput);
  const salesOwner = await requireSalesOwnerOrganization();
  const offer = demoOffers[input.selectedOffer];
  const scenario = buildSyntheticDemoScenario(input);
  const normalizedEmail = input.contactEmail.toLowerCase();

  return db.$transaction(async (tx) => {
    const scenarioRecord = await tx.demoScenario.create({
      data: {
        salesOwnerOrganizationId: salesOwner.id,
        clinicType: scenario.clinicType,
        primaryPainPoint: scenario.primaryPainPoint,
        title: scenario.title,
        summary: scenario.summary,
        syntheticPatient: scenario.syntheticPatient,
        syntheticAppointment: scenario.syntheticAppointment,
        syntheticDocument: scenario.syntheticDocument,
        syntheticReferral: scenario.syntheticReferral,
        syntheticTask: scenario.syntheticTask,
        syntheticResult: scenario.syntheticResult,
        syntheticBillingItem: scenario.syntheticBillingItem,
        syntheticOwnerAlert: scenario.syntheticOwnerAlert,
        syntheticRevenueLeak: scenario.syntheticRevenueLeak,
        recommendedWorkflow: scenario.recommendedWorkflow,
        status: scenario.status,
      },
    });
    const reservation = await tx.demoReservation.create({
      data: {
        salesOwnerOrganizationId: salesOwner.id,
        clinicName: input.clinicName,
        contactName: input.contactName,
        contactRole: input.contactRole,
        contactEmail: normalizedEmail,
        contactPhone: input.contactPhone,
        clinicType: input.clinicType,
        providerCount: input.providerCount,
        locationCount: input.locationCount,
        biggestPainPoint: input.biggestPainPoint,
        painPoints: input.painPoints,
        currentSystems: input.currentSystems,
        estimatedSoftwareSpendCents: input.estimatedSoftwareSpendDollars === null ? null : input.estimatedSoftwareSpendDollars * 100,
        wantsFreeIntro: input.wantsFreeIntro,
        wantsPaidDemo: input.wantsPaidDemo,
        wantsFoundingEvaluation: input.wantsFoundingEvaluation,
        wantsFoundingProgram: input.wantsFoundingProgram,
        selectedOffer: input.selectedOffer,
        priceCents: offer.priceCents,
        status: "inquiry",
        paymentStatus: "not_started",
        demoScenarioId: scenarioRecord.id,
      },
    });
    await tx.demoReservationEvent.createMany({
      data: [
        {
          salesOwnerOrganizationId: salesOwner.id,
          reservationId: reservation.id,
          actorType: "public_contact",
          eventType: "inquiry_received",
          toStatus: "inquiry",
          note: "Clinic submitted the public workflow-demo intake.",
          metadata: { offer: input.selectedOffer, syntheticDataAcknowledged: true },
        },
        {
          salesOwnerOrganizationId: salesOwner.id,
          reservationId: reservation.id,
          actorType: "system",
          eventType: "synthetic_scenario_generated",
          note: "Deterministic synthetic scenario generated from clinic type and selected pain points.",
          metadata: { demoScenarioId: scenarioRecord.id, humanReviewRequired: true },
        },
      ],
    });
    await tx.auditLog.create({
      data: {
        organizationId: salesOwner.id,
        actorType: "public_contact",
        action: "sales.demo_inquiry_created",
        resourceType: "demo_reservation",
        resourceId: reservation.id,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        metadata: { offer: input.selectedOffer, priceCents: offer.priceCents, mode: "synthetic_demo_only" },
      },
    });
    return {
      reservation: reservationView(reservation),
      scenario: scenarioRecord,
      offer: { ...offer, paymentStatus: "Pending connection", paymentNextStep: "A human will qualify the request and send a manual payment link." },
    };
  });
}

export async function listSalesDemoWorkspace(session: ClinicSession) {
  if (!can(session.role, "sales", "read")) throw new NetworkAccessError("Sales workspace access is not permitted for this role.", 403);
  const reservations = await db.demoReservation.findMany({
    where: { salesOwnerOrganizationId: session.organizationId },
    include: {
      demoScenario: true,
      recap: true,
      events: { orderBy: { createdAt: "desc" }, take: 12 },
      organization: { select: { id: true, name: true, slug: true } },
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 250,
  });
  await db.auditLog.create({
    data: {
      organizationId: session.organizationId,
      actorId: session.userId,
      actorType: "user",
      action: "sales.workspace_accessed",
      resourceType: "sales_workspace",
      resourceId: session.organizationId,
      metadata: { reservationCount: reservations.length },
    },
  });
  return {
    reservations: reservations.map((reservation) => ({
      ...reservationView(reservation),
      demoScenario: reservation.demoScenario,
      recap: reservation.recap,
      events: reservation.events.map((event) => ({ ...event, createdAt: event.createdAt.toISOString() })),
    })),
    metrics: {
      inquiries: reservations.filter((item) => item.status === "inquiry").length,
      paidDemoPipeline: reservations.filter((item) => ["payment_pending", "reserved", "scheduled"].includes(item.status)).length,
      completed: reservations.filter((item) => item.status === "completed").length,
      evaluations: reservations.filter((item) => item.status === "moved_to_evaluation").length,
      founding: reservations.filter((item) => item.status === "moved_to_founding").length,
      pipelineCents: reservations.filter((item) => !["closed_lost", "no_show"].includes(item.status)).reduce((sum, item) => sum + item.priceCents, 0),
    },
  };
}

export type SalesDemoWorkspace = Awaited<ReturnType<typeof listSalesDemoWorkspace>>;

export async function listFoundingProgramForOwner(session: ClinicSession) {
  if (!can(session.role, "sales", "read")) throw new NetworkAccessError("Founding program access is not permitted for this role.", 403);
  const reservations = await db.demoReservation.findMany({
    where: {
      OR: [
        { organizationId: session.organizationId },
        { contactEmail: session.email.toLowerCase() },
      ],
    },
    include: { demoScenario: true, recap: true, events: { orderBy: { createdAt: "desc" }, take: 20 } },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });
  await db.auditLog.create({
    data: {
      organizationId: session.organizationId,
      actorId: session.userId,
      actorType: "user",
      action: "sales.founding_program_accessed",
      resourceType: "founding_program",
      resourceId: session.organizationId,
      metadata: { matchingReservationCount: reservations.length },
    },
  });
  return reservations.map((reservation) => ({
    ...reservationView(reservation),
    demoScenario: reservation.demoScenario,
    recap: reservation.recap,
    events: reservation.events.map((event) => ({ ...event, createdAt: event.createdAt.toISOString() })),
  }));
}

async function findManagedReservation(session: ClinicSession, reservationId: string) {
  const reservation = await db.demoReservation.findFirst({
    where: { id: reservationId, salesOwnerOrganizationId: session.organizationId },
    include: { demoScenario: true, recap: true },
  });
  if (!reservation) throw new NetworkAccessError("Demo reservation not found for this organization.", 404);
  return reservation;
}

export async function transitionDemoReservation(session: ClinicSession, reservationId: string, rawInput: unknown) {
  if (!can(session.role, "sales", "update")) throw new NetworkAccessError("Demo reservation updates are not permitted for this role.", 403);
  const input = transitionDemoReservationSchema.parse(rawInput);
  const reservation = await findManagedReservation(session, reservationId);
  if (!canTransitionDemoReservation(reservation.status, input.status)) {
    throw new NetworkAccessError(`Reservation cannot move from ${reservation.status} to ${input.status}.`, 409);
  }
  const nextPaymentStatus = input.paymentStatus ?? reservation.paymentStatus;
  if (input.status === "reserved" && !["payment_recorded", "waived"].includes(nextPaymentStatus)) {
    throw new NetworkAccessError("Record a reviewed manual payment or waiver before reserving the private demo.", 409);
  }
  if (input.status === "scheduled" && !input.scheduledAt && !reservation.scheduledAt) {
    throw new NetworkAccessError("A scheduled date is required before this demo can be marked scheduled.", 409);
  }
  const offerKey = input.status === "moved_to_evaluation"
    ? "founding_clinic_evaluation"
    : input.status === "moved_to_founding"
      ? "founding_clinic_program"
      : reservation.selectedOffer;
  const offer = demoOffers[offerKey as keyof typeof demoOffers] ?? demoOffers.private_workflow_demo;
  return db.$transaction(async (tx) => {
    const updated = await tx.demoReservation.update({
      where: { id: reservation.id },
      data: {
        status: input.status,
        paymentStatus: ["moved_to_evaluation", "moved_to_founding"].includes(input.status) ? "credited_forward" : nextPaymentStatus,
        scheduledAt: input.scheduledAt === undefined ? reservation.scheduledAt : input.scheduledAt ? new Date(input.scheduledAt) : null,
        selectedOffer: offerKey,
        priceCents: offer.priceCents,
      },
    });
    await tx.demoReservationEvent.create({
      data: {
        salesOwnerOrganizationId: session.organizationId,
        reservationId: reservation.id,
        actorId: session.userId,
        actorType: "user",
        eventType: "status_changed",
        fromStatus: reservation.status,
        toStatus: updated.status,
        note: input.note,
        metadata: { paymentStatus: updated.paymentStatus, selectedOffer: updated.selectedOffer, scheduledAt: updated.scheduledAt },
      },
    });
    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: "sales.demo_reservation_transitioned",
        resourceType: "demo_reservation",
        resourceId: reservation.id,
        changes: { status: { from: reservation.status, to: updated.status }, paymentStatus: { from: reservation.paymentStatus, to: updated.paymentStatus } },
        metadata: { note: input.note, scheduledAt: updated.scheduledAt, selectedOffer: updated.selectedOffer },
      },
    });
    return reservationView(updated);
  });
}

export async function generateDemoScenario(session: ClinicSession, reservationId: string) {
  if (!can(session.role, "sales", "update")) throw new NetworkAccessError("Demo scenario generation is not permitted for this role.", 403);
  const reservation = await findManagedReservation(session, reservationId);
  const painPoints = parsePainPoints(reservation.painPoints);
  const primary = painPointSchema.safeParse(reservation.biggestPainPoint).data ?? painPoints[0] ?? "owner_visibility";
  const generated = buildSyntheticDemoScenario({ clinicType: reservation.clinicType, biggestPainPoint: primary, painPoints });
  return db.$transaction(async (tx) => {
    const scenario = reservation.demoScenarioId
      ? await tx.demoScenario.update({
        where: { id: reservation.demoScenarioId },
        data: { clinicType: generated.clinicType, primaryPainPoint: generated.primaryPainPoint, title: generated.title, summary: generated.summary, syntheticPatient: generated.syntheticPatient, syntheticAppointment: generated.syntheticAppointment, syntheticDocument: generated.syntheticDocument, syntheticReferral: generated.syntheticReferral, syntheticTask: generated.syntheticTask, syntheticResult: generated.syntheticResult, syntheticBillingItem: generated.syntheticBillingItem, syntheticOwnerAlert: generated.syntheticOwnerAlert, syntheticRevenueLeak: generated.syntheticRevenueLeak, recommendedWorkflow: generated.recommendedWorkflow, status: generated.status },
      })
      : await tx.demoScenario.create({
        data: { salesOwnerOrganizationId: session.organizationId, clinicType: generated.clinicType, primaryPainPoint: generated.primaryPainPoint, title: generated.title, summary: generated.summary, syntheticPatient: generated.syntheticPatient, syntheticAppointment: generated.syntheticAppointment, syntheticDocument: generated.syntheticDocument, syntheticReferral: generated.syntheticReferral, syntheticTask: generated.syntheticTask, syntheticResult: generated.syntheticResult, syntheticBillingItem: generated.syntheticBillingItem, syntheticOwnerAlert: generated.syntheticOwnerAlert, syntheticRevenueLeak: generated.syntheticRevenueLeak, recommendedWorkflow: generated.recommendedWorkflow, status: generated.status },
      });
    if (!reservation.demoScenarioId) await tx.demoReservation.update({ where: { id: reservation.id }, data: { demoScenarioId: scenario.id } });
    await tx.demoReservationEvent.create({ data: { salesOwnerOrganizationId: session.organizationId, reservationId: reservation.id, actorId: session.userId, actorType: "user", eventType: "synthetic_scenario_regenerated", note: "Synthetic scenario regenerated for human review.", metadata: { demoScenarioId: scenario.id } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "sales.demo_scenario_generated", resourceType: "demo_scenario", resourceId: scenario.id, metadata: { reservationId: reservation.id, synthetic: true } } });
    return scenario;
  });
}

export async function generateDemoRecap(session: ClinicSession, reservationId: string) {
  if (!can(session.role, "sales", "update")) throw new NetworkAccessError("Demo recap generation is not permitted for this role.", 403);
  const reservation = await findManagedReservation(session, reservationId);
  if (!reservation.demoScenario) throw new NetworkAccessError("Generate the synthetic demo scenario before preparing its recap.", 409);
  const painPoints = parsePainPoints(reservation.painPoints);
  const primary = painPointSchema.safeParse(reservation.biggestPainPoint).data ?? painPoints[0] ?? "owner_visibility";
  const draft = buildDemoRecapDraft({ clinicName: reservation.clinicName, clinicType: reservation.clinicType, biggestPainPoint: primary, painPoints, scenarioTitle: reservation.demoScenario.title });
  return db.$transaction(async (tx) => {
    const recap = await tx.demoRecap.upsert({
      where: { reservationId: reservation.id },
      update: { painPoint: draft.painPoint, whatWasShown: draft.whatWasShown, workflowGaps: draft.workflowGaps, recommendedNextStep: draft.recommendedNextStep, estimatedValueAreas: draft.estimatedValueAreas, productStatusSnapshot: draft.productStatusSnapshot, priceOption: draft.priceOption, callToAction: draft.callToAction, status: "draft", reviewStatus: "human_review_required", draftedBy: draft.draftedBy, reviewedBy: null, reviewedAt: null, reviewNotes: null },
      create: { reservationId: reservation.id, salesOwnerOrganizationId: session.organizationId, painPoint: draft.painPoint, whatWasShown: draft.whatWasShown, workflowGaps: draft.workflowGaps, recommendedNextStep: draft.recommendedNextStep, estimatedValueAreas: draft.estimatedValueAreas, productStatusSnapshot: draft.productStatusSnapshot, priceOption: draft.priceOption, callToAction: draft.callToAction, status: draft.status, reviewStatus: draft.reviewStatus, draftedBy: draft.draftedBy },
    });
    await tx.demoReservationEvent.create({ data: { salesOwnerOrganizationId: session.organizationId, reservationId: reservation.id, actorId: session.userId, actorType: "user", eventType: "recap_draft_generated", note: "AI-ready deterministic recap draft created. Human review is required.", metadata: { recapId: recap.id, draftedBy: recap.draftedBy } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "sales.demo_recap_drafted", resourceType: "demo_recap", resourceId: recap.id, metadata: { reservationId: reservation.id, reviewStatus: recap.reviewStatus } } });
    return recap;
  });
}

export async function reviewDemoRecap(session: ClinicSession, reservationId: string, rawInput: unknown) {
  if (!can(session.role, "sales", "manage")) throw new NetworkAccessError("Demo recap approval is not permitted for this role.", 403);
  const input = reviewDemoRecapSchema.parse(rawInput);
  const reservation = await findManagedReservation(session, reservationId);
  if (!reservation.recap) throw new NetworkAccessError("Demo recap draft not found for this organization.", 404);
  return db.$transaction(async (tx) => {
    const recap = await tx.demoRecap.update({
      where: { id: reservation.recap!.id },
      data: { status: input.decision === "approve" ? "approved" : "draft", reviewStatus: input.decision === "approve" ? "approved" : "rejected", reviewedBy: session.userId, reviewedAt: new Date(), reviewNotes: input.notes },
    });
    const decisionEvent = input.decision === "approve" ? "approved" : "rejected";
    await tx.demoReservationEvent.create({ data: { salesOwnerOrganizationId: session.organizationId, reservationId: reservation.id, actorId: session.userId, actorType: "user", eventType: `recap_${decisionEvent}`, note: input.notes, metadata: { recapId: recap.id, reviewStatus: recap.reviewStatus } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `sales.demo_recap_${decisionEvent}`, resourceType: "demo_recap", resourceId: recap.id, metadata: { reservationId: reservation.id, notes: input.notes } } });
    return recap;
  });
}

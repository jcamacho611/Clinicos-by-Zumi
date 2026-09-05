import "server-only";

import { Prisma } from "@prisma/client";
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
  type DemoOfferKey,
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
    throw new NetworkAccessError("Commercial discovery is temporarily unavailable while the synthetic sales workspace is prepared.", 503);
  }
  return organization;
}

function reservationView<T extends {
  id: string;
  clinicName: string;
  contactName: string;
  contactRole: string | null;
  contactEmail: string;
  contactPhone: string | null;
  clinicType: string;
  providerCount: number | null;
  locationCount: number | null;
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
  const requestedOffer = demoOffers[input.selectedOffer];
  const scenario = buildSyntheticDemoScenario({ ...input, painPoints: input.painPoints ?? [input.biggestPainPoint] });
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
        painPoints: input.painPoints ?? Prisma.DbNull,
        currentSystems: input.currentSystems ?? Prisma.DbNull,
        estimatedSoftwareSpendCents: input.estimatedSoftwareSpendDollars === null ? null : input.estimatedSoftwareSpendDollars * 100,
        // Persistence bridge: these legacy database columns now store commercial-fabric
        // preferences. New application semantics live in the input names below.
        wantsFreeIntro: input.wantsFirstValue,
        wantsPaidDemo: input.wantsProof,
        wantsFoundingEvaluation: input.wantsDeepOperatingAudit,
        wantsFoundingProgram: input.wantsDeployment,
        selectedOffer: input.selectedOffer,
        priceCents: requestedOffer.priceCents,
        status: "inquiry",
        paymentStatus: "not_requested",
        demoScenarioId: scenarioRecord.id,
      },
    });

    await tx.demoReservationEvent.createMany({
      data: [
        {
          salesOwnerOrganizationId: salesOwner.id,
          reservationId: reservation.id,
          actorType: "public_contact",
          eventType: "commercial_intent_received",
          toStatus: "inquiry",
          note: "Organization submitted unfinished-work context for a first useful result.",
          metadata: {
            requestedOffer: input.selectedOffer,
            wantsFirstValue: input.wantsFirstValue,
            wantsProof: input.wantsProof,
            wantsDeepOperatingAudit: input.wantsDeepOperatingAudit,
            wantsDeployment: input.wantsDeployment,
            syntheticDataAcknowledged: true,
          },
        },
        {
          salesOwnerOrganizationId: salesOwner.id,
          reservationId: reservation.id,
          actorType: "system",
          eventType: "synthetic_scenario_generated",
          note: "Deterministic synthetic scenario generated from organization type and reported unfinished work.",
          metadata: { demoScenarioId: scenarioRecord.id, humanReviewRequired: true },
        },
      ],
    });

    await tx.auditLog.create({
      data: {
        organizationId: salesOwner.id,
        actorType: "public_contact",
        action: "sales.commercial_intent_created",
        resourceType: "demo_reservation",
        resourceId: reservation.id,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        metadata: { requestedOffer: input.selectedOffer, mode: "synthetic_first_value", paymentRequested: false },
      },
    });

    return {
      reservation: reservationView(reservation),
      scenario: scenarioRecord,
      offer: {
        ...requestedOffer,
        paymentStatus: "Not requested",
        paymentNextStep:
          "Klinikos produces and reviews the first useful result before any paid capability is advanced. A paid scope requires a separate economic-value decision.",
      },
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
      firstValueReady: reservations.filter((item) => item.status === "first_value_ready").length,
      firstValueDelivered: reservations.filter((item) => item.status === "first_value_delivered").length,
      paidCapabilityReview: reservations.filter((item) => item.status === "paid_capability_review").length,
      proofInProgress: reservations.filter((item) => item.status === "proof_in_progress").length,
      measured: reservations.filter((item) => item.status === "measured").length,
      expansionReady: reservations.filter((item) => item.status === "expansion_ready").length,
      pipelineCents: reservations
        .filter((item) => ["paid_capability_review", "proof_in_progress", "expansion_ready"].includes(item.status))
        .reduce((sum, item) => sum + item.priceCents, 0),
    },
  };
}

export type SalesDemoWorkspace = Awaited<ReturnType<typeof listSalesDemoWorkspace>>;

export async function listCommercialProgressForOwner(session: ClinicSession) {
  if (!can(session.role, "sales", "read")) throw new NetworkAccessError("Commercial progress access is not permitted for this role.", 403);
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
      action: "sales.commercial_progress_accessed",
      resourceType: "commercial_progress",
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
  if (!reservation) throw new NetworkAccessError("Commercial record not found for this organization.", 404);
  return reservation;
}

export async function transitionDemoReservation(session: ClinicSession, reservationId: string, rawInput: unknown) {
  if (!can(session.role, "sales", "update")) throw new NetworkAccessError("Commercial progress updates are not permitted for this role.", 403);
  const input = transitionDemoReservationSchema.parse(rawInput);
  const reservation = await findManagedReservation(session, reservationId);
  if (!canTransitionDemoReservation(reservation.status, input.status)) {
    throw new NetworkAccessError(`Commercial record cannot move from ${reservation.status} to ${input.status}.`, 409);
  }

  const parsedOffer = demoOffers[reservation.selectedOffer as DemoOfferKey] ?? demoOffers.first_value;
  const nextPaymentStatus = input.paymentStatus ?? reservation.paymentStatus;

  if (input.status === "proof_in_progress") {
    if (parsedOffer.commercialRoute !== "qualified_service") {
      throw new NetworkAccessError("Select and review a governed paid capability before starting paid proof work.", 409);
    }
    if (!["payment_recorded", "waived"].includes(nextPaymentStatus)) {
      throw new NetworkAccessError("Verified payment evidence or an approved waiver is required before paid proof work begins.", 409);
    }
  }

  return db.$transaction(async (tx) => {
    const updated = await tx.demoReservation.update({
      where: { id: reservation.id },
      data: {
        status: input.status,
        paymentStatus: nextPaymentStatus,
        // Sales scheduling is intentionally not advanced by state transitions. A meeting
        // requires explicit founder approval outside this deterministic progression.
        scheduledAt: reservation.scheduledAt,
        selectedOffer: reservation.selectedOffer,
        priceCents: parsedOffer.priceCents,
      },
    });

    await tx.demoReservationEvent.create({
      data: {
        salesOwnerOrganizationId: session.organizationId,
        reservationId: reservation.id,
        actorId: session.userId,
        actorType: "user",
        eventType: "commercial_state_changed",
        fromStatus: reservation.status,
        toStatus: updated.status,
        note: input.note,
        metadata: { paymentStatus: updated.paymentStatus, selectedOffer: updated.selectedOffer, meetingCommitted: false },
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: "sales.commercial_state_transitioned",
        resourceType: "demo_reservation",
        resourceId: reservation.id,
        changes: {
          status: { from: reservation.status, to: updated.status },
          paymentStatus: { from: reservation.paymentStatus, to: updated.paymentStatus },
        },
        metadata: { note: input.note, selectedOffer: updated.selectedOffer, meetingCommitted: false },
      },
    });
    return reservationView(updated);
  });
}

export async function generateDemoScenario(session: ClinicSession, reservationId: string) {
  if (!can(session.role, "sales", "update")) throw new NetworkAccessError("Synthetic scenario generation is not permitted for this role.", 403);
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
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "sales.synthetic_scenario_generated", resourceType: "demo_scenario", resourceId: scenario.id, metadata: { reservationId: reservation.id, synthetic: true } } });
    return scenario;
  });
}

export async function generateDemoRecap(session: ClinicSession, reservationId: string) {
  if (!can(session.role, "sales", "update")) throw new NetworkAccessError("Commercial recap generation is not permitted for this role.", 403);
  const reservation = await findManagedReservation(session, reservationId);
  if (!reservation.demoScenario) throw new NetworkAccessError("Generate the synthetic scenario before preparing its recap.", 409);
  const painPoints = parsePainPoints(reservation.painPoints);
  const primary = painPointSchema.safeParse(reservation.biggestPainPoint).data ?? painPoints[0] ?? "owner_visibility";
  const draft = buildDemoRecapDraft({ clinicName: reservation.clinicName, clinicType: reservation.clinicType, biggestPainPoint: primary, painPoints, scenarioTitle: reservation.demoScenario.title });

  return db.$transaction(async (tx) => {
    const recap = await tx.demoRecap.upsert({
      where: { reservationId: reservation.id },
      update: { painPoint: draft.painPoint, whatWasShown: draft.whatWasShown, workflowGaps: draft.workflowGaps, recommendedNextStep: draft.recommendedNextStep, estimatedValueAreas: draft.estimatedValueAreas, productStatusSnapshot: draft.productStatusSnapshot, priceOption: draft.priceOption, callToAction: draft.callToAction, status: "draft", reviewStatus: "human_review_required", draftedBy: draft.draftedBy, reviewedBy: null, reviewedAt: null, reviewNotes: null },
      create: { reservationId: reservation.id, salesOwnerOrganizationId: session.organizationId, painPoint: draft.painPoint, whatWasShown: draft.whatWasShown, workflowGaps: draft.workflowGaps, recommendedNextStep: draft.recommendedNextStep, estimatedValueAreas: draft.estimatedValueAreas, productStatusSnapshot: draft.productStatusSnapshot, priceOption: draft.priceOption, callToAction: draft.callToAction, status: draft.status, reviewStatus: draft.reviewStatus, draftedBy: draft.draftedBy },
    });
    await tx.demoReservationEvent.create({ data: { salesOwnerOrganizationId: session.organizationId, reservationId: reservation.id, actorId: session.userId, actorType: "user", eventType: "recap_draft_generated", note: "Deterministic commercial recap drafted. Human review is required before external use.", metadata: { recapId: recap.id, draftedBy: recap.draftedBy } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "sales.commercial_recap_drafted", resourceType: "demo_recap", resourceId: recap.id, metadata: { reservationId: reservation.id, reviewStatus: recap.reviewStatus } } });
    return recap;
  });
}

export async function reviewDemoRecap(session: ClinicSession, reservationId: string, rawInput: unknown) {
  if (!can(session.role, "sales", "manage")) throw new NetworkAccessError("Commercial recap approval is not permitted for this role.", 403);
  const input = reviewDemoRecapSchema.parse(rawInput);
  const reservation = await findManagedReservation(session, reservationId);
  if (!reservation.recap) throw new NetworkAccessError("Commercial recap draft not found for this organization.", 404);

  return db.$transaction(async (tx) => {
    const recap = await tx.demoRecap.update({
      where: { id: reservation.recap!.id },
      data: { status: input.decision === "approve" ? "approved" : "draft", reviewStatus: input.decision === "approve" ? "approved" : "rejected", reviewedBy: session.userId, reviewedAt: new Date(), reviewNotes: input.notes },
    });
    const decisionEvent = input.decision === "approve" ? "approved" : "rejected";
    await tx.demoReservationEvent.create({ data: { salesOwnerOrganizationId: session.organizationId, reservationId: reservation.id, actorId: session.userId, actorType: "user", eventType: `recap_${decisionEvent}`, note: input.notes, metadata: { recapId: recap.id, reviewStatus: recap.reviewStatus } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `sales.commercial_recap_${decisionEvent}`, resourceType: "demo_recap", resourceId: recap.id, metadata: { reservationId: reservation.id, notes: input.notes } } });
    return recap;
  });
}

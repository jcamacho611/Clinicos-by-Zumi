import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { decideLuxeOpenLeadIdentityMatch } from "@/lib/luxe-acquisition-rules";
import { parseGoDaddyConversationNotification, type ParsedGoDaddyConversation } from "@/lib/luxe-godaddy-conversation-rules";
import { ingestPublicLuxeLead } from "@/lib/repositories/luxe-acquisition-repository";
import { recordLuxeBookingObservation } from "@/lib/repositories/luxe-booking-intent-repository";
import { recordLuxeCancellationObservation } from "@/lib/repositories/luxe-cancellation-recovery-repository";

const LUXE_ORGANIZATION_SLUG = process.env.LUXE_MEDI_ORGANIZATION_SLUG?.trim() || "luxe-medi";
const GODADDY_RESOURCE_TYPE = "godaddy_conversation_notification";
const GODADDY_EVENT_TYPE = "luxe.godaddy_conversation.inbound";
const TERMINAL_LEAD_STATUSES = ["lost", "completed"];

function jsonRecord(value: Prisma.JsonValue | null | undefined) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, Prisma.JsonValue> : null;
}

function jsonString(value: Prisma.JsonValue | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function resolveLuxeOrganizationId() {
  const organization = await db.organization.findUnique({
    where: { slug: LUXE_ORGANIZATION_SLUG },
    select: { id: true, status: true },
  });
  return organization?.status === "active" ? organization.id : null;
}

async function alreadyProcessed(organizationId: string, sourceMessageId: string) {
  return db.integrationEvent.findFirst({
    where: {
      organizationId,
      resourceType: GODADDY_RESOURCE_TYPE,
      resourceId: sourceMessageId,
      eventType: GODADDY_EVENT_TYPE,
    },
    select: { id: true, status: true },
  });
}

async function recordSourceEvent(input: {
  organizationId: string;
  sourceMessageId: string;
  status: string;
  metadata: Record<string, unknown>;
}) {
  return db.integrationEvent.create({
    data: {
      organizationId: input.organizationId,
      integrationId: null,
      resourceType: GODADDY_RESOURCE_TYPE,
      resourceId: input.sourceMessageId,
      direction: "inbound",
      eventType: GODADDY_EVENT_TYPE,
      status: input.status,
      metadata: input.metadata as Prisma.InputJsonValue,
    },
  });
}

async function resolveCancellationLeadByOrderReference(organizationId: string, orderReference: string) {
  const sourceEvents = await db.integrationEvent.findMany({
    where: {
      organizationId,
      resourceType: GODADDY_RESOURCE_TYPE,
      eventType: GODADDY_EVENT_TYPE,
      status: "processed",
    },
    orderBy: { createdAt: "desc" },
    take: 1000,
    select: { metadata: true },
  });

  const leadIds = new Set<string>();
  for (const event of sourceEvents) {
    const metadata = jsonRecord(event.metadata);
    if (!metadata) continue;
    if (jsonString(metadata.orderReference) !== orderReference) continue;
    const leadId = jsonString(metadata.leadId);
    if (leadId) leadIds.add(leadId);
  }

  if (leadIds.size === 1) return { kind: "matched" as const, leadId: [...leadIds][0], method: "order_reference" as const };
  if (leadIds.size > 1) return { kind: "ambiguous" as const, reason: "order_reference_multiple_leads" as const };
  return { kind: "none" as const };
}

async function resolveCancellationLeadByContact(organizationId: string, parsed: ParsedGoDaddyConversation) {
  if (!parsed.email && !parsed.phone) return { kind: "none" as const };

  const candidateOr: Prisma.LeadWhereInput[] = [];
  if (parsed.email) candidateOr.push({ email: { equals: parsed.email, mode: "insensitive" } });
  if (parsed.phone) candidateOr.push({ phone: { not: null } });

  const candidates = await db.lead.findMany({
    where: {
      organizationId,
      status: { notIn: TERMINAL_LEAD_STATUSES },
      OR: candidateOr,
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: { id: true, email: true, phone: true },
  });
  const decision = decideLuxeOpenLeadIdentityMatch(candidates, parsed.email, parsed.phone);
  if (decision.kind === "matched") return { kind: "matched" as const, leadId: decision.id, method: "unique_contact" as const };
  if (decision.kind === "ambiguous") return { kind: "ambiguous" as const, reason: "contact_multiple_leads" as const };
  return { kind: "none" as const };
}

async function resolveCancellationLead(organizationId: string, parsed: ParsedGoDaddyConversation) {
  if (parsed.orderReference) {
    const byOrder = await resolveCancellationLeadByOrderReference(organizationId, parsed.orderReference);
    if (byOrder.kind !== "none") return byOrder;
  }
  return resolveCancellationLeadByContact(organizationId, parsed);
}

export async function ingestGoDaddyConversationNotification(rawEnvelope: unknown) {
  const parsed = parseGoDaddyConversationNotification(rawEnvelope);

  if (parsed.kind === "unknown") {
    return { status: "ignored" as const, reason: "unrecognized_notification" as const };
  }

  const organizationId = await resolveLuxeOrganizationId();
  if (!organizationId) {
    return { status: "unavailable" as const, reason: "luxe_organization_unavailable" as const };
  }

  const replay = await alreadyProcessed(organizationId, parsed.sourceMessageId);
  if (replay) {
    return {
      status: "duplicate" as const,
      reason: "source_message_already_processed" as const,
      conversationReference: parsed.conversationReference,
    };
  }

  if (parsed.kind === "cancellation_observed") {
    const resolution = await resolveCancellationLead(organizationId, parsed);
    if (resolution.kind !== "matched") {
      await recordSourceEvent({
        organizationId,
        sourceMessageId: parsed.sourceMessageId,
        status: "manual_review",
        metadata: {
          observedKind: parsed.kind,
          conversationReference: parsed.conversationReference,
          orderReference: parsed.orderReference,
          bodyStored: false,
          leadMutated: false,
          cancellationVerified: false,
          paymentVerified: false,
          reviewReason: resolution.kind === "ambiguous" ? resolution.reason : "cancellation_identity_unresolved",
        },
      });
      return {
        status: "manual_review" as const,
        reason: resolution.kind === "ambiguous" ? resolution.reason : "cancellation_identity_unresolved" as const,
        conversationReference: parsed.conversationReference,
        orderReference: parsed.orderReference,
      };
    }

    const recovery = await recordLuxeCancellationObservation(resolution.leadId, {
      source: "godaddy_conversations",
      orderReference: parsed.orderReference,
      conversationReference: parsed.conversationReference,
      messageText: parsed.messageText,
      linkageMethod: resolution.method,
    });

    if (!recovery.tracked) {
      await recordSourceEvent({
        organizationId,
        sourceMessageId: parsed.sourceMessageId,
        status: "manual_review",
        metadata: {
          observedKind: parsed.kind,
          conversationReference: parsed.conversationReference,
          orderReference: parsed.orderReference,
          leadId: resolution.leadId,
          bodyStored: false,
          leadMutated: false,
          cancellationVerified: false,
          paymentVerified: false,
          reviewReason: recovery.reason,
        },
      });
      return {
        status: "manual_review" as const,
        reason: recovery.reason,
        leadId: resolution.leadId,
        conversationReference: parsed.conversationReference,
        orderReference: parsed.orderReference,
      };
    }

    await recordSourceEvent({
      organizationId,
      sourceMessageId: parsed.sourceMessageId,
      status: "processed",
      metadata: {
        observedKind: parsed.kind,
        conversationReference: parsed.conversationReference,
        orderReference: parsed.orderReference,
        leadId: recovery.leadId,
        linkageMethod: resolution.method,
        recoveryTaskId: recovery.taskId,
        bodyStored: false,
        cancellationVerified: false,
        noShowAssumed: false,
        paymentVerified: false,
        automaticOutreachSent: false,
      },
    });

    return {
      status: "captured" as const,
      observedKind: parsed.kind,
      leadId: recovery.leadId,
      linkageMethod: resolution.method,
      recoveryTaskId: recovery.taskId,
      conversationReference: parsed.conversationReference,
      orderReference: parsed.orderReference,
      verifiedCancellation: false,
      verifiedPayment: false,
      automaticOutreachSent: false,
    };
  }

  if (!parsed.customerName || (!parsed.email && !parsed.phone)) {
    await recordSourceEvent({
      organizationId,
      sourceMessageId: parsed.sourceMessageId,
      status: "manual_review",
      metadata: {
        observedKind: parsed.kind,
        conversationReference: parsed.conversationReference,
        bodyStored: false,
        leadMutated: false,
        paymentVerified: false,
      },
    });
    return {
      status: "manual_review" as const,
      reason: "missing_contact_identity" as const,
      conversationReference: parsed.conversationReference,
    };
  }

  const isBookingObservation = parsed.kind === "booking_observed";
  const result = await ingestPublicLuxeLead({
    name: parsed.customerName,
    email: parsed.email,
    phone: parsed.phone,
    serviceInterest: parsed.serviceInterest,
    appointmentInterest: isBookingObservation
      ? parsed.appointmentText
        ? `GoDaddy booking observed: ${parsed.appointmentText}`
        : "GoDaddy booking observed; human verification required"
      : null,
    preferredContactMethod: "either",
    preferredTiming: parsed.appointmentText,
    message: parsed.messageText?.slice(0, 1200) ?? (isBookingObservation ? "GoDaddy booking notification observed; verify appointment and payment state in the source system." : null),
    contactConsent: false,
    marketingConsent: false,
    attribution: {
      firstTouchSource: "godaddy_conversations",
      lastTouchSource: "godaddy_conversations",
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmTerm: null,
      utmContent: null,
      campaignId: parsed.orderReference,
      originatingPage: null,
      landingPage: null,
      referrer: null,
      cta: isBookingObservation ? "GoDaddy booking observed" : "GoDaddy conversation inquiry",
      bookingSource: isBookingObservation ? "godaddy_appointments" : null,
      referralSource: null,
      socialSource: null,
      qrSource: null,
    },
    website: "",
  });

  let bookingObservation: Awaited<ReturnType<typeof recordLuxeBookingObservation>> | null = null;
  if (isBookingObservation) {
    try {
      bookingObservation = await recordLuxeBookingObservation(result.leadId, {
        source: "godaddy_conversations",
        orderReference: parsed.orderReference,
        appointmentText: parsed.appointmentText,
      });
    } catch {
      await recordSourceEvent({
        organizationId,
        sourceMessageId: parsed.sourceMessageId,
        status: "manual_review",
        metadata: {
          observedKind: parsed.kind,
          conversationReference: parsed.conversationReference,
          orderReference: parsed.orderReference,
          leadId: result.leadId,
          bodyStored: false,
          bookingObservationLinked: false,
          bookingVerified: false,
          paymentVerified: false,
          reviewReason: "booking_observation_link_failed",
        },
      });
      return {
        status: "manual_review" as const,
        reason: "booking_observation_link_failed" as const,
        leadId: result.leadId,
        conversationReference: parsed.conversationReference,
        orderReference: parsed.orderReference,
        verifiedBooking: false,
        verifiedPayment: false,
      };
    }
  }

  const bookingReviewTaskId = bookingObservation && bookingObservation.tracked ? bookingObservation.taskId : null;
  const bookingObservationLinked = bookingReviewTaskId !== null;

  await recordSourceEvent({
    organizationId,
    sourceMessageId: parsed.sourceMessageId,
    status: "processed",
    metadata: {
      observedKind: parsed.kind,
      conversationReference: parsed.conversationReference,
      orderReference: parsed.orderReference,
      leadId: result.leadId,
      leadCreated: result.created,
      bodyStored: false,
      bookingObservationLinked,
      bookingReviewTaskId,
      bookingVerified: false,
      paymentVerified: false,
    },
  });

  return {
    status: "captured" as const,
    observedKind: parsed.kind,
    conversationReference: parsed.conversationReference,
    orderReference: parsed.orderReference,
    leadId: result.leadId,
    created: result.created,
    followUpCreated: Boolean(result.taskId),
    bookingObservationLinked,
    bookingReviewTaskId,
    verifiedBooking: false,
    verifiedPayment: false,
  };
}

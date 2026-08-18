import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { parseGoDaddyConversationNotification } from "@/lib/luxe-godaddy-conversation-rules";
import { ingestPublicLuxeLead } from "@/lib/repositories/luxe-acquisition-repository";
import { recordLuxeBookingObservation } from "@/lib/repositories/luxe-booking-intent-repository";

const LUXE_ORGANIZATION_SLUG = process.env.LUXE_MEDI_ORGANIZATION_SLUG?.trim() || "luxe-medi";
const GODADDY_RESOURCE_TYPE = "godaddy_conversation_notification";
const GODADDY_EVENT_TYPE = "luxe.godaddy_conversation.inbound";

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

  // A cancellation email can be operationally important, but the notification format
  // does not always contain enough stable identity to mutate a lead safely. Keep it
  // human-reviewable until a conversation/order identity is linked deterministically.
  if (parsed.kind === "cancellation_observed") {
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
      reason: "cancellation_requires_identity_link" as const,
      conversationReference: parsed.conversationReference,
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
      bookingObservationLinked: bookingObservation?.tracked ?? false,
      bookingReviewTaskId: bookingObservation?.tracked ? bookingObservation.taskId : null,
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
    bookingObservationLinked: bookingObservation?.tracked ?? false,
    bookingReviewTaskId: bookingObservation?.tracked ? bookingObservation.taskId : null,
    // Booking/payment remain observations only. Neither is promoted to a verified
    // transaction state from notification email content.
    verifiedBooking: false,
    verifiedPayment: false,
  };
}

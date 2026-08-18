import "server-only";

import { parseGoDaddyConversationNotification } from "@/lib/luxe-godaddy-conversation-rules";
import { ingestPublicLuxeLead } from "@/lib/repositories/luxe-acquisition-repository";

export async function ingestGoDaddyConversationNotification(rawEnvelope: unknown) {
  const parsed = parseGoDaddyConversationNotification(rawEnvelope);

  if (parsed.kind === "unknown") {
    return { status: "ignored" as const, reason: "unrecognized_notification" as const };
  }

  // A cancellation email can be operationally important, but the notification format
  // does not always contain enough stable identity to mutate a lead safely. Keep it
  // human-reviewable until a conversation/order identity is linked deterministically.
  if (parsed.kind === "cancellation_observed") {
    return {
      status: "manual_review" as const,
      reason: "cancellation_requires_identity_link" as const,
      conversationReference: parsed.conversationReference,
    };
  }

  if (!parsed.customerName || (!parsed.email && !parsed.phone)) {
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

  return {
    status: "captured" as const,
    observedKind: parsed.kind,
    conversationReference: parsed.conversationReference,
    orderReference: parsed.orderReference,
    leadId: result.leadId,
    created: result.created,
    followUpCreated: Boolean(result.taskId),
    // Booking/payment remain observations only. Neither is promoted to a verified
    // transaction state from notification email content.
    verifiedBooking: false,
    verifiedPayment: false,
  };
}

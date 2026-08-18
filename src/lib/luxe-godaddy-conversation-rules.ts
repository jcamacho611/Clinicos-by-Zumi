import { z } from "zod";
import { normalizeLuxeEmail, normalizeLuxePhone } from "@/lib/luxe-acquisition-rules";
import { canonicalizeLuxeServiceInterest } from "@/lib/luxe-service-interest";

export const godaddyConversationEnvelopeSchema = z.object({
  messageId: z.string().trim().min(1).max(255),
  subject: z.string().trim().min(1).max(300),
  body: z.string().trim().min(1).max(100_000),
  receivedAt: z.string().datetime({ offset: true }).optional().nullable(),
}).strict();

export type GoDaddyConversationEnvelope = z.infer<typeof godaddyConversationEnvelopeSchema>;

export type ParsedGoDaddyConversation = {
  sourceMessageId: string;
  kind: "booking_observed" | "cancellation_observed" | "inquiry" | "unknown";
  orderReference: string | null;
  conversationReference: string | null;
  customerName: string | null;
  email: string | null;
  phone: string | null;
  serviceInterest: string | null;
  appointmentText: string | null;
  messageText: string | null;
};

function capture(body: string, pattern: RegExp) {
  return body.match(pattern)?.[1]?.trim() || null;
}

function stripForwardedHistory(value: string | null) {
  if (!value) return null;
  return value
    .split(/\n(?:On .+ wrote:|Conversation Summary:|\[Open Conversations|\[View the rest in Conversations)/i)[0]
    ?.trim() || null;
}

function extractConversationReference(body: string) {
  const match = body.match(/[?&]conversation=(\d+)/i);
  return match?.[1] ?? null;
}

export function messageRequestsCancellation(message: string | null | undefined) {
  const text = message?.replace(/\s+/g, " ").trim();
  if (!text) return false;

  // Negated intent must win. A message such as "do not cancel" cannot create
  // cancellation recovery work merely because it contains the word cancel.
  if (/\b(?:do not|don't|dont|please do not|please don't|not to) cancel\b/i.test(text)) return false;
  if (/\b(?:keep|confirm|leave) (?:my |the )?(?:appointment|booking)\b/i.test(text) && /\bcancel\b/i.test(text)) return false;

  return /\bplease cancel\b/i.test(text)
    || /\b(?:i|we) (?:need|want|would like|have) to cancel\b/i.test(text)
    || /\bcancel (?:my|our|the) (?:appointment|booking)\b/i.test(text)
    || /\b(?:appointment|booking) (?:was|is|has been)? ?(?:cancelled|canceled)\b/i.test(text)
    || /^(?:cancel|cancellation)\b/i.test(text);
}

export function parseGoDaddyConversationNotification(rawEnvelope: unknown): ParsedGoDaddyConversation {
  const envelope = godaddyConversationEnvelopeSchema.parse(rawEnvelope);
  const subjectLooksRight = /new message for luxe medical spa/i.test(envelope.subject);
  const bodyLooksRight = /LUXE Medical Spa received a new message\./i.test(envelope.body);
  if (!subjectLooksRight || !bodyLooksRight) {
    return {
      sourceMessageId: envelope.messageId,
      kind: "unknown",
      orderReference: null,
      conversationReference: extractConversationReference(envelope.body),
      customerName: null,
      email: null,
      phone: null,
      serviceInterest: null,
      appointmentText: null,
      messageText: null,
    };
  }

  const orderReference = capture(envelope.body, /Order\s*#\s*([A-Z0-9-]+)/i);
  const customerName = capture(envelope.body, /\nName:\s*\n([^\n]+)/i)
    ?? capture(envelope.body, /\nFrom\s+([^:\n]+):/i)?.replace(/\s*\(\d+\)\s*$/, "").trim()
    ?? null;
  const rawPhone = capture(envelope.body, /\nPhone:\s*\n([^\n]+)/i);
  const email = normalizeLuxeEmail(capture(envelope.body, /\nEmail:\s*\n([^\n]+)/i));
  const phone = normalizeLuxePhone(rawPhone);
  const serviceInterest = canonicalizeLuxeServiceInterest(capture(envelope.body, /\nWhat:\s*\n([^\n]+)/i));
  const appointmentText = capture(envelope.body, /\nWhen:\s*\n([^\n]+)/i);
  const initialMessage = stripForwardedHistory(capture(envelope.body, /received a new message\.\s*\n\s*From[^:]*:\s*\n\s*([\s\S]+)$/i));
  const normalizedMessage = initialMessage?.replace(/\n{3,}/g, "\n\n").trim() ?? null;

  const cancellationObserved = messageRequestsCancellation(normalizedMessage);
  const bookingObserved = Boolean(orderReference && /\nBooking\b/i.test(envelope.body) && serviceInterest);
  const inquiryObserved = Boolean(normalizedMessage && !bookingObserved && !cancellationObserved);

  return {
    sourceMessageId: envelope.messageId,
    kind: cancellationObserved ? "cancellation_observed" : bookingObserved ? "booking_observed" : inquiryObserved ? "inquiry" : "unknown",
    orderReference,
    conversationReference: extractConversationReference(envelope.body),
    customerName,
    email,
    phone,
    serviceInterest,
    appointmentText,
    messageText: normalizedMessage,
  };
}

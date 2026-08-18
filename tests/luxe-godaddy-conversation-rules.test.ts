import { describe, expect, it } from "vitest";
import { parseGoDaddyConversationNotification } from "@/lib/luxe-godaddy-conversation-rules";

describe("GoDaddy Luxe conversation notification parser", () => {
  it("extracts a booking notification without claiming payment", () => {
    const parsed = parseGoDaddyConversationNotification({
      messageId: "synthetic-booking-1",
      subject: "New message for LUXE Medical Spa",
      receivedAt: "2026-08-18T13:00:00-04:00",
      body: `LUXE Medical Spa received a new message.

From LUXE Medical Spa:

Order # C-SYNTHETIC123

Customer

Name:

Alex Example

Phone:

5165550199

Email:

alex@example.test

Booking

What:

Luxe Rejuvenation Infusion (Botox)

When:

Saturday, August 22 at 1:00 PM

Manage appointment

https://conversations.godaddy.com/conversations/synthetic?conversation=123456789&ref=email_notification`,
    });

    expect(parsed.kind).toBe("booking_observed");
    expect(parsed.orderReference).toBe("C-SYNTHETIC123");
    expect(parsed.conversationReference).toBe("123456789");
    expect(parsed.customerName).toBe("Alex Example");
    expect(parsed.phone).toBe("+15165550199");
    expect(parsed.email).toBe("alex@example.test");
    expect(parsed.serviceInterest).toBe("Luxe Rejuvenation Infusion (Botox)");
  });

  it("recognizes a cancellation as an observed lifecycle event", () => {
    const parsed = parseGoDaddyConversationNotification({
      messageId: "synthetic-cancel-1",
      subject: "New message for LUXE Medical Spa",
      body: `LUXE Medical Spa received a new message.

From Jamie Example:

Hi, this appointment was canceled. If not, please cancel it.

On Oct 9, 2025, at 3:11 PM, LUXE Medical Spa <hello@luxe-medi.com> wrote:
This is a reminder.`,
    });

    expect(parsed.kind).toBe("cancellation_observed");
    expect(parsed.customerName).toBe("Jamie Example");
    expect(parsed.messageText).toContain("please cancel");
    expect(parsed.messageText).not.toContain("This is a reminder");
  });

  it("recognizes a generic customer inquiry", () => {
    const parsed = parseGoDaddyConversationNotification({
      messageId: "synthetic-inquiry-1",
      subject: "Re: New message for LUXE Medical Spa",
      body: `LUXE Medical Spa received a new message.

From Taylor Example (1234567890):

I have a question about availability this weekend.

Conversation Summary:
Older content`,
    });

    expect(parsed.kind).toBe("inquiry");
    expect(parsed.customerName).toBe("Taylor Example");
    expect(parsed.messageText).toBe("I have a question about availability this weekend.");
  });

  it("fails closed for unrelated mail", () => {
    const parsed = parseGoDaddyConversationNotification({
      messageId: "synthetic-spam-1",
      subject: "Newsletter",
      body: "Unrelated sender content.",
    });
    expect(parsed.kind).toBe("unknown");
    expect(parsed.customerName).toBeNull();
  });
});

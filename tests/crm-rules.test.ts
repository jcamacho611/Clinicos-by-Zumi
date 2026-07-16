import { describe, expect, it } from "vitest";
import { createLeadMessageSchema, createLeadSchema, leadValueDollars, transitionLeadSchema } from "@/lib/crm-rules";

describe("CRM lead and revenue recovery rules", () => {
  it("accepts supported lead sources and rejects malformed contacts", () => {
    expect(createLeadSchema.safeParse({ name: "Jordan Ellis", source: "website", estimatedValueCents: 18000 }).success).toBe(true);
    expect(createLeadSchema.safeParse({ name: "J", source: "website", estimatedValueCents: 18000 }).success).toBe(false);
    expect(createLeadSchema.safeParse({ name: "Jordan Ellis", source: "unknown", estimatedValueCents: 18000 }).success).toBe(false);
    expect(createLeadSchema.safeParse({ name: "Jordan Ellis", source: "website", email: "not-an-email", estimatedValueCents: 18000 }).success).toBe(false);
  });

  it("requires a documented reason for every pipeline transition", () => {
    expect(transitionLeadSchema.safeParse({ action: "contact", note: "Call completed and next step documented." }).success).toBe(true);
    expect(transitionLeadSchema.safeParse({ action: "book", note: "short" }).success).toBe(false);
    expect(transitionLeadSchema.safeParse({ action: "lose", note: "Lead closed after follow-up.", lostReason: "No response after three attempts." }).success).toBe(true);
  });

  it("keeps communications channel-bound and values human-readable", () => {
    expect(createLeadMessageSchema.parse({ channel: "sms", body: "Your appointment request is ready.", direction: "OUTBOUND" }).channel).toBe("sms");
    expect(createLeadMessageSchema.safeParse({ channel: "carrier_pigeon", body: "Hello" }).success).toBe(false);
    expect(leadValueDollars(85000)).toBe("$850");
  });
});

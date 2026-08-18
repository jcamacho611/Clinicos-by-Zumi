import { describe, expect, it } from "vitest";
import {
  campaignSourceFromAttribution,
  decideLuxeOpenLeadIdentityMatch,
  leadResponsePriority,
  normalizeAttribution,
  normalizeLuxeEmail,
  normalizeLuxePhone,
  publicLuxeLeadSchema,
} from "@/lib/luxe-acquisition-rules";

describe("Luxe acquisition intake rules", () => {
  it("accepts a bounded inquiry with one contact route", () => {
    const parsed = publicLuxeLeadSchema.safeParse({
      name: "Maria Example",
      email: "MARIA@EXAMPLE.COM",
      serviceInterest: "Botox",
      preferredContactMethod: "sms",
      attribution: {
        firstTouchSource: "instagram",
        firstTouchCampaign: "ig-launch",
        firstTouchLandingPage: "https://www.klinikos.io/luxe/consult?service=Botox",
        lastTouchSource: "google",
        utmCampaign: "summer-glow",
        originatingPage: "https://luxe-medi.com/botox",
        cta: "Book consultation",
      },
    });
    expect(parsed.success).toBe(true);
  });

  it("normalizes customer-facing service names before catalog lookup", () => {
    const parsed = publicLuxeLeadSchema.parse({
      name: "Maria Example",
      phone: "5165550199",
      serviceInterest: "Luxe Rejuvenation Infusion (Botox)",
      attribution: {},
    });
    expect(parsed.serviceInterest).toBe("Botox");
  });

  it("requires email or phone but does not require clinical information", () => {
    expect(publicLuxeLeadSchema.safeParse({ name: "Maria Example", attribution: {} }).success).toBe(false);
    expect(publicLuxeLeadSchema.safeParse({ name: "Maria Example", phone: "(516) 555-0199", attribution: {} }).success).toBe(true);
  });

  it("rejects honeypot submissions", () => {
    expect(publicLuxeLeadSchema.safeParse({
      name: "Bot Submitter",
      email: "bot@example.com",
      website: "https://spam.example",
      attribution: {},
    }).success).toBe(false);
  });

  it("normalizes contact identifiers for deduplication", () => {
    expect(normalizeLuxeEmail("  MARIA@EXAMPLE.COM ")).toBe("maria@example.com");
    expect(normalizeLuxePhone("(516) 555-0199")).toBe("+15165550199");
    expect(normalizeLuxePhone("1-516-555-0199")).toBe("+15165550199");
  });

  it("deduplicates only when exactly one open lead matches the supplied identity", () => {
    expect(decideLuxeOpenLeadIdentityMatch([
      { id: "lead-a", email: "maria@example.com", phone: "+15165550199" },
      { id: "lead-b", email: "other@example.com", phone: "+16465550100" },
    ], "maria@example.com", "+15165550199")).toEqual({ kind: "matched", id: "lead-a" });
  });

  it("refuses to auto-merge when email and phone resolve to different open leads", () => {
    const decision = decideLuxeOpenLeadIdentityMatch([
      { id: "lead-email", email: "maria@example.com", phone: "+15165550001" },
      { id: "lead-phone", email: "different@example.com", phone: "+15165550199" },
    ], "maria@example.com", "+15165550199");
    expect(decision).toEqual({ kind: "ambiguous", candidateIds: ["lead-email", "lead-phone"] });
  });

  it("refuses to auto-merge duplicate open records sharing the same contact identifier", () => {
    const decision = decideLuxeOpenLeadIdentityMatch([
      { id: "lead-a", email: "maria@example.com", phone: null },
      { id: "lead-b", email: "maria@example.com", phone: null },
    ], "maria@example.com", null);
    expect(decision.kind).toBe("ambiguous");
  });

  it("returns no identity match when none of the normalized identifiers match", () => {
    expect(decideLuxeOpenLeadIdentityMatch([
      { id: "lead-a", email: "other@example.com", phone: "+15165550000" },
    ], "maria@example.com", "+15165550199")).toEqual({ kind: "none" });
  });

  it("keeps the original campaign as the canonical acquisition campaign on a later touch", () => {
    const attribution = {
      firstTouchSource: "instagram",
      firstTouchCampaign: "ig-launch",
      firstTouchLandingPage: "https://www.klinikos.io/luxe/consult?utm_campaign=ig-launch",
      lastTouchSource: "google",
      lastTouchCampaign: "brand-search",
      utmSource: "google",
      utmCampaign: "brand-search",
    };
    expect(campaignSourceFromAttribution(attribution)).toBe("ig-launch");
    expect(normalizeAttribution(attribution)).toEqual(attribution);
  });

  it("raises operational priority for booking intent without making clinical decisions", () => {
    expect(leadResponsePriority({ appointmentInterest: "This week", preferredTiming: null, attribution: {} })).toBe("high");
    expect(leadResponsePriority({ appointmentInterest: null, preferredTiming: null, attribution: { cta: "Book now" } })).toBe("high");
    expect(leadResponsePriority({ appointmentInterest: null, preferredTiming: null, attribution: {} })).toBe("normal");
  });
});

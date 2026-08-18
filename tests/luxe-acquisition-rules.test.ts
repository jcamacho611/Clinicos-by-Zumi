import { describe, expect, it } from "vitest";
import {
  campaignSourceFromAttribution,
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

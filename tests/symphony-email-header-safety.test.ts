import { describe, expect, it } from "vitest";
import { buildSymphonyEmail, type SymphonyCompanyProfile } from "@/lib/company/symphony-message-builder";
import type { SymphonyOpportunity } from "@/lib/company/symphony-opportunity-types";

const profile: SymphonyCompanyProfile = {
  companyName: "Klinikos, Inc.",
  senderName: "Justin R. Camacho",
  senderTitle: "Founder & CEO",
  website: "https://klinikos.io",
  summary: "Klinikos is building a governed operating layer for outpatient healthcare.",
  verifiedFacts: [{ text: "Klinikos is a New York business corporation.", truthClass: "CURRENT_FACT" }],
  visionStatements: [],
};

function opportunity(overrides: Partial<SymphonyOpportunity> = {}): SymphonyOpportunity {
  return {
    id: "safe-header-1",
    title: "Program",
    opportunityClass: "GRANT_NON_DILUTIVE",
    targetClass: "FUNDER",
    organizationName: "Example Program",
    organizationDomain: "example.org",
    recipientEmail: "program@example.org",
    recipientName: "Program Officer",
    purpose: "confirm fit",
    ask: "Could you confirm whether this is the correct program path?",
    messageFamily: "FUNDING_PROGRAM_ROUTING",
    fitVerified: true,
    officialContactPolicy: "EMAIL_ALLOWED",
    personalNetworkRestricted: false,
    strategicPartnershipApproved: false,
    deadline: null,
    ...overrides,
  };
}

describe("Symphony outbound header safety", () => {
  it("rejects newline/control characters in recipient email", () => {
    expect(() =>
      buildSymphonyEmail({
        opportunity: opportunity({ recipientEmail: "program@example.org\nBcc: other@example.org" }),
        profile,
      }),
    ).toThrow(/control|recipient/i);
  });

  it("rejects newline/control characters in organization names used in subjects", () => {
    expect(() =>
      buildSymphonyEmail({
        opportunity: opportunity({ organizationName: "Example\r\nBcc: other@example.org" }),
        profile,
      }),
    ).toThrow(/control|subject|organization/i);
  });
});

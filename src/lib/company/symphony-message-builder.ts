import type { OutboundMessage } from "@/lib/communications/outbound";
import type { SymphonyMessageFamily, SymphonyOpportunity } from "@/lib/company/symphony-opportunity-types";

export type SymphonyVerifiedFact = {
  text: string;
  truthClass: "CURRENT_FACT" | "EXECUTED";
};

export type SymphonyCompanyProfile = {
  companyName: string;
  senderName: string;
  senderTitle: string;
  website: string;
  summary: string;
  verifiedFacts: SymphonyVerifiedFact[];
  visionStatements: string[];
};

export type SymphonyEmailBuildInput = {
  opportunity: SymphonyOpportunity;
  profile: SymphonyCompanyProfile;
};

type FamilyCopy = {
  subject: (input: SymphonyEmailBuildInput) => string;
  positioning: string;
};

const familyCopy: Record<SymphonyMessageFamily, FamilyCopy> = {
  FUNDING_PROGRAM_ROUTING: {
    subject: ({ opportunity }) => `${opportunity.organizationName} - Klinikos funding/program fit inquiry`,
    positioning:
      "We are identifying the strongest non-dilutive, commercialization, and program routes that match our current healthcare technology work before investing time in a full application.",
  },
  GOVERNMENT_PROCUREMENT: {
    subject: ({ opportunity }) => `${opportunity.organizationName} - Klinikos healthcare technology opportunity inquiry`,
    positioning:
      "We are looking for legitimate opportunities to participate as a healthcare technology, implementation, AI/workforce, or modernization vendor where our current capabilities fit the public need.",
  },
  WORKFORCE_INSTITUTIONAL: {
    subject: ({ opportunity }) => `${opportunity.organizationName} - Klinikos workforce and AI training fit`,
    positioning:
      "We are exploring institutional opportunities involving responsible AI, healthcare workforce development, instructor-led training, and governed simulation or operational learning.",
  },
  CUSTOMER_PILOT: {
    subject: ({ opportunity }) => `${opportunity.organizationName} - Klinikos healthcare operations pilot conversation`,
    positioning:
      "We are speaking with healthcare organizations about operational problems where fragmented follow-up, coordination, workflow state, or disconnected systems create avoidable work and lost capacity.",
  },
  ACCELERATOR_FIT: {
    subject: ({ opportunity }) => `${opportunity.organizationName} - Klinikos program fit`,
    positioning:
      "We are evaluating accelerator and commercialization programs where healthcare AI, operations, interoperability, workforce, and enterprise execution are a direct thesis match.",
  },
  INVESTOR_THESIS_FIT: {
    subject: ({ opportunity }) => `${opportunity.organizationName} - Klinikos healthcare operating network`,
    positioning:
      "We are beginning focused conversations with investors whose current thesis includes digital health, healthcare infrastructure, vertical AI, enterprise software, or network businesses.",
  },
  LENDER_PRESCREEN: {
    subject: ({ opportunity }) => `${opportunity.organizationName} - Klinikos startup working-capital pre-screen`,
    positioning:
      "Before completing a full financing application or authorizing credit, we want to confirm whether the current product and company stage fits your startup or early-stage underwriting criteria.",
  },
  PARTNERSHIP_TEAMING: {
    subject: ({ opportunity }) => `${opportunity.organizationName} - Klinikos strategic teaming inquiry`,
    positioning:
      "We are evaluating a focused strategic relationship where complementary capabilities, distribution, implementation, or public-sector teaming could create value without overstating either party's current commitments.",
  },
  REFERRAL_FOLLOW_UP: {
    subject: ({ opportunity }) => `${opportunity.organizationName} - referred Klinikos follow-up`,
    positioning:
      "We were routed to you because your role appears closer to the relevant decision or program path, and we want to make the next step as specific and efficient as possible.",
  },
  RESPONSE_REQUESTED_INFORMATION: {
    subject: ({ opportunity }) => `${opportunity.organizationName} - requested Klinikos information`,
    positioning:
      "Thank you for the response. We are providing the requested non-confidential company context and keeping current facts separate from roadmap or future-state vision.",
  },
};

function required(value: string, label: string) {
  const normalized = value.trim();
  if (!normalized) throw new Error(`Symphony email requires ${label}.`);
  return normalized;
}

function validateVerifiedFacts(profile: SymphonyCompanyProfile) {
  for (const fact of profile.verifiedFacts as Array<{ text: string; truthClass: string }>) {
    if (fact.truthClass !== "CURRENT_FACT" && fact.truthClass !== "EXECUTED") {
      throw new Error("Symphony verified facts may contain only CURRENT_FACT or EXECUTED evidence.");
    }
    if (!fact.text.trim()) throw new Error("Symphony verified facts cannot contain an empty fact.");
  }
}

function formatRecipient(opportunity: SymphonyOpportunity) {
  const name = opportunity.recipientName?.trim();
  return name ? `Hello ${name},` : "Hello,";
}

export function buildSymphonyEmail(input: SymphonyEmailBuildInput): OutboundMessage {
  const { opportunity, profile } = input;
  const to = required(opportunity.recipientEmail, "a recipient email");
  const ask = required(opportunity.ask, "one specific ask");
  const companyName = required(profile.companyName, "a company name");
  const summary = required(profile.summary, "a verified-safe company summary");
  const website = required(profile.website, "a company website");
  const senderName = required(profile.senderName, "a sender name");
  const senderTitle = required(profile.senderTitle, "a sender title");

  if (!to.includes("@")) throw new Error("Symphony email requires a valid professional email address.");
  validateVerifiedFacts(profile);

  const copy = familyCopy[opportunity.messageFamily];
  const factBlock = profile.verifiedFacts.length
    ? `\n\nCurrent verified context:\n${profile.verifiedFacts.map((fact) => `- ${fact.text}`).join("\n")}`
    : "";
  const visionBlock = profile.visionStatements.length
    ? `\n\nLonger-term direction: ${profile.visionStatements.join(" ")}`
    : "";

  const body = [
    formatRecipient(opportunity),
    "",
    `I am reaching out on behalf of ${companyName}. ${summary}`,
    "",
    copy.positioning,
    factBlock,
    visionBlock,
    "",
    ask,
    "",
    `Website: ${website}`,
    "",
    "Thank you,",
    senderName,
    senderTitle,
    companyName,
  ]
    .filter((line) => line !== undefined)
    .join("\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();

  return {
    channel: "email",
    to,
    subject: copy.subject(input),
    body,
  };
}

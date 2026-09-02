import "server-only";

import type { OutboundMessage } from "@/lib/communications/outbound";
import type {
  SymphonyMessageFamily,
  SymphonyOpportunity,
  SymphonyTruthClass,
} from "@/lib/company/symphony-opportunity-types";

export type SymphonyEvidenceTruthClass = SymphonyTruthClass;

export type SymphonyExternalUseEvidence = {
  evidenceId: string;
  approvedByActorId: string;
  approvedAt: Date;
  purpose: string;
  expiresAt: Date;
  revokedAt: Date | null;
};

export type SymphonyVerifiedFact = {
  evidenceId: string;
  sourceReference: string;
  text: string;
  truthClass: SymphonyEvidenceTruthClass;
  observedAt: Date;
  verifiedAt: Date;
  reviewAfter: Date;
  expiresAt: Date;
  approvedForExternalUse: SymphonyExternalUseEvidence;
};

export type SymphonyDisclosureReview = {
  evidenceId: string;
  classification: "PUBLIC" | "CONFIDENTIAL_APPROVED" | "RESTRICTED_PII" | "PHI" | "CROWN_JEWEL";
  minimumNecessary: boolean;
  purpose: string;
  reviewedByActorId: string;
  reviewedAt: Date;
  reviewAfter: Date;
  expiresAt: Date;
  revokedAt: Date | null;
};

export type SymphonyCompanyProfile = {
  companyName: string;
  senderName: string;
  senderTitle: string;
  website: string;
  summary: string;
  verifiedFacts: SymphonyVerifiedFact[];
  visionStatements: string[];
  disclosureReview: SymphonyDisclosureReview;
};
export type SymphonyEmailBuildInput = { opportunity: SymphonyOpportunity; profile: SymphonyCompanyProfile; now: Date };

type FamilyCopy = {
  subject: (input: SymphonyEmailBuildInput) => string;
  positioning: string;
};

const familyCopy: Record<SymphonyMessageFamily, FamilyCopy> = {
  FUNDING_PROGRAM_ROUTING: {
    subject: ({ opportunity }) => `${opportunity.organizationName} - Klinikos funding/program fit inquiry`,
    positioning: "We are identifying the strongest non-dilutive, commercialization, and program routes that match our current healthcare technology work before investing time in a full application.",
  },
  GOVERNMENT_PROCUREMENT: {
    subject: ({ opportunity }) => `${opportunity.organizationName} - Klinikos healthcare technology opportunity inquiry`,
    positioning: "We are looking for legitimate opportunities to participate as a healthcare technology, implementation, AI/workforce, or modernization vendor where our current capabilities fit the public need.",
  },
  WORKFORCE_INSTITUTIONAL: {
    subject: ({ opportunity }) => `${opportunity.organizationName} - Klinikos workforce and AI training fit`,
    positioning: "We are exploring institutional opportunities involving responsible AI, healthcare workforce development, instructor-led training, and governed simulation or operational learning.",
  },
  CUSTOMER_PILOT: {
    subject: ({ opportunity }) => `${opportunity.organizationName} - Klinikos healthcare operations pilot conversation`,
    positioning: "We are speaking with healthcare organizations about operational problems where fragmented follow-up, coordination, workflow state, or disconnected systems create avoidable work and lost capacity.",
  },
  ACCELERATOR_FIT: {
    subject: ({ opportunity }) => `${opportunity.organizationName} - Klinikos program fit`,
    positioning: "We are evaluating accelerator and commercialization programs where healthcare AI, operations, interoperability, workforce, and enterprise execution are a direct thesis match.",
  },
  INVESTOR_THESIS_FIT: {
    subject: ({ opportunity }) => `${opportunity.organizationName} - Klinikos healthcare operating network`,
    positioning: "We are beginning focused conversations with investors whose current thesis includes digital health, healthcare infrastructure, vertical AI, enterprise software, or network businesses.",
  },
  LENDER_PRESCREEN: {
    subject: ({ opportunity }) => `${opportunity.organizationName} - Klinikos startup working-capital pre-screen`,
    positioning: "Before completing a full financing application or authorizing credit, we want to confirm whether the current product and company stage fits your startup or early-stage underwriting criteria.",
  },
  PARTNERSHIP_TEAMING: {
    subject: ({ opportunity }) => `${opportunity.organizationName} - Klinikos strategic teaming inquiry`,
    positioning: "We are evaluating a focused strategic relationship where complementary capabilities, distribution, implementation, or public-sector teaming could create value without overstating either party's current commitments.",
  },
  REFERRAL_FOLLOW_UP: {
    subject: ({ opportunity }) => `${opportunity.organizationName} - referred Klinikos follow-up`,
    positioning: "We were routed to you because your role appears closer to the relevant decision or program path, and we want to make the next step as specific and efficient as possible.",
  },
  RESPONSE_REQUESTED_INFORMATION: {
    subject: ({ opportunity }) => `${opportunity.organizationName} - requested Klinikos information`,
    positioning: "Thank you for the response. We are providing the requested non-confidential company context and keeping current facts separate from roadmap or future-state vision.",
  },
};

function required(value: string, label: string) {
  const normalized = value.trim();
  if (!normalized) throw new Error(`Symphony email requires ${label}.`);
  return normalized;
}

function safeHeaderValue(value: string, label: string) {
  const normalized = required(value, label);
  if (/[\u0000-\u001F\u007F]/.test(normalized)) throw new Error(`Symphony email rejects control characters in ${label}.`);
  return normalized;
}

function validDate(value: Date, label: string) {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error(`Symphony email requires ${label}.`);
  return value.getTime();
}

function validateDisclosureReview(input: SymphonyEmailBuildInput) {
  const { disclosureReview } = input.profile;
  const now = input.now.getTime();
  required(disclosureReview.evidenceId, "disclosure-review evidence");
  required(disclosureReview.reviewedByActorId, "a disclosure reviewer");
  if (disclosureReview.classification === "PHI" || disclosureReview.classification === "CROWN_JEWEL") {
    throw new Error("Symphony external email denies PHI and crown-jewel disclosure classes.");
  }
  if (disclosureReview.classification === "RESTRICTED_PII") {
    throw new Error("Symphony external email denies restricted PII in this execution foundation.");
  }
  if (!disclosureReview.minimumNecessary) {
    throw new Error("Symphony external email requires a minimum necessary disclosure review.");
  }
  if (disclosureReview.purpose.trim() !== input.opportunity.purpose.trim()) {
    throw new Error("Symphony disclosure approval is not scoped to this outreach purpose.");
  }
  if (disclosureReview.revokedAt) throw new Error("Symphony disclosure approval has been revoked.");
  if (validDate(disclosureReview.reviewedAt, "a disclosure review timestamp") > now) {
    throw new Error("Symphony disclosure review cannot be future-dated.");
  }
  if (validDate(disclosureReview.reviewAfter, "a disclosure review date") <= now) {
    throw new Error("Symphony disclosure review is stale and requires review.");
  }
  if (validDate(disclosureReview.expiresAt, "a disclosure expiry") <= now) {
    throw new Error("Symphony disclosure approval has expired.");
  }
}

function validateVerifiedFacts(input: SymphonyEmailBuildInput) {
  const now = input.now.getTime();
  for (const fact of input.profile.verifiedFacts) {
    required(fact.evidenceId, "verified-fact evidence");
    required(fact.sourceReference, "a verified-fact source reference");
    required(fact.text, "a verified fact");
    if (fact.truthClass !== "ACTUAL" && fact.truthClass !== "CONTRACTED") {
      throw new Error("Symphony verified facts may contain only ACTUAL or CONTRACTED evidence.");
    }
    const observedAt = validDate(fact.observedAt, "a fact observation date");
    const verifiedAt = validDate(fact.verifiedAt, "a fact verification date");
    if (observedAt > verifiedAt || verifiedAt > now) {
      throw new Error("Symphony verified-fact dates are not chronologically valid.");
    }
    if (validDate(fact.reviewAfter, "a fact review date") <= now) {
      throw new Error("Symphony verified fact is stale and requires review.");
    }
    if (validDate(fact.expiresAt, "a fact expiry") <= now) {
      throw new Error("Symphony verified fact has expired.");
    }
    const approval = fact.approvedForExternalUse;
    required(approval.evidenceId, "external-use approval evidence");
    required(approval.approvedByActorId, "an external-use approver");
    if (approval.purpose.trim() !== input.opportunity.purpose.trim()) {
      throw new Error("Symphony fact external-use approval is not scoped to this outreach purpose.");
    }
    if (approval.revokedAt) throw new Error("Symphony fact external-use approval has been revoked.");
    if (validDate(approval.approvedAt, "an external-use approval timestamp") > now) {
      throw new Error("Symphony fact external-use approval cannot be future-dated.");
    }
    if (approval.approvedAt.getTime() < verifiedAt) {
      throw new Error("Symphony fact external-use approval cannot predate fact verification.");
    }
    if (validDate(approval.expiresAt, "an external-use approval expiry") <= now) {
      throw new Error("Symphony fact external-use approval has expired.");
    }
  }
}

export function buildSymphonyEmail(input: SymphonyEmailBuildInput): OutboundMessage {
  const { opportunity, profile } = input;
  validDate(input.now, "a current evidence-evaluation time");
  const to = safeHeaderValue(opportunity.recipientEmail, "the recipient email");
  const ask = required(opportunity.ask, "one specific ask");
  safeHeaderValue(opportunity.organizationName, "the organization name used in the subject");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) throw new Error("Symphony email requires a valid professional recipient email address.");
  validateDisclosureReview(input);
  validateVerifiedFacts(input);

  const copy = familyCopy[opportunity.messageFamily];
  const subject = safeHeaderValue(copy.subject(input), "the email subject");
  const facts = profile.verifiedFacts.length ? `\n\nCurrent verified context:\n${profile.verifiedFacts.map((fact) => `- ${fact.text}`).join("\n")}` : "";
  const vision = profile.visionStatements.length ? `\n\nLonger-term direction: ${profile.visionStatements.join(" ")}` : "";
  const body = [
    opportunity.recipientName?.trim() ? `Hello ${opportunity.recipientName.trim()},` : "Hello,",
    "",
    `I am reaching out on behalf of ${required(profile.companyName, "a company name")}. ${required(profile.summary, "a verified-safe company summary")}`,
    "",
    copy.positioning,
    facts,
    vision,
    "",
    ask,
    "",
    `Website: ${required(profile.website, "a company website")}`,
    "",
    "Thank you,",
    required(profile.senderName, "a sender name"),
    required(profile.senderTitle, "a sender title"),
    required(profile.companyName, "a company name"),
  ].join("\n").replace(/\n{4,}/g, "\n\n\n").trim();
  return { channel: "email", to, subject, body };
}

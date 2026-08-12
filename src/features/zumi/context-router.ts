import type { ZumiConversationPolicy } from "@/features/zumi/conversation-policy";

export const zumiContextDomains = [
  "canon",
  "product_status",
  "grid",
  "clinic_operations",
  "clinical_workflows",
  "commercial",
  "sales",
  "education",
  "integrations",
  "security",
  "compliance",
  "engineering",
  "user_context",
  "public_web",
] as const;

export type ZumiContextDomain = (typeof zumiContextDomains)[number];

export type ZumiContextPlan = {
  domains: ZumiContextDomain[];
  includeInternalDocs: boolean;
  includeOrganizationData: boolean;
  includePatientData: boolean;
  includeUserContext: boolean;
  usePublicWeb: boolean;
  reasons: string[];
};

const patterns: readonly [ZumiContextDomain, RegExp][] = [
  ["grid", /\b(grid|marketplace|provider network|resource|demand|match|booking|room|chair|shift|contractor|availability|payout)\b/i],
  ["clinic_operations", /\b(clinic|front desk|follow[- ]?up|task|paperwork|scheduling|appointment|workflow|operations|owner dashboard|command center)\b/i],
  ["clinical_workflows", /\b(patient|clinical|encounter|note|lab|imaging|medication|referral|result|care plan|procedure)\b/i],
  ["commercial", /\b(price|pricing|cost|margin|subscription|setup fee|pilot|payment|revenue|monetization|business model|godaddy)\b/i],
  ["sales", /\b(sales|prospect|lead|pitch|proposal|founding clinic|customer acquisition|close|commission)\b/i],
  ["education", /\b(student|school|college|university|preceptor|placement|training|education|curriculum)\b/i],
  ["integrations", /\b(api|integration|connector|twilio|stripe|stedi|labcorp|quest|google|mcp|webhook|fhir|hl7)\b/i],
  ["security", /\b(security|cyber|attack|breach|zero trust|authorization|authentication|session|rate limit|csrf|xss|audit|encryption|incident)\b/i],
  ["compliance", /\b(hipaa|compliance|baa|privacy|retention|risk analysis|legal|license|credential|malpractice)\b/i],
  ["engineering", /\b(code|repository|github|database|prisma|typescript|next\.js|architecture|deploy|build|test|ci|bug)\b/i],
];

const CURRENTNESS = /\b(today|current|latest|recent|now|new rule|new law|price|availability|version|release|update|news|verify|look up|search)\b/i;

/**
 * Decide what *kind* of context Zumi should retrieve before answering. This module
 * deliberately returns a plan rather than loading data itself: every loader still has
 * to enforce its own tenant/RBAC/privacy boundary.
 */
export function planZumiContext(question: string, policy: ZumiConversationPolicy): ZumiContextPlan {
  const domains = new Set<ZumiContextDomain>(["canon"]);
  const reasons: string[] = ["canonical product truth is always relevant"];

  for (const [domain, pattern] of patterns) {
    if (!pattern.test(question)) continue;
    domains.add(domain);
    reasons.push(`question matched ${domain}`);
  }

  // When a question is product-specific but does not classify cleanly, current status
  // prevents historical plans from being presented as present-tense implementation.
  if (domains.size > 1 || /\b(klinikos|zumi)\b/i.test(question)) domains.add("product_status");

  const usePublicWeb = policy.publicResearchAllowed && CURRENTNESS.test(question);
  if (usePublicWeb) {
    domains.add("public_web");
    reasons.push("currentness or explicit verification requires live public evidence");
  }

  const includeInternalDocs = policy.internalStrategyAllowed || policy.productArchitectureAllowed || policy.commercialStrategyAllowed;
  const includeUserContext = policy.profile === "founder";
  if (includeUserContext) {
    domains.add("user_context");
    reasons.push("authenticated founder profile may use founder-specific context subject to source access");
  }

  return {
    domains: [...domains],
    includeInternalDocs,
    includeOrganizationData: policy.organizationDataAllowed,
    includePatientData: policy.patientDataAllowed,
    includeUserContext,
    usePublicWeb,
    reasons,
  };
}

import { companyMetricRegistry } from "@/lib/company-operating-canon";
import {
  companyTruthClasses,
  type CompanyTruthClass,
} from "@/lib/company/company-truth";

export { companyTruthClasses };
export type { CompanyTruthClass };

export type CompanyRegisterDefinition = {
  id: string;
  label: string;
  ownerFunctionId: string;
  purpose: string;
  requiredFields: readonly string[];
};

export type CompanyStageDefinition = {
  id:
    | "truth-foundation"
    | "cash-proof"
    | "repeatable-value"
    | "network-proof"
    | "enterprise-proof"
    | "platform-scale";
  order: number;
  label: string;
  objective: string;
  entryEvidence: readonly string[];
  exitEvidence: readonly string[];
  evidenceMetricIds: readonly string[];
  allowedClaims: readonly string[];
  forbiddenShortcuts: readonly string[];
};

export type CompanyRevenueEngineDefinition = {
  id: string;
  label: string;
  buyerClasses: readonly string[];
  ownerFunctionId: string;
  monetizationClasses: readonly string[];
  proofRequirements: readonly string[];
  connectedCompanyLoopStages: readonly string[];
};

export type CompanyDecisionClassDefinition = {
  id: "routine-reversible" | "material-reversible" | "material-irreversible" | "non-delegable";
  label: string;
  approvalRule: string;
  requiredRegisters: readonly string[];
};

export type ZumiCompanyAuthorityDefinition = {
  id: "L0" | "L1" | "L2" | "L3" | "L4" | "L5";
  label: string;
  rule: string;
  examples: readonly string[];
};

const sharedRegisterFields = [
  "source",
  "sourceDate",
  "owner",
  "truthClass",
  "evidenceLocation",
  "status",
  "nextAction",
  "nextActionOwner",
  "reviewDate",
  "supersessionState",
] as const;

function companyRegister(
  id: string,
  label: string,
  ownerFunctionId: string,
  purpose: string,
  extraFields: readonly string[] = [],
): CompanyRegisterDefinition {
  return {
    id,
    label,
    ownerFunctionId,
    purpose,
    requiredFields: [...sharedRegisterFields, ...extraFields],
  };
}

export const companyRegisterRegistry: readonly CompanyRegisterDefinition[] = [
  companyRegister("customer-prospect", "Customer / Prospect", "sales-commercial", "Preserve buyer, organization, problem, qualification, commercial stage, customer state, and next-action truth.", ["organization", "buyer", "problem", "commercialStage"]),
  companyRegister("offer-pricing", "Offer / Pricing", "sales-commercial", "Preserve approved commercial scope, price, seller, buyer class, entitlement, effective dates, and approval source.", ["offerId", "sellerEntity", "buyerClass", "price", "currency", "entitlements"]),
  companyRegister("contract", "Contract", "legal-corporate-governance", "Preserve executed and proposed agreement state without confusing draft terms with binding commitments.", ["agreementType", "counterparty", "version", "signatureState", "effectiveDate"]),
  companyRegister("vendor-subprocessor", "Vendor / Subprocessor", "security-privacy-trust", "Track vendor purpose, cost, data access, contract, security, BAA/DPA state, integration state, renewal, concentration, and exit path.", ["vendor", "purpose", "cost", "renewalDate", "dataClasses", "securityReviewState", "exitPath"]),
  companyRegister("capital-opportunity", "Capital Opportunity", "finance-treasury", "Track customer, non-dilutive, debt, venture, and strategic capital separately with timing, terms, evidence, use, and probability.", ["capitalClass", "amount", "useOfFunds", "decisionTiming", "repaymentOrDilution"]),
  companyRegister("lender-readiness", "Lender Readiness", "finance-treasury", "Track the documentary and repayment evidence needed for debt underwriting.", ["lender", "product", "amountRequested", "repaymentEvidence", "guaranteeRequirement"]),
  companyRegister("investor-evidence", "Investor Evidence", "executive-strategy", "Track the evidence supporting market, product, traction, economics, moat, security, team, roadmap, and use-of-funds claims.", ["claim", "claimClass", "supportingEvidence", "dataRoomLocation"]),
  companyRegister("company-risk", "Company Risk", "executive-strategy", "Track company risks with severity, likelihood, mitigation, owner, evidence, and trigger for escalation.", ["riskCategory", "severity", "likelihood", "mitigation", "escalationTrigger"]),
  companyRegister("decision", "Decision", "executive-strategy", "Preserve consequential company decisions, assumptions, alternatives, reversibility, approval, outcome, and review trigger.", ["question", "facts", "assumptions", "options", "decisionClass", "decision", "reversibility"]),
  companyRegister("hiring-bottleneck", "Hiring / Bottleneck", "executive-strategy", "Require a defined bottleneck, expected leverage, cost, 90-day deliverables, and success metric before headcount is approved.", ["bottleneck", "role", "cost", "ninetyDayDeliverables", "successMetric"]),
  companyRegister("partnership", "Partnership", "partnerships-corporate-development", "Track distribution, integration, regulatory, credibility, customer-value, and economic leverage expected from a strategic relationship.", ["partner", "partnerType", "strategicValue", "commercialModel", "dependency"]),
  companyRegister("build-buy-partner", "Build / Buy / Partner", "partnerships-corporate-development", "Compare build, buy, partner, license, invest, acquire, ignore, or defer using customer value, capital, speed, margin, control, and regulatory evidence.", ["capability", "options", "recommendedPath", "buildCost", "externalCost", "strategicControl"]),
  companyRegister("customer-value-evidence", "Customer Value Evidence", "implementation-customer-success", "Preserve potential, estimated, verified, and realized customer-value evidence without collapsing them into one ROI claim.", ["customer", "valueClass", "valueMetric", "baseline", "observedValue", "measurementMethod"]),
  companyRegister("grid-liquidity", "Grid Liquidity", "grid-marketplace-operations", "Track demand, eligible supply, matches, time-to-match, fulfillment, repeat behavior, and economics by market cell.", ["resourceType", "geography", "timeWindow", "eligibilityClass", "demandCount", "eligibleSupplyCount", "fulfilledCount"]),
  companyRegister("edu-institutional-pipeline", "EDU Institutional Pipeline", "edu-workforce", "Track institutional buyer, workforce need, program scope, procurement stage, contract value, delivery evidence, and renewal path.", ["institution", "workforceNeed", "programScope", "procurementStage", "contractValue"]),
  companyRegister("security-assurance", "Security / Assurance Evidence", "security-privacy-trust", "Track security, privacy, backup, restore, incident, vulnerability, access-control, vendor, and enterprise-assurance evidence.", ["control", "controlState", "evidenceDate", "testMethod", "remediationOwner"]),
  companyRegister("integration-truth", "Integration Truth", "engineering-platform", "Track every external connection by lifecycle state, authority, data flow, reliability, reconciliation, failure handling, and production evidence.", ["integration", "lifecycleState", "authority", "dataFlow", "failureMode", "productionEvidence"]),
  companyRegister("corporate-governance", "Corporate Governance Evidence", "legal-corporate-governance", "Track entity, officer, board, capitalization, IP assignment, filing, election, and intercompany evidence without asserting proposals as executed facts.", ["entity", "governanceType", "effectiveState", "filingOrAgreement", "executedBy"]),
] as const;

export const companyStageRegistry: readonly CompanyStageDefinition[] = [
  {
    id: "truth-foundation",
    order: 0,
    label: "Truth Foundation",
    objective: "Establish reliable corporate, product, production, payment, security, pricing, and evidence truth before scaling claims or irreversible commitments.",
    entryEvidence: ["current repository baseline", "current corporate evidence inventory", "current commercial offer evidence"],
    exitEvidence: ["authoritative company registers exist", "critical public/product claims can be traced to evidence", "production and payment truth are distinguishable from planned state"],
    evidenceMetricIds: ["cash-received", "processor-balance", "security-incidents", "uptime"],
    allowedClaims: ["what is currently built or verified", "what is proposed with explicit labeling", "what has actually been executed"],
    forbiddenShortcuts: ["presenting planned controls as implemented", "presenting pipeline as revenue", "presenting design intent as production capability"],
  },
  {
    id: "cash-proof",
    order: 1,
    label: "Cash Proof",
    objective: "Prove that a real buyer will pay Klinikos or the applicable seller entity for a defined problem and supported delivery path.",
    entryEvidence: ["truth foundation established", "approved offer exists", "real buyer problem and next action exist"],
    exitEvidence: ["verified customer payment or executed customer contract", "delivery obligation is tracked", "first-value target is defined"],
    evidenceMetricIds: ["cash-received", "new-customers", "qualified-pipeline", "capital-secured"],
    allowedClaims: ["verified paid customer or executed customer contract when evidence exists", "current paid offer performance from actual transactions"],
    forbiddenShortcuts: ["counting internal/test payments as customer proof", "counting verbal interest as contracted value", "counting proposal value as cash"],
  },
  {
    id: "repeatable-value",
    order: 2,
    label: "Repeatable Value",
    objective: "Prove repeatable activation, first value, recurring value, retention, and improving economics across multiple customers or cohorts.",
    entryEvidence: ["customer cash proof", "supported implementation path", "defined first-value event"],
    exitEvidence: ["multiple customers or cohorts reach first value", "repeat-value evidence exists", "retention/expansion evidence is measurable", "gross-margin drivers are understood"],
    evidenceMetricIds: ["mrr", "arr", "activation-rate", "time-to-first-value", "customer-retention", "expansion-revenue", "gross-margin", "customer-value-evidence"],
    allowedClaims: ["recurring revenue from active paying customers", "verified time-to-value and retention when cohort evidence exists", "customer value with explicit evidence classification"],
    forbiddenShortcuts: ["annualizing non-recurring implementation revenue into ARR", "claiming retention before a meaningful renewal window", "claiming realized ROI from modeled savings"],
  },
  {
    id: "network-proof",
    order: 3,
    label: "Network Proof",
    objective: "Prove repeatable supply-demand liquidity, fulfillment, relationship formation, and workforce/network compounding in defined Grid or EDU market cells.",
    entryEvidence: ["repeatable customer value exists", "at least one defined market cell has real demand and supply", "eligibility and fulfillment rules are governed"],
    exitEvidence: ["repeat Grid fulfillment occurs", "time-to-match and repeat behavior are measurable", "EDU or professional opportunity outcomes connect to real demand where applicable"],
    evidenceMetricIds: ["grid-liquidity", "grid-fulfillment", "professional-opportunity-outcomes", "edu-contract-value", "economic-flow"],
    allowedClaims: ["liquidity only for measured market cells", "verified fulfillment outcomes", "institutional EDU outcomes supported by contract/delivery evidence"],
    forbiddenShortcuts: ["using listing count as liquidity", "claiming network effects from signups alone", "claiming placement outcomes without verified outcomes"],
  },
  {
    id: "enterprise-proof",
    order: 4,
    label: "Enterprise Proof",
    objective: "Prove Klinikos can survive serious procurement, security, integration, implementation, support, and multi-location requirements.",
    entryEvidence: ["repeatable product value exists", "enterprise buyer requirements are documented", "security and integration truth are current"],
    exitEvidence: ["executed enterprise contract or equivalent procurement proof", "enterprise implementation path is repeatable", "security/integration/support evidence survives buyer review"],
    evidenceMetricIds: ["arr", "qualified-pipeline", "uptime", "integration-reliability", "security-incidents", "customer-retention"],
    allowedClaims: ["enterprise capability only where procurement and production evidence support it", "verified SLA or integration behavior only from measured evidence"],
    forbiddenShortcuts: ["calling SSO or an enterprise page enterprise readiness", "claiming SOC 2 or other assurance not obtained", "calling sandbox connectivity production interoperability"],
  },
  {
    id: "platform-scale",
    order: 5,
    label: "Platform Scale",
    objective: "Scale Klinikos as a multi-engine healthcare operating network with durable recurring revenue, network effects, enterprise adoption, partner leverage, and large economic flow.",
    entryEvidence: ["enterprise proof exists", "repeatable revenue and retention are measurable", "network/partner loops create incremental distribution or value"],
    exitEvidence: ["multiple revenue engines operate with governed economics", "large-scale reliability and security evidence exist", "economic flow is measured separately from revenue", "capital allocation is supported by repeatable unit economics"],
    evidenceMetricIds: ["arr", "gross-margin", "customer-retention", "expansion-revenue", "grid-fulfillment", "uptime", "integration-reliability", "economic-flow", "capital-secured"],
    allowedClaims: ["platform scale only from current revenue, customer, network, enterprise, reliability, and economic-flow evidence"],
    forbiddenShortcuts: ["using total healthcare market size as company traction", "treating economic flow as revenue", "treating a financing valuation as operating performance"],
  },
] as const;

export const companyRevenueEngineRegistry: readonly CompanyRevenueEngineDefinition[] = [
  {
    id: "paid-analysis",
    label: "Paid Analysis / Diagnostic",
    buyerClasses: ["clinic", "medical_group", "healthcare_organization"],
    ownerFunctionId: "sales-commercial",
    monetizationClasses: ["one-time-service"],
    proofRequirements: ["approved offer", "verified payment or contract", "defined deliverable", "delivery evidence"],
    connectedCompanyLoopStages: ["SELL", "CONTRACT", "COLLECT", "IMPLEMENT", "FIRST_VALUE"],
  },
  {
    id: "implementation",
    label: "Implementation / Migration",
    buyerClasses: ["clinic", "medical_group", "enterprise"],
    ownerFunctionId: "implementation-customer-success",
    monetizationClasses: ["professional-services", "project-fee"],
    proofRequirements: ["executed scope", "implementation plan", "customer obligations", "go-live evidence", "first-value target"],
    connectedCompanyLoopStages: ["CONTRACT", "COLLECT", "IMPLEMENT", "ACTIVATE", "FIRST_VALUE"],
  },
  {
    id: "care-subscription",
    label: "Care / Clinic OS Subscription",
    buyerClasses: ["clinic", "specialty_practice", "medical_group"],
    ownerFunctionId: "product",
    monetizationClasses: ["subscription", "location-based", "seat-or-usage-as-approved"],
    proofRequirements: ["active paying customer", "entitlement evidence", "activation", "repeat product value", "retention measurement"],
    connectedCompanyLoopStages: ["COLLECT", "ACTIVATE", "FIRST_VALUE", "REPEATED_VALUE", "RETAIN", "EXPAND"],
  },
  {
    id: "zumi-intelligence",
    label: "Zumi Intelligence / Automation",
    buyerClasses: ["clinic", "enterprise", "professional"],
    ownerFunctionId: "product",
    monetizationClasses: ["included-allowance", "premium-automation", "usage"],
    proofRequirements: ["measured customer task value", "bounded variable cost", "governed autonomy", "human authority preserved"],
    connectedCompanyLoopStages: ["FIRST_VALUE", "REPEATED_VALUE", "RETAIN", "EXPAND"],
  },
  {
    id: "revenue-os",
    label: "Revenue OS",
    buyerClasses: ["clinic", "medical_group", "enterprise"],
    ownerFunctionId: "revenue-cycle-payer",
    monetizationClasses: ["subscription", "add-on", "services-as-approved"],
    proofRequirements: ["revenue-state truth", "supported coding/claim evidence", "verified workflow value", "no unsupported recovered-revenue claims"],
    connectedCompanyLoopStages: ["FIRST_VALUE", "REPEATED_VALUE", "RETAIN", "EXPAND"],
  },
  {
    id: "grid",
    label: "Grid",
    buyerClasses: ["organization", "professional", "vendor", "institution"],
    ownerFunctionId: "grid-marketplace-operations",
    monetizationClasses: ["organization-subscription", "campaign", "premium-tools", "lawful-transaction-economics"],
    proofRequirements: ["real demand", "eligible supply", "fulfillment evidence", "category-specific legal/economic gate", "liquidity measurement"],
    connectedCompanyLoopStages: ["DISCOVER", "ACTIVATE", "GRID_NETWORK", "COMPOUND"],
  },
  {
    id: "edu",
    label: "EDU / Workforce",
    buyerClasses: ["workforce_board", "school", "employer", "healthcare_organization", "government"],
    ownerFunctionId: "edu-workforce",
    monetizationClasses: ["institutional-contract", "cohort-contract", "program-services"],
    proofRequirements: ["executed buyer agreement", "delivery evidence", "completion evidence", "workforce outcome measurement where promised"],
    connectedCompanyLoopStages: ["SELL", "CONTRACT", "COLLECT", "IMPLEMENT", "GRID_NETWORK", "COMPOUND"],
  },
  {
    id: "enterprise",
    label: "Enterprise",
    buyerClasses: ["health_system", "multi_location_group", "payer", "large_employer", "government"],
    ownerFunctionId: "enterprise-procurement",
    monetizationClasses: ["annual-contract", "implementation", "premium-support", "integration"],
    proofRequirements: ["executed enterprise agreement", "procurement evidence", "security evidence", "implementation plan", "production support model"],
    connectedCompanyLoopStages: ["SELL", "CONTRACT", "COLLECT", "IMPLEMENT", "RETAIN", "EXPAND"],
  },
  {
    id: "integration-api",
    label: "Integration / API",
    buyerClasses: ["enterprise", "partner", "developer", "vendor"],
    ownerFunctionId: "engineering-platform",
    monetizationClasses: ["integration-fee", "usage", "platform-access"],
    proofRequirements: ["versioned API/integration contract", "security model", "reliability evidence", "customer/partner demand"],
    connectedCompanyLoopStages: ["IMPLEMENT", "REPEATED_VALUE", "EXPAND", "COMPOUND"],
  },
  {
    id: "professional-services",
    label: "Professional / Premium Services",
    buyerClasses: ["clinic", "enterprise", "institution", "partner"],
    ownerFunctionId: "implementation-customer-success",
    monetizationClasses: ["project-fee", "retainer", "premium-support"],
    proofRequirements: ["defined scope", "delivery owner", "cost/margin understanding", "customer outcome"],
    connectedCompanyLoopStages: ["SELL", "COLLECT", "IMPLEMENT", "FIRST_VALUE", "RETAIN"],
  },
  {
    id: "payer-employer",
    label: "Payer / Employer Products",
    buyerClasses: ["payer", "risk_bearing_group", "self_insured_employer"],
    ownerFunctionId: "revenue-cycle-payer",
    monetizationClasses: ["enterprise-contract", "platform-license", "services-as-approved"],
    proofRequirements: ["buyer-specific workflow value", "validated data/quality definitions", "privacy/regulatory review", "enterprise integration evidence"],
    connectedCompanyLoopStages: ["SELL", "CONTRACT", "IMPLEMENT", "REPEATED_VALUE", "EXPAND", "COMPOUND"],
  },
] as const;

export const companyDecisionClassRegistry: readonly CompanyDecisionClassDefinition[] = [
  {
    id: "routine-reversible",
    label: "Routine reversible",
    approvalRule: "May be executed by the accountable function or authorized Zumi workflow when policy allows and rollback is straightforward.",
    requiredRegisters: ["decision"],
  },
  {
    id: "material-reversible",
    label: "Material reversible",
    approvalRule: "Requires accountable executive review, documented evidence, affected-register updates, and an explicit rollback or review trigger.",
    requiredRegisters: ["decision", "company-risk"],
  },
  {
    id: "material-irreversible",
    label: "Material irreversible",
    approvalRule: "Requires executive review gauntlet, legal/financial/security review as applicable, explicit human approval, and executed evidence before external commitment.",
    requiredRegisters: ["decision", "company-risk", "contract", "corporate-governance"],
  },
  {
    id: "non-delegable",
    label: "Non-delegable",
    approvalRule: "Must be performed by the legally or professionally authorized human or institution; AI may prepare evidence but cannot supply the missing authority.",
    requiredRegisters: ["decision", "corporate-governance"],
  },
] as const;

export const zumiCompanyAuthorityRegistry: readonly ZumiCompanyAuthorityDefinition[] = [
  {
    id: "L0",
    label: "Observe",
    rule: "Zumi reads authorized company state, evidence, and metrics and explains what is happening without changing state.",
    examples: ["summarize pipeline", "surface cash truth", "identify stale decisions", "report production health"],
  },
  {
    id: "L1",
    label: "Recommend",
    rule: "Zumi recommends next actions, priorities, experiments, follow-ups, or corrections using current evidence and company policy.",
    examples: ["recommend next prospect action", "recommend content update", "recommend vendor review", "recommend capital path"],
  },
  {
    id: "L2",
    label: "Prepare",
    rule: "Zumi prepares governed artifacts or changes for an authorized person to review without creating the external commitment itself.",
    examples: ["draft proposal", "prepare follow-up", "prepare SEO change", "prepare onboarding checklist", "prepare lender package"],
  },
  {
    id: "L3",
    label: "Execute after approval",
    rule: "Zumi executes the approved action after the correct authorized human approves the specific action and policy permits tool execution.",
    examples: ["send approved proposal", "publish approved material page change", "apply approved non-routine CRM change"],
  },
  {
    id: "L4",
    label: "Standing low-risk delegation",
    rule: "Zumi executes pre-authorized, bounded, reversible, low-risk workflows under standing policy with audit, rate limits, monitoring, and rollback.",
    examples: ["routine lead follow-up within consent rules", "broken-link remediation after tests", "stale-metadata correction", "customer onboarding reminders"],
  },
  {
    id: "L5",
    label: "Non-delegable authority",
    rule: "Zumi may research or prepare but cannot create authority the user, organization, professional, patient, or company does not legally possess.",
    examples: [
      "legal signature authority",
      "ownership authority",
      "banking authority",
      "professional clinical authority",
      "patient consent",
      "regulated credential authority",
      "irreversible third-party commitments outside approved policy",
      "unsupported public claims",
    ],
  },
] as const;

export const companyExecutiveBriefContract = {
  sections: [
    "currentTruth",
    "customerAndPipeline",
    "productionAndSecurity",
    "capitalAndRunway",
    "activeStage",
    "highestLeverageBottleneck",
    "nextAction",
    "evidenceNeeded",
  ] as const,
  maxPrimaryActions: 1,
  rule: "Every executive brief must separate current facts from proposals, identify the current company stage, surface the highest-leverage bottleneck, and name exactly one primary next action with the evidence needed to complete it.",
} as const;

/**
 * Import-time assertion for development/test environments: every metric used as company-stage proof
 * must exist in the canonical metric registry and may not be scenario-only.
 */
const metricTruthClassById = new Map(companyMetricRegistry.map((metric) => [metric.id, metric.truthClass]));
for (const stage of companyStageRegistry) {
  for (const metricId of stage.evidenceMetricIds) {
    const truthClass = metricTruthClassById.get(metricId);
    if (!truthClass) {
      throw new Error(`Company stage ${stage.id} references unknown metric ${metricId}.`);
    }
    if (truthClass === "SCENARIO_ONLY") {
      throw new Error(`Company stage ${stage.id} cannot use scenario-only metric ${metricId} as execution proof.`);
    }
  }
}

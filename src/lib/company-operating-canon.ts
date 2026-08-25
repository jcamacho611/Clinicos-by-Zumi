export type CompanyFunctionDefinition = {
  id: string;
  label: string;
  operatingQuestion: string;
  outcomes: readonly string[];
  metricIds: readonly string[];
};

export type CompanyCadenceDefinition = {
  id: "daily" | "weekly" | "monthly" | "quarterly";
  reviewItems: readonly string[];
};

export type CompanyMetricDefinition = {
  id: string;
  label: string;
  truthClass: "CURRENT_FACT_ONLY" | "DERIVED_FROM_CURRENT_FACTS" | "SCENARIO_ONLY";
  description: string;
};

export type CapitalTrackDefinition = {
  id: string;
  label: string;
  bestUse: string;
  primaryRisk: string;
};

export const companyValueLoop = [
  "DISCOVER",
  "SELL",
  "CONTRACT",
  "COLLECT",
  "IMPLEMENT",
  "ACTIVATE",
  "FIRST_VALUE",
  "REPEATED_VALUE",
  "RETAIN",
  "EXPAND",
  "GRID_NETWORK",
  "COMPOUND",
] as const;

export const companyMetricRegistry: readonly CompanyMetricDefinition[] = [
  { id: "cash-received", label: "Cash received", truthClass: "CURRENT_FACT_ONLY", description: "Verified cash actually received by Klinikos or the applicable seller entity." },
  { id: "processor-balance", label: "Processor balance", truthClass: "CURRENT_FACT_ONLY", description: "Verified balance currently held by a payment processor." },
  { id: "booked-revenue", label: "Booked revenue", truthClass: "DERIVED_FROM_CURRENT_FACTS", description: "Accounting revenue recognized from verified transactions under the applicable accounting policy." },
  { id: "mrr", label: "Monthly recurring revenue", truthClass: "DERIVED_FROM_CURRENT_FACTS", description: "Recurring monthly revenue derived only from active paying recurring customers." },
  { id: "arr", label: "Annual recurring revenue", truthClass: "DERIVED_FROM_CURRENT_FACTS", description: "Annualized recurring revenue derived only from active recurring commercial evidence." },
  { id: "implementation-revenue", label: "Implementation revenue", truthClass: "DERIVED_FROM_CURRENT_FACTS", description: "Verified implementation, migration, configuration, or professional-services revenue." },
  { id: "gross-margin", label: "Gross margin", truthClass: "DERIVED_FROM_CURRENT_FACTS", description: "Revenue less directly attributable cost of goods or service delivery, measured from current financial evidence." },
  { id: "qualified-pipeline", label: "Qualified pipeline", truthClass: "DERIVED_FROM_CURRENT_FACTS", description: "Current commercial opportunities that meet documented qualification criteria; not booked revenue." },
  { id: "new-customers", label: "New customers", truthClass: "CURRENT_FACT_ONLY", description: "Organizations or buyers with verified executed commercial activation in the measurement period." },
  { id: "activation-rate", label: "Activation rate", truthClass: "DERIVED_FROM_CURRENT_FACTS", description: "Share of eligible signed or paid customers that reach the defined product activation state." },
  { id: "time-to-first-value", label: "Time to first value", truthClass: "DERIVED_FROM_CURRENT_FACTS", description: "Elapsed time from activation start to the first verified customer-value event." },
  { id: "customer-retention", label: "Customer retention", truthClass: "DERIVED_FROM_CURRENT_FACTS", description: "Retention measured from actual customer cohorts and renewal/cancellation evidence." },
  { id: "expansion-revenue", label: "Expansion revenue", truthClass: "DERIVED_FROM_CURRENT_FACTS", description: "Verified incremental recurring or contracted revenue from existing customers." },
  { id: "support-burden", label: "Support burden", truthClass: "DERIVED_FROM_CURRENT_FACTS", description: "Support effort per customer, workflow, or revenue unit using actual support activity." },
  { id: "customer-value-evidence", label: "Verified customer value", truthClass: "DERIVED_FROM_CURRENT_FACTS", description: "Customer value explicitly labeled potential, estimated, verified, or realized with provenance." },
  { id: "grid-liquidity", label: "Grid liquidity", truthClass: "DERIVED_FROM_CURRENT_FACTS", description: "Demand, supply, eligible matches, time to match, and repeat activity by market cell." },
  { id: "grid-fulfillment", label: "Grid fulfillment", truthClass: "CURRENT_FACT_ONLY", description: "Verified completed Grid fulfillment events, not listings or candidate matches." },
  { id: "edu-contract-value", label: "EDU contract value", truthClass: "DERIVED_FROM_CURRENT_FACTS", description: "Executed institutional EDU contract value separated from proposed pipeline value." },
  { id: "professional-opportunity-outcomes", label: "Professional opportunity outcomes", truthClass: "DERIVED_FROM_CURRENT_FACTS", description: "Verified opportunity, placement, work, or advancement outcomes attributable to supported workflows." },
  { id: "security-incidents", label: "Security incidents", truthClass: "CURRENT_FACT_ONLY", description: "Security incidents recorded under the incident-response process and severity model." },
  { id: "uptime", label: "Uptime", truthClass: "DERIVED_FROM_CURRENT_FACTS", description: "Measured availability from production monitoring for the defined service boundary." },
  { id: "integration-reliability", label: "Integration reliability", truthClass: "DERIVED_FROM_CURRENT_FACTS", description: "Success, retry, dead-letter, reconciliation, and availability evidence for external integrations." },
  { id: "runway", label: "Cash runway", truthClass: "DERIVED_FROM_CURRENT_FACTS", description: "Time until current cash is exhausted under the current expense forecast; not a valuation assumption." },
  { id: "capital-secured", label: "Capital secured", truthClass: "CURRENT_FACT_ONLY", description: "Debt, equity, non-dilutive, strategic, or customer capital actually executed or received." },
  { id: "economic-flow", label: "Healthcare economic flow coordinated", truthClass: "DERIVED_FROM_CURRENT_FACTS", description: "Economic activity coordinated by Klinikos, explicitly separated from Klinikos revenue." },
  { id: "scenario-revenue", label: "Scenario revenue", truthClass: "SCENARIO_ONLY", description: "Illustrative scenario output that may be used for planning but must never be represented as current revenue or forecast certainty." },
] as const;

export const companyFunctionRegistry: readonly CompanyFunctionDefinition[] = [
  {
    id: "executive-strategy",
    label: "Executive / Strategy",
    operatingQuestion: "What company-level decision most increases durable enterprise value without breaking truth, focus, safety, or capital discipline?",
    outcomes: ["company direction", "capital allocation", "strategic priorities", "executive scorecard", "major partnership decisions"],
    metricIds: ["cash-received", "arr", "qualified-pipeline", "runway", "capital-secured"],
  },
  {
    id: "product",
    label: "Product",
    operatingQuestion: "Which user outcome should be advanced next, and does it preserve source-locked requirements while strengthening the active company value loop?",
    outcomes: ["roadmap", "requirement traceability", "product quality", "activation", "value evidence"],
    metricIds: ["activation-rate", "time-to-first-value", "customer-value-evidence", "customer-retention"],
  },
  {
    id: "engineering-platform",
    label: "Engineering / Platform",
    operatingQuestion: "What architecture and implementation change makes the supported customer path more reliable, secure, scalable, maintainable, and commercially useful?",
    outcomes: ["architecture", "release", "reliability", "integrations", "developer experience"],
    metricIds: ["uptime", "integration-reliability", "security-incidents", "time-to-first-value"],
  },
  {
    id: "clinical-informatics",
    label: "Clinical / Informatics",
    operatingQuestion: "Does the clinical workflow help the correct professional understand and complete care safely without forcing them to reconstruct information the system already has?",
    outcomes: ["clinical workflow safety", "clinician experience", "clinical authority boundaries", "clinical evidence quality"],
    metricIds: ["customer-value-evidence", "support-burden", "time-to-first-value"],
  },
  {
    id: "revenue-cycle-payer",
    label: "Revenue Cycle / Payer",
    operatingQuestion: "Where did legitimate reimbursement progression stop, what evidence is missing, and what payer or revenue workflow should happen next?",
    outcomes: ["eligibility", "authorization", "coding", "claims", "denials", "reconciliation", "payer operations"],
    metricIds: ["customer-value-evidence", "integration-reliability", "gross-margin"],
  },
  {
    id: "security-privacy-trust",
    label: "Security / Privacy / Trust",
    operatingQuestion: "What could expose a customer, patient, professional, tenant, company secret, or production system, and what control proves that risk is bounded?",
    outcomes: ["security program", "privacy", "tenant isolation", "incident response", "assurance evidence", "vendor review"],
    metricIds: ["security-incidents", "uptime", "integration-reliability"],
  },
  {
    id: "growth-marketing",
    label: "Growth / Marketing",
    operatingQuestion: "How does the right buyer discover a real Klinikos capability, understand it quickly, receive useful value, and move toward a measurable commercial or network action?",
    outcomes: ["public website", "SEO", "demand generation", "brand", "acquisition analytics"],
    metricIds: ["qualified-pipeline", "new-customers", "cash-received", "time-to-first-value"],
  },
  {
    id: "sales-commercial",
    label: "Sales / Commercial",
    operatingQuestion: "What verified customer problem, buyer, urgency, economic consequence, offer, and next action can convert this opportunity into executed revenue?",
    outcomes: ["qualification", "pipeline", "offers", "proposals", "contracts", "forecast"],
    metricIds: ["qualified-pipeline", "cash-received", "booked-revenue", "new-customers", "arr"],
  },
  {
    id: "implementation-customer-success",
    label: "Implementation / Customer Success",
    operatingQuestion: "What must happen for this customer to reach first value, repeat value, renewal, and justified expansion with the least implementation friction?",
    outcomes: ["onboarding", "migration", "activation", "first value", "adoption", "renewal", "expansion"],
    metricIds: ["activation-rate", "time-to-first-value", "customer-retention", "expansion-revenue", "support-burden"],
  },
  {
    id: "finance-treasury",
    label: "Finance / Treasury",
    operatingQuestion: "What is the actual cash, revenue, cost, obligation, runway, and capital position, and what decision protects the company's ability to continue compounding?",
    outcomes: ["accounting truth", "cash", "runway", "budget", "collections", "financial controls", "capital planning"],
    metricIds: ["cash-received", "booked-revenue", "mrr", "arr", "gross-margin", "runway"],
  },
  {
    id: "legal-corporate-governance",
    label: "Legal / Corporate Governance",
    operatingQuestion: "Which corporate, contractual, intellectual-property, privacy, reimbursement, marketplace, or regulatory authority must be documented before this action becomes legally effective?",
    outcomes: ["entity governance", "cap table evidence", "IP assignment", "contracts", "regulatory coordination"],
    metricIds: ["capital-secured", "cash-received"],
  },
  {
    id: "partnerships-corporate-development",
    label: "Partnerships / Corporate Development",
    operatingQuestion: "Should Klinikos build, buy, partner, license, invest, or ignore this capability to maximize customer value and strategic leverage per dollar of capital?",
    outcomes: ["strategic partnerships", "vendor leverage", "distribution", "build-buy-partner decisions", "acquisition candidates"],
    metricIds: ["gross-margin", "qualified-pipeline", "capital-secured", "integration-reliability"],
  },
  {
    id: "grid-marketplace-operations",
    label: "Grid / Marketplace Operations",
    operatingQuestion: "Where does verified demand meet eligible supply, how quickly does fulfillment happen, and what makes that market cell more liquid and trustworthy next time?",
    outcomes: ["supply", "demand", "eligibility", "matching", "fulfillment", "trust", "category economics"],
    metricIds: ["grid-liquidity", "grid-fulfillment", "cash-received", "economic-flow"],
  },
  {
    id: "edu-workforce",
    label: "EDU / Workforce",
    operatingQuestion: "Which workforce shortage has an institutional buyer and can be addressed through training, evidence, human review, and a real opportunity path?",
    outcomes: ["institutional contracts", "programs", "cohorts", "workforce evidence", "training-to-opportunity loop"],
    metricIds: ["edu-contract-value", "professional-opportunity-outcomes", "cash-received", "grid-liquidity"],
  },
  {
    id: "enterprise-procurement",
    label: "Enterprise / Procurement",
    operatingQuestion: "What evidence, security, identity, integration, support, contracting, and implementation requirement prevents a serious enterprise buyer from saying yes today?",
    outcomes: ["procurement readiness", "enterprise implementation", "security evidence", "SSO/integration requirements", "enterprise support"],
    metricIds: ["qualified-pipeline", "arr", "integration-reliability", "uptime", "security-incidents"],
  },
  {
    id: "data-analytics",
    label: "Data / Analytics",
    operatingQuestion: "What current evidence proves customer, product, financial, network, security, or operational performance without confusing projections with facts?",
    outcomes: ["data governance", "product analytics", "business analytics", "value evidence", "decision support"],
    metricIds: ["customer-value-evidence", "activation-rate", "customer-retention", "economic-flow", "gross-margin"],
  },
  {
    id: "public-sector-government",
    label: "Public Sector / Government",
    operatingQuestion: "Which procurement, workforce, public-health, Medicaid, Medicare-related, school, grant, contract, or institutional path can create legitimate distribution, revenue, or non-dilutive capital?",
    outcomes: ["public procurement", "government contracts", "workforce programs", "non-dilutive opportunities", "public-sector partnerships"],
    metricIds: ["qualified-pipeline", "cash-received", "capital-secured", "edu-contract-value"],
  },
] as const;

export const companyCadenceRegistry: readonly CompanyCadenceDefinition[] = [
  {
    id: "daily",
    reviewItems: ["cash", "payments", "qualified pipeline", "customer blockers", "production health", "security incidents", "active P0"],
  },
  {
    id: "weekly",
    reviewItems: ["shipping", "revenue", "pipeline", "customers", "support", "acquisition", "Grid", "EDU", "capital", "security", "what to stop", "next five actions"],
  },
  {
    id: "monthly",
    reviewItems: ["financial close", "MRR/ARR", "gross margin", "retention", "expansion", "COGS", "roadmap", "funding", "vendor spend", "compliance"],
  },
  {
    id: "quarterly",
    reviewItems: ["category strategy", "product-market evidence", "pricing", "capital allocation", "market expansion", "M&A/partnerships", "investor package", "security maturity", "network effects"],
  },
] as const;

export const capitalTrackRegistry: readonly CapitalTrackDefinition[] = [
  {
    id: "customer-capital",
    label: "Customer capital",
    bestUse: "Fund product proof, implementation, onboarding, and repeatable value creation through real customer payments and contracts.",
    primaryRisk: "Over-customizing for one buyer or recognizing cash as proof of a scalable recurring product before repeat evidence exists.",
  },
  {
    id: "non-dilutive",
    label: "Non-dilutive capital",
    bestUse: "Fund aligned R&D, workforce, procurement, institutional, grant, prize, or public-sector programs without giving up equity.",
    primaryRisk: "Long application/payment cycles, restricted uses of funds, reporting burden, or allowing grants to distract from customer demand.",
  },
  {
    id: "venture-equity",
    label: "Venture equity",
    bestUse: "Accelerate a proven scalable platform, enterprise distribution, network liquidity, or strategic product expansion when evidence supports speed.",
    primaryRisk: "Dilution and permanent burn if capital is raised before the company has repeatable value, disciplined economics, and a clear use of funds.",
  },
  {
    id: "debt",
    label: "Debt",
    bestUse: "Finance working capital, receivables, assets, or repeatable growth where current repayment capacity can support the obligation.",
    primaryRisk: "Fixed repayment, guarantees, covenants, or expensive capital applied to speculative product development without dependable cash flow.",
  },
  {
    id: "strategic-capital",
    label: "Strategic capital",
    bestUse: "Accelerate distribution, regulated access, infrastructure, integrations, enterprise reach, or strategic capabilities brought by a partner.",
    primaryRisk: "Strategic restrictions, conflicts, dependence on one partner, or economics that limit future customers and partnerships.",
  },
] as const;

export function companyMetricById(id: string) {
  return companyMetricRegistry.find((item) => item.id === id) ?? null;
}

export function companyFunctionById(id: string) {
  return companyFunctionRegistry.find((item) => item.id === id) ?? null;
}

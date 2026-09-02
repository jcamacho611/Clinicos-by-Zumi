export const KLINIKOS_GODADDY_PAYLINK = "https://f7b959c2-9748-4f7e-9247-7bea69624c5f.paylinks.godaddy.com/";

export const customerCommercialProgression = [
  "DISCOVERY",
  "JOIN FREE",
  "INTENT",
  "CONTEXT",
  "FIRST USEFUL RESULT",
  "ECONOMIC VALUE",
  "PAID CAPABILITY",
  "MEASURED OUTCOME",
  "RETENTION",
  "EXPANSION",
] as const;

export const unfinishedWorkProgression = [
  "UNFINISHED WORK",
  "DETECT",
  "PRIORITIZE",
  "ASSIGN / ROUTE",
  "COMPLETE",
  "VERIFY",
  "MEASURE RESULT",
  "PROVE ECONOMIC VALUE",
  "EXPAND",
] as const;

export const commercialFabricPrinciples = {
  freePaidBoundary:
    "FREE PARTICIPATION AND FIRST VALUE -> PAID CAPABILITY FOLLOWS ADDITIONAL ECONOMIC VALUE",
  paymentCreatesAuthority: false,
  offerAuthority: "server_owned" as const,
  entry:
    "Start with the customer's intent, unfinished work, authority, evidence, and desired outcome. Do not force every customer through one sales ladder.",
  expansion:
    "Expand only when completed work and measured value justify the next governed capability.",
  disclosure:
    "Disclose the minimum necessary commercial truth. Source code, hidden prompts, ranking logic, security architecture, and other crown-jewel IP remain restricted.",
} as const;

/**
 * Qualified service offers are independent tools in the commercial fabric, not a
 * mandatory sequence. Public discovery and first value can remain free; a service
 * is offered only when the customer's unfinished work and economic case justify it.
 */
export const commercialFabricOffers = {
  deepOperatingAudit: {
    key: "deep_operating_audit",
    name: "Deep Operating Audit",
    priceCents: 300_000,
    priceLabel: "$3,000",
    billing: "one_time",
    route: "qualified_service",
  },
  proofSprint: {
    key: "proof_sprint",
    name: "Proof Sprint",
    priceCents: 350_000,
    priceLabel: "$3,500",
    billing: "one_time",
    route: "qualified_service",
  },
  optimizationRetainer: {
    key: "optimization_retainer",
    name: "Optimization Retainer",
    priceCents: 250_000,
    priceLabel: "$2,500/mo",
    billing: "monthly",
    route: "qualified_service",
  },
  integrationLaunch: {
    key: "integration_launch",
    name: "Integration Launch",
    priceCents: 250_000,
    priceLabel: "$2,500",
    billing: "one_time",
    route: "qualified_service",
  },
  dataMigrationGoLive: {
    key: "data_migration_go_live",
    name: "Data Migration & Go-Live",
    priceCents: 500_000,
    priceLabel: "$5,000",
    billing: "one_time",
    route: "qualified_service",
  },
  enterpriseArchitectureWorkshop: {
    key: "enterprise_architecture_workshop",
    name: "Enterprise Architecture Workshop",
    priceCents: 750_000,
    priceLabel: "$7,500",
    billing: "one_time",
    route: "enterprise_government",
  },
} as const;

export const clinicPlans = {
  core: {
    key: "clinic_core",
    name: "Klinikos Core",
    monthlyPriceCents: 99_500,
    monthlyPriceLabel: "$995/mo",
    annualPriceCents: 1_014_900,
    annualPriceLabel: "$10,149/yr",
    annualSavingsLabel: "15% annual commitment savings",
    implementationPriceLabel: "Scoped to the unfinished work and deployment boundary",
    idealFor: "Independent and small clinics that want one operating system for the daily work.",
    includes: ["Core operations workspace", "Scheduling and front desk", "Tasks and follow-up", "Forms and documents", "Baseline Zumi intelligence", "Owner operating view"],
  },
  growth: {
    key: "clinic_growth",
    name: "Klinikos Growth",
    monthlyPriceCents: 199_500,
    monthlyPriceLabel: "$1,995/mo",
    annualPriceCents: 2_034_900,
    annualPriceLabel: "$20,349/yr",
    annualSavingsLabel: "15% annual commitment savings",
    implementationPriceLabel: "Scoped to the unfinished work and deployment boundary",
    idealFor: "Growing clinics that need revenue, network, automation, and deeper operating intelligence.",
    includes: ["Everything in Core", "Revenue work queues", "Referral and Network workflows", "Advanced automations", "Expanded Zumi allowance", "Priority implementation support"],
  },
  scale: {
    key: "clinic_scale",
    name: "Klinikos Scale",
    monthlyPriceCents: 399_500,
    monthlyPriceLabel: "$3,995/mo",
    annualPriceCents: 4_074_900,
    annualPriceLabel: "$40,749/yr",
    annualSavingsLabel: "15% annual commitment savings",
    implementationPriceLabel: "Scoped to the unfinished work and deployment boundary",
    idealFor: "Multi-provider or multi-location organizations coordinating larger teams and higher operating volume.",
    includes: ["Everything in Growth", "Multi-location controls", "Expanded reporting", "Higher included usage allowances", "Advanced integration planning", "Named operating review"],
  },
  enterprise: {
    key: "clinic_enterprise",
    name: "Klinikos Enterprise",
    monthlyPriceCents: null,
    monthlyPriceLabel: "Custom",
    annualPriceCents: null,
    annualPriceLabel: "Custom",
    annualSavingsLabel: "Contracted commercial terms",
    implementationPriceLabel: "Scoped and contracted",
    idealFor: "Large groups, networks, institutions, and organizations requiring custom integrations, governance, or deployment terms.",
    includes: ["Custom scope and capacity", "Enterprise integration program", "Governance and security review", "Custom Grid/Network configuration", "Contracted usage economics", "Executive operating support"],
  },
} as const;

export const professionalPlans = {
  free: { key: "professional_free", name: "Free Person", monthlyPriceCents: 0, monthlyPriceLabel: "Free", annualPriceCents: 0, annualPriceLabel: "Free" },
  pro: { key: "professional_pro", name: "Professional Pro", monthlyPriceCents: 4_900, monthlyPriceLabel: "$49/mo", annualPriceCents: 49_900, annualPriceLabel: "$499/yr" },
  business: { key: "professional_business", name: "Professional Business", monthlyPriceCents: 12_900, monthlyPriceLabel: "$129/mo", annualPriceCents: 129_900, annualPriceLabel: "$1,299/yr" },
  launch: { key: "professional_launch", name: "Professional Launch", priceCents: 49_900, priceLabel: "$499", billing: "one_time" },
} as const;

export const capacityPlans = {
  host: { key: "capacity_host", name: "Capacity Host", monthlyPriceCents: 19_900, monthlyPriceLabel: "$199/mo", annualPriceCents: 203_000, annualPriceLabel: "$2,030/yr" },
  employer: { key: "grid_employer_access", name: "Grid Employer Access", monthlyPriceCents: 49_900, monthlyPriceLabel: "$499/mo", annualPriceCents: 509_000, annualPriceLabel: "$5,090/yr" },
  partner: { key: "partner_os", name: "Partner OS", monthlyPriceCents: 29_900, monthlyPriceLabel: "$299/mo", annualPriceCents: 305_000, annualPriceLabel: "$3,050/yr" },
} as const;

export const commercialAddOns = {
  trustOperations: { name: "Trust & Credential Operations", priceLabel: "$399/mo", annualLabel: "$4,070/yr", setupLabel: "$1,500 setup", rule: "Tracks evidence and readiness; payment never creates legal credential authority." },
  intelligencePlus: { name: "Zumi Intelligence Plus", priceLabel: "$350/mo", annualLabel: "$3,570/yr", rule: "Included allowance first; customer-funded usage thereafter." },
  revenueOS: { name: "Revenue OS", priceLabel: "$750/mo", annualLabel: "$7,650/yr", setupLabel: "$2,500 setup" },
  network: { name: "Network", priceLabel: "$300/mo", annualLabel: "$3,060/yr", setupLabel: "$1,000 setup", rule: "Payment never buys referral priority, eligibility, or authority." },
  premiumConnections: { name: "Premium connections", priceLabel: "Quote / contract", rule: "Setup, recurring connector, and pass-through vendor costs may be separate." },
  usagePacks: { name: "Customer-Funded Usage Wallet", priceLabel: "Prepaid", rule: "Available reserve packs are customer funds for bounded variable usage; deposits are not automatically revenue." },
} as const;

export const gridCommercialRule =
  "Legitimate listing, searching and declining remain free where liquidity requires it. Payment never buys eligibility, authority, referral priority, or fabricated availability.";

export const eduPlans = {
  free: {
    key: "edu_free",
    name: "Klinikos EDU",
    priceLabel: "Free",
    unitLabel: "to start",
    idealFor: "Route mapping, requirements and basic simulation.",
    includes: ["See the route and its requirements", "Basic simulation environment", "Progress record"],
    excludes: ["No advanced pathway"],
  },
  plus: {
    key: "edu_plus",
    name: "EDU Plus",
    priceLabel: "$29/mo",
    annualPriceLabel: "$296/yr",
    unitLabel: "per learner",
    idealFor: "Continuous learning while you work.",
    includes: ["Full simulation library", "Competency tracking", "Placement readiness view"],
    excludes: [],
  },
  course: {
    key: "edu_course",
    name: "Course",
    priceLabel: "$99",
    unitLabel: "per course",
    idealFor: "Specific skills, bought once.",
    includes: ["Course plus simulation", "Evidence written on release", "Counts toward a route"],
    excludes: [],
  },
  pathway: {
    key: "edu_pathway",
    name: "Pathway",
    priceLabel: "$349",
    unitLabel: "per pathway",
    idealFor: "Multi-step advancement.",
    includes: ["Full route with supervision requirements", "Grid eligibility review at the end", "Recorded competency evidence"],
    excludes: ["Does not guarantee placement"],
  },
  placementOS: {
    key: "placement_os",
    name: "Placement OS",
    priceLabel: "$999/mo",
    annualPriceLabel: "$10,190/yr",
    unitLabel: "per institution / program",
    idealFor: "Schools, programs and employers coordinating placement operations.",
    includes: ["Placement coordination", "Evidence/readiness views", "Governed employer/program workflows"],
    excludes: ["Does not guarantee placement or create a license"],
  },
} as const;

export const eduCommercialRule =
  "Institutional workforce and custom programs are quote/contract only. Nothing sold through EDU certifies, licenses, or guarantees placement.";

/** Independent scoped engagements; these are not mandatory customer stages. */
export const serviceEngagements = {
  audit: {
    ...commercialFabricOffers.deepOperatingAudit,
    unitLabel: "per qualified engagement",
    idealFor: "A deeper workflow and economic review when the free first result shows material complexity.",
    includes: ["Workflow and revenue review", "Prioritized unfinished work", "Evidence-backed action map"],
  },
  proof: {
    ...commercialFabricOffers.proofSprint,
    unitLabel: "per qualified sprint",
    idealFor: "Proving a bounded operating outcome before broader deployment.",
    includes: ["Bounded problem scope", "Baseline and completion evidence", "Measured outcome review"],
  },
  retainer: {
    ...commercialFabricOffers.optimizationRetainer,
    unitLabel: "per organization",
    idealFor: "Ongoing optimization or fractional operations leadership after useful value is established.",
    includes: ["Continuous workflow tuning", "Operating review", "Measured expansion recommendations"],
  },
  integration: {
    ...commercialFabricOffers.integrationLaunch,
    unitLabel: "per scoped launch",
    idealFor: "A defined integration deployment with explicit boundaries.",
    includes: ["Integration scope", "Launch coordination", "Verification and handoff"],
  },
  migration: {
    ...commercialFabricOffers.dataMigrationGoLive,
    unitLabel: "per scoped go-live",
    idealFor: "Governed migration and deployment work.",
    includes: ["Migration scope", "Go-live plan", "Verification and handoff"],
  },
  architecture: {
    ...commercialFabricOffers.enterpriseArchitectureWorkshop,
    unitLabel: "per workshop",
    idealFor: "Enterprise or government buyers defining architecture and governed deployment boundaries.",
    includes: ["Architecture workshop", "Operating boundary map", "Contract-ready scope inputs"],
  },
} as const;

export const serviceCommercialRule =
  "Scoped engagements are selected independently from customer need and economic value. There is no mandatory service ladder and no automatic credit-forward sequence.";

export const customerFundedCommercialPrinciples = {
  activation: "Production paid capability activates only after qualifying customer payment is confirmed.",
  variableCost: "Variable vendor/API spend must be backed by included allowance, prepaid customer funds, or explicitly authorized bounded overage before execution.",
  noBlankCheck: "A saved payment method is not authorization for unlimited post-paid vendor usage.",
  demo: "Unpaid/demo access must remain explicitly synthetic and cost-capped unless a separately funded commercial agreement says otherwise.",
  governance: "Payment never overrides Klinikos RBAC, tenant isolation, safety, clinical, privacy, credentialing, claims, or record-release policy.",
  metering: "Usage is metered server-side by organization, capability, provider/vendor, cost bucket, and billing period.",
  providerIndependence: "Commercial entitlements and allowances are product concepts; provider/vendor selection remains replaceable infrastructure.",
  migration: "Klinikos should use pay-per-use providers while customer volume is low, then migrate suitable workloads to customer-funded owned/self-hosted infrastructure when measured economics justify it.",
} as const;

export const clinicSubscriptionPlanning = {
  status: "commercial_fabric_v2" as const,
  note: "Recurring clinic anchors are reviewed subscriptions inside the wider commercial fabric. Deployment scope, integrations, migration, regulated workflows, locations, providers, volume and customer-funded external usage remain independently governed.",
  commercialModel: "free_first_value_plus_governed_catalog_plus_measured_expansion" as const,
  implementationReference: "docs/CUSTOMER_FUNDED_ACCESS_MODEL.md",
};

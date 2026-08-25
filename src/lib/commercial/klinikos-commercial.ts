export const KLINIKOS_GODADDY_PAYLINK = "https://f7b959c2-9748-4f7e-9247-7bea69624c5f.paylinks.godaddy.com/";

export const clinicCommercialOffers = {
  privateWorkflowReview: {
    key: "private_workflow_demo",
    name: "Clinic Operating Analysis",
    priceCents: 50_000,
    priceLabel: "$500",
    billing: "one_time",
    creditForward: "100% credited toward an Implementation Blueprint or qualifying implementation when the clinic proceeds within 30 days.",
  },
  foundingEvaluation: {
    key: "founding_clinic_evaluation",
    name: "Implementation Blueprint",
    priceCents: 150_000,
    priceLabel: "$1,500",
    billing: "one_time",
    creditForward: "100% credited toward a qualifying Klinikos implementation when the clinic proceeds within 30 days.",
  },
  foundingImplementation: {
    key: "founding_clinic_program",
    name: "Founding Clinic Implementation",
    priceCents: 800_000,
    priceLabel: "from $8,000",
    billing: "one_time",
    creditForward: "Eligible analysis and blueprint fees are credited after human review.",
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
    implementationPriceLabel: "from $8,000",
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
    implementationPriceLabel: "from $12,500",
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
    implementationPriceLabel: "from $20,000",
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
    implementationPriceLabel: "from $30,000",
    idealFor: "Large groups, networks, institutions, and organizations requiring custom integrations, governance, or deployment terms.",
    includes: ["Custom scope and capacity", "Enterprise integration program", "Governance and security review", "Custom Grid/Network configuration", "Contracted usage economics", "Executive operating support"],
  },
} as const;

export const commercialAddOns = {
  intelligencePlus: { name: "Zumi Intelligence Plus", priceLabel: "from $350/mo", rule: "Included allowance first; customer-funded usage thereafter." },
  revenueOS: { name: "Revenue OS", priceLabel: "from $750/mo", setupLabel: "from $2,500 setup" },
  network: { name: "Network", priceLabel: "from $300/mo", setupLabel: "from $1,000 setup" },
  premiumConnections: { name: "Premium connections", priceLabel: "Quoted by connection", rule: "Setup, recurring connector, and pass-through vendor costs may be separate." },
  usagePacks: { name: "Usage packs", priceLabel: "Prepaid", rule: "Used only after included allowance is exhausted and before any unapproved overage." },
} as const;

/**
 * Grid monetization.
 *
 * Grid's economics are deliberately asymmetric: being findable costs nothing, and a
 * platform fee applies only when a lawful match is actually accepted. Listing,
 * searching and declining stay free forever, because a marketplace that charges for
 * presence prices out exactly the supply it needs.
 *
 * `priceLabel` is the customer-facing string and `monthlyPriceCents` the machine
 * value; a range carries a null cents value because a range is not a charge.
 */

export const gridCommercialRule =
  "Listing, searching and declining are always free. A platform fee applies only when a lawful match is accepted.";

/**
 * Klinikos EDU monetization.
 *
 * Nothing sold here certifies or licenses anyone — see `CREDENTIAL_DISCLAIMER` in
 * `edu-safety`. A pathway maps requirements and records evidence; it does not
 * guarantee placement, and buying one never creates Grid eligibility for regulated
 * work. Institutional cohort and instructor licensing is contracted separately.
 */
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
    priceLabel: "$19–39/mo",
    unitLabel: "per learner",
    idealFor: "Continuous learning while you work.",
    includes: ["Full simulation library", "Competency tracking", "Placement readiness view"],
    excludes: [],
  },
  course: {
    key: "edu_course",
    name: "Courses",
    priceLabel: "$49–199",
    unitLabel: "per course",
    idealFor: "Specific skills, bought once.",
    includes: ["Course plus simulation", "Evidence written on release", "Counts toward a route"],
    excludes: [],
  },
  pathway: {
    key: "edu_pathway",
    name: "Pathways",
    priceLabel: "$199–499",
    unitLabel: "per pathway",
    idealFor: "Multi-step advancement, such as RN to injector.",
    includes: ["Full route with supervision requirements", "Grid eligibility review at the end", "Recorded competency evidence"],
    excludes: ["Does not guarantee placement"],
  },
} as const;

export const eduCommercialRule =
  "Institutional cohort and instructor licensing is contracted separately. Nothing sold here certifies or licenses anyone.";

/** Scoped professional engagements, quoted per practice. */
export const serviceEngagements = {
  audit: {
    key: "service_audit",
    name: "Operations or growth audit",
    priceLabel: "$1,500–5,000",
    unitLabel: "per engagement",
    idealFor: "A workflow and revenue review with findings you can act on.",
    includes: ["Workflow and revenue review", "Prioritized findings", "Implementation plan"],
  },
  retainer: {
    key: "service_retainer",
    name: "Optimization retainer",
    priceLabel: "$1,500–5,000/mo",
    unitLabel: "per practice",
    idealFor: "Ongoing optimization, or fractional operations leadership.",
    includes: ["Continuous workflow tuning", "Quarterly operating review", "Fractional engagement available"],
  },
} as const;

export const serviceCommercialRule =
  "Scoped engagements, quoted per practice. Analysis fees are credited toward implementation when you continue.";

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
  status: "approved_pricing_v1" as const,
  note: "Public anchors are intentionally simple. Final contract scope may vary by locations, providers, volume, regulated workflows, integrations, migration, and customer-funded external usage.",
  commercialModel: "subscription_plus_implementation_plus_customer_funded_usage" as const,
  implementationReference: "docs/CUSTOMER_FUNDED_ACCESS_MODEL.md",
};


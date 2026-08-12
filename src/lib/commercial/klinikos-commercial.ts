export const KLINIKOS_GODADDY_PAYLINK = "https://f7b959c2-9748-4f7e-9247-7bea69624c5f.paylinks.godaddy.com/";

export const klinikosCommercialContact = {
  email: process.env.KLINIKOS_SALES_EMAIL ?? process.env.KLINIKOS_CONTACT_EMAIL ?? "",
};

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

export const gridCommercialModel = {
  professional: {
    label: "Grid Professional",
    freeLabel: "$0 basic profile",
    proLabel: "$39/mo Pro",
    transactionLabel: "10% standard completed-transaction platform fee",
    pricing: "Keep supply acquisition friction low: basic verified profiles can join free. Pro adds visibility, analytics, advanced availability, alerts, and matching tools. Completed paid activity uses a server-owned resource-class fee policy; 10% is the launch midpoint, not a universal legal rule.",
  },
  facility: {
    label: "Grid Facility",
    freeLabel: "$0 to join",
    proLabel: "$99/mo Facility Pro",
    transactionLabel: "10% standard completed-booking platform fee",
    pricing: "Facilities can list eligible capacity with low entry friction. Facility Pro adds expanded inventory, analytics, priority matching, and operating tools. Completed bookings remain subject to resource-specific server-owned economics.",
  },
  seller: {
    label: "Grid Seller",
    freeLabel: "$0 to join",
    proLabel: "$49/mo Seller Pro",
    transactionLabel: "10% standard completed-transaction platform fee",
    pricing: "Eligible sellers can enter the network without a mandatory subscription. Seller Pro adds expanded listings, analytics, visibility, and fulfillment tools. Regulated categories remain policy-gated regardless of payment.",
  },
  platform: {
    label: "Klinikos fee",
    pricing: "Launch around a 10% completed-transaction midpoint where legally and economically appropriate, while preserving server-owned class-specific fees, minimum fees, processor-cost recovery, refunds, disputes, and negotiated enterprise economics. Never let payment bypass eligibility or healthcare fee-splitting rules.",
  },
} as const;

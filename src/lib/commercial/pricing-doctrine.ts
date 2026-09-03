export const monetizableValueClasses = [
  "operating_infrastructure",
  "advanced_intelligence",
  "metered_variable_usage",
  "concierge_implementation",
  "verification_review_where_lawful",
  "grid_resource_economics_where_lawful",
  "edu_workforce_value",
  "premium_integrations",
  "enterprise_governance",
  "professional_services",
] as const;

export type MonetizableValueClass = (typeof monetizableValueClasses)[number];

/**
 * Governing Klinikos commercial doctrine.
 *
 * The network is the distribution and liquidity layer. Klinikos should not charge
 * admission merely to create a legitimate identity, organization relationship, or
 * safe/basic network participation state. Revenue comes from useful operating
 * infrastructure, advanced capability, governed transactions, services, usage, and
 * enterprise scope. None of those commercial states creates regulated authority.
 */
export const commercialPricingDoctrine = {
  governingModel: "FREE_HEALTHCARE_NETWORK_PAID_OPERATING_INFRASTRUCTURE" as const,
  freeNetworkParticipation: {
    paymentRequired: false,
    subscriptionRequired: false,
    grantsProfessionalAuthority: false,
    grantsClinicalAuthority: false,
  },
  authorityForSale: false,
  feeDefaults: {
    clinicalCareGenericPlatformPercentage: 0,
    referralGenericPlatformPercentage: 0,
    requiresResourceClassPolicy: true,
    requiresLegalGateWhereApplicable: true,
  },
  truthSeparations: [
    "identity!=subscription",
    "participation!=payment",
    "listing!=transaction",
    "match!=fulfillment",
    "payment!=authority",
    "subscription!=professional_eligibility",
    "edu_completion!=license",
  ] as const,
  paidOfferRequirements: [
    "server_owned_offer",
    "pricing_version",
    "effective_state",
    "payment_evidence",
    "entitlement_transition",
    "cost_or_margin_policy",
  ] as const,
  monetizableValueClasses,
} as const;

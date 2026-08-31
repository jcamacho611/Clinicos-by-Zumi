export const CANONICAL_PLANE_IDS = [
  "healthcare_universe",
  "economic_resource",
  "lifecycle",
  "operating_infrastructure",
  "compounding_business",
] as const;

export type CanonicalPlaneId = (typeof CANONICAL_PLANE_IDS)[number];

export const STRATEGY_STATES = [
  "NOW",
  "NEXT",
  "LATER",
  "PARTNER",
  "CONNECT",
  "INTERNALIZE",
  "NEVER_BUILD",
] as const;
export type StrategyState = (typeof STRATEGY_STATES)[number];

export const IMPLEMENTATION_STATES = [
  "LIVE_VERIFIED",
  "BUILT_NEEDS_VERIFICATION",
  "PARTIAL",
  "DESIGNED",
  "PLANNED",
  "EXTERNAL_CONNECTION_REQUIRED",
  "LEGAL_REVIEW_REQUIRED",
  "NOT_BUILT",
  "HISTORICAL_ONLY",
] as const;
export type ImplementationState = (typeof IMPLEMENTATION_STATES)[number];

export type AuthorityOwner = "klinikos" | "external" | "participant" | "shared";

export type EcosystemNode = {
  id: string;
  label: string;
  planeId: CanonicalPlaneId;
  strategyState: StrategyState;
  implementationState: ImplementationState;
  authorityOwner: AuthorityOwner;
  evidencePaths: readonly string[];
  externalDependencies: readonly string[];
  legalSecurityGates: readonly string[];
};

export type EcosystemEdge = {
  id: string;
  from: string;
  to: string;
  relation: string;
};

export type RouteGraphBinding = {
  routeId: string;
  nodeIds: readonly string[];
  approvedBoundary?: "external" | "deferred";
};

export type EcosystemJourney = {
  id: string;
  label: string;
  planeIds: readonly CanonicalPlaneId[];
  nodeIds: readonly string[];
};

export const REQUIRED_ECOSYSTEM_LENS_IDS = [
  "whole-healthcare-universe",
  "identity-trust",
  "patient-care",
  "current-visit",
  "learner-edu",
  "placement",
  "professional-career",
  "injector-aesthetics",
  "grid-exchange",
  "medspa-commerce-resource",
  "clinic-operations",
  "rcm-money",
  "quality-expert",
  "organization-enterprise",
  "partner-integration",
  "zumi-openai",
  "security-privacy",
  "distribution",
  "retention-network-effects",
  "capital-company-os",
  "data-evidence-memory",
] as const;
export type EcosystemLensId = (typeof REQUIRED_ECOSYSTEM_LENS_IDS)[number];

export type EcosystemLens = {
  id: EcosystemLensId;
  label: string;
  nodeIds: readonly string[];
};

const node = (
  id: string,
  label: string,
  planeId: CanonicalPlaneId,
  strategyState: StrategyState,
  implementationState: ImplementationState,
  authorityOwner: AuthorityOwner = "klinikos",
  evidencePaths: readonly string[] = [],
  externalDependencies: readonly string[] = [],
  legalSecurityGates: readonly string[] = [],
): EcosystemNode => ({
  id,
  label,
  planeId,
  strategyState,
  implementationState,
  authorityOwner,
  evidencePaths,
  externalDependencies,
  legalSecurityGates,
});

const nodes: EcosystemNode[] = [
  // Plane 1 — participants and institutions. These are conceptual graph nodes,
  // not declarations that a matching persistence model already exists.
  node("healthcare.person", "Person", "healthcare_universe", "NOW", "PARTIAL", "participant", ["prisma"]),
  node("healthcare.patient", "Patient / care participant", "healthcare_universe", "NOW", "PARTIAL", "participant", ["prisma"]),
  node("healthcare.learner", "Learner / student", "healthcare_universe", "NOW", "PARTIAL", "participant", ["src/lib/ecosystem/edu-grid-bridge.ts"]),
  node("healthcare.professional", "Healthcare professional", "healthcare_universe", "NOW", "PARTIAL", "participant", ["prisma", "src/lib/grid/eligibility.ts"]),
  node("healthcare.expert", "Quality / specialty expert", "healthcare_universe", "NEXT", "PARTIAL", "participant", ["prisma/migrations/20260819120000_expert_support_requests"]),
  node("healthcare.organization", "Healthcare organization", "healthcare_universe", "NOW", "PARTIAL", "participant", ["prisma"]),
  node("healthcare.clinic", "Clinic / practice", "healthcare_universe", "NOW", "PARTIAL", "participant", ["prisma", "src/lib/ecosystem/clinic-grid-bridge.ts"]),
  node("healthcare.school", "School / training institution", "healthcare_universe", "NEXT", "PARTIAL", "participant", ["prisma/migrations/20260810160000_klinikos_edu_foundation"]),

  // Plane 2 — things that can be needed, supplied, matched, governed or fulfilled.
  node("resource.work", "Job / shift / professional work", "economic_resource", "NOW", "PARTIAL", "shared", ["src/lib/grid/transaction-flow.ts"]),
  node("resource.professional_service", "Professional service", "economic_resource", "NOW", "PARTIAL", "shared", ["src/lib/grid/resource-rules.ts"]),
  node("resource.care_capacity", "Care / appointment capacity", "economic_resource", "NEXT", "PARTIAL", "shared", ["src/lib/grid/resource-rules.ts"], [], ["patient demand remains private"]),
  node("resource.space", "Room / chair / facility capacity", "economic_resource", "NOW", "PARTIAL", "shared", ["src/lib/grid/composition-engine.ts"]),
  node("resource.equipment", "Equipment", "economic_resource", "NEXT", "PARTIAL", "shared", ["src/lib/grid/resource-rules.ts"]),
  node("resource.permitted_product", "Permitted retail / general supply", "economic_resource", "NEXT", "PARTIAL", "shared", ["src/lib/grid/resource-rules.ts"]),
  node("resource.regulated_clinical_inventory", "Regulated clinical inventory", "economic_resource", "CONNECT", "LEGAL_REVIEW_REQUIRED", "shared", ["src/lib/grid/resource-rules.ts"], [], ["not ordinary public commerce"]),
  node("resource.education", "Education / training", "economic_resource", "NOW", "PARTIAL", "shared", ["src/lib/ecosystem/edu-grid-bridge.ts"]),
  node("resource.placement_capacity", "Clinical placement / preceptor capacity", "economic_resource", "NEXT", "PARTIAL", "shared", ["src/lib/grid/composition-engine.ts", "src/lib/ecosystem/edu-grid-bridge.ts"]),
  node("resource.expert_service", "Expert / quality service", "economic_resource", "NEXT", "PARTIAL", "shared", ["prisma/migrations/20260819120000_expert_support_requests"]),
  node("resource.referral_capacity", "Referral / consult capacity", "economic_resource", "NEXT", "PARTIAL", "shared", ["src/lib/ecosystem/clinic-grid-bridge.ts"], [], ["no generic referral fee"]),

  // Plane 3 — lifecycle truth. These states stay distinct even when a route omits some.
  node("lifecycle.claim_evidence", "Claim / evidence", "lifecycle", "NOW", "PARTIAL"),
  node("lifecycle.verification", "Verification", "lifecycle", "NOW", "PARTIAL"),
  node("lifecycle.relationship", "Relationship", "lifecycle", "NEXT", "PARTIAL"),
  node("lifecycle.authority", "Authority decision", "lifecycle", "NOW", "PARTIAL"),
  node("lifecycle.eligibility", "Eligibility decision", "lifecycle", "NOW", "PARTIAL", "klinikos", ["src/lib/grid/eligibility.ts"]),
  node("lifecycle.match", "Match / route", "lifecycle", "NOW", "PARTIAL", "klinikos", ["src/lib/grid/transaction-flow.ts"]),
  node("lifecycle.offer", "Offer / plan / quote", "lifecycle", "NOW", "PARTIAL", "shared", ["src/lib/grid/transaction-flow.ts"]),
  node("lifecycle.agreement", "Agreement / consent", "lifecycle", "NOW", "PARTIAL", "shared"),
  node("lifecycle.reservation", "Reservation", "lifecycle", "NOW", "PARTIAL", "shared", ["src/lib/grid/transaction-flow.ts"]),
  node("lifecycle.assignment", "Assignment", "lifecycle", "NOW", "PARTIAL", "shared", ["src/lib/grid/composition-engine.ts"]),
  node("lifecycle.appointment", "Appointment", "lifecycle", "NOW", "PARTIAL", "shared"),
  node("lifecycle.encounter", "Encounter / Current Visit", "lifecycle", "NOW", "PARTIAL", "shared", ["src/lib/screen-experience-contracts.ts"]),
  node("lifecycle.learning_activity", "Learning / competency activity", "lifecycle", "NOW", "PARTIAL", "shared", ["src/lib/ecosystem/edu-grid-bridge.ts"]),
  node("lifecycle.placement", "Placement", "lifecycle", "NEXT", "PARTIAL", "shared", ["src/lib/grid/composition-engine.ts"]),
  node("lifecycle.fulfillment", "Fulfillment", "lifecycle", "NOW", "PARTIAL", "shared", ["src/lib/grid/transaction-flow.ts"]),
  node("lifecycle.financial_obligation", "Financial obligation", "lifecycle", "NOW", "PARTIAL", "shared"),
  node("lifecycle.payment", "Payment / payable / payout", "lifecycle", "NOW", "PARTIAL", "shared"),
  node("lifecycle.settlement", "Settlement / reconciliation", "lifecycle", "NOW", "PARTIAL", "shared"),
  node("lifecycle.outcome", "Outcome", "lifecycle", "NOW", "PARTIAL", "shared"),
  node("lifecycle.reputation", "Reputation evidence", "lifecycle", "NEXT", "PARTIAL", "shared"),

  // Plane 4 — Klinikos operating infrastructure and explicit external rails.
  node("infra.identity_trust", "Identity / Trust", "operating_infrastructure", "NOW", "PARTIAL"),
  node("infra.grid", "Grid exchange substrate", "operating_infrastructure", "NOW", "BUILT_NEEDS_VERIFICATION", "klinikos", ["src/lib/grid", "src/lib/ecosystem/clinic-grid-bridge.ts", "src/lib/ecosystem/edu-grid-bridge.ts"]),
  node("infra.edu", "EDU / workforce", "operating_infrastructure", "NOW", "PARTIAL", "klinikos", ["src/lib/ecosystem/edu-grid-bridge.ts"]),
  node("infra.clinic_os", "Clinic OS", "operating_infrastructure", "NOW", "PARTIAL", "klinikos", ["src/lib/ecosystem/clinic-grid-bridge.ts"]),
  node("infra.current_visit", "Current Visit", "operating_infrastructure", "NOW", "PARTIAL", "klinikos", ["src/lib/screen-experience-contracts.ts"]),
  node("infra.financial_os", "Financial OS / RCM", "operating_infrastructure", "NOW", "PARTIAL", "klinikos", ["prisma"]),
  node("infra.quality_guardian", "Quality Guardian / Rules & Evidence", "operating_infrastructure", "NEXT", "PARTIAL", "klinikos"),
  node("infra.network", "Network relationships", "operating_infrastructure", "NOW", "PARTIAL", "klinikos", ["prisma"]),
  node("infra.zumi", "Zumi intelligence", "operating_infrastructure", "NOW", "PARTIAL", "klinikos"),
  node("infra.integration_hub", "Integration Hub", "operating_infrastructure", "NEXT", "PARTIAL", "klinikos", ["prisma"]),
  node("infra.security_privacy", "Security / privacy / contextual authority", "operating_infrastructure", "NOW", "PARTIAL", "klinikos"),
  node("infra.memory_knowledge", "Memory / knowledge", "operating_infrastructure", "NEXT", "PARTIAL", "klinikos"),
  node("infra.insights", "Insights / analytics", "operating_infrastructure", "NEXT", "PARTIAL", "klinikos"),
  node("external.lab_rail", "Laboratory rail", "operating_infrastructure", "CONNECT", "EXTERNAL_CONNECTION_REQUIRED", "external", [], ["laboratory network"]),
  node("external.imaging_rail", "Imaging / PACS rail", "operating_infrastructure", "CONNECT", "EXTERNAL_CONNECTION_REQUIRED", "external", [], ["imaging / PACS network"]),
  node("external.pharmacy_erx_rail", "Pharmacy / eRx rail", "operating_infrastructure", "CONNECT", "EXTERNAL_CONNECTION_REQUIRED", "external", [], ["approved eRx / pharmacy network"]),
  node("external.clearinghouse_rail", "Clearinghouse rail", "operating_infrastructure", "CONNECT", "EXTERNAL_CONNECTION_REQUIRED", "external", [], ["clearinghouse"]),
  node("external.payer_rail", "Payer rail", "operating_infrastructure", "CONNECT", "EXTERNAL_CONNECTION_REQUIRED", "external", [], ["payer"]),
  node("external.credential_authority_rail", "Credential / licensing authority rail", "operating_infrastructure", "CONNECT", "EXTERNAL_CONNECTION_REQUIRED", "external", [], ["licensing / credential source"]),
  node("external.openai_rail", "OpenAI model rail", "operating_infrastructure", "PARTNER", "BUILT_NEEDS_VERIFICATION", "external", ["src/features/zumi/adapters/openai-responses.ts"], ["OpenAI"]),

  // Plane 5 — how user value compounds into a durable company.
  node("business.acquisition", "Acquisition / qualified discovery", "compounding_business", "NOW", "PARTIAL"),
  node("business.customer", "Customer / implementation", "compounding_business", "NOW", "PARTIAL"),
  node("business.revenue", "Revenue / collection", "compounding_business", "NOW", "PARTIAL"),
  node("business.retention", "Retention / expansion", "compounding_business", "NEXT", "PARTIAL"),
  node("business.distribution", "Distribution / referrals / partnerships", "compounding_business", "NEXT", "PARTIAL"),
  node("business.capital", "Capital / reinvestment", "compounding_business", "NEXT", "PARTIAL"),
  node("business.enterprise_value", "Defensibility / enterprise value", "compounding_business", "NEXT", "DESIGNED"),
];

const edge = (id: string, from: string, to: string, relation: string): EcosystemEdge => ({ id, from, to, relation });

const edges: EcosystemEdge[] = [
  edge("edge.person.identity", "healthcare.person", "infra.identity_trust", "HAS_GOVERNED_IDENTITY"),
  edge("edge.patient.care-capacity", "healthcare.patient", "resource.care_capacity", "NEEDS_PRIVATELY"),
  edge("edge.learner.edu", "healthcare.learner", "infra.edu", "LEARNS_THROUGH"),
  edge("edge.edu.placement-capacity", "infra.edu", "resource.placement_capacity", "CREATES_GOVERNED_DEMAND"),
  edge("edge.placement.grid", "resource.placement_capacity", "infra.grid", "DISCOVERED_THROUGH"),
  edge("edge.placement.fulfillment", "lifecycle.placement", "lifecycle.fulfillment", "FULFILLS"),
  edge("edge.professional.eligibility", "healthcare.professional", "lifecycle.eligibility", "EVALUATED_BY"),
  edge("edge.eligibility.match", "lifecycle.eligibility", "lifecycle.match", "PRECEDES"),
  edge("edge.reputation.match", "lifecycle.reputation", "lifecycle.match", "RANKING_INPUT_ONLY"),
  edge("edge.work.grid", "resource.work", "infra.grid", "EXCHANGED_THROUGH"),
  edge("edge.clinic.grid", "healthcare.clinic", "infra.grid", "CREATES_AND_CONSUMES_CAPACITY"),
  edge("edge.clinic.clinic-os", "healthcare.clinic", "infra.clinic_os", "OPERATES_THROUGH"),
  edge("edge.space.grid", "resource.space", "infra.grid", "PROJECTED_TO"),
  edge("edge.permitted-product.grid", "resource.permitted_product", "infra.grid", "MAY_PROJECT_TO"),
  edge("edge.regulated-inventory.clinic-os", "resource.regulated_clinical_inventory", "infra.clinic_os", "GOVERNED_PRIVATELY_BY"),
  edge("edge.patient.appointment", "resource.care_capacity", "lifecycle.appointment", "RESERVED_AS"),
  edge("edge.appointment.encounter", "lifecycle.appointment", "lifecycle.encounter", "LEADS_TO"),
  edge("edge.encounter.current-visit", "lifecycle.encounter", "infra.current_visit", "CONVERGES_IN"),
  edge("edge.current-visit.lab", "infra.current_visit", "external.lab_rail", "CONNECTS_TO"),
  edge("edge.current-visit.imaging", "infra.current_visit", "external.imaging_rail", "CONNECTS_TO"),
  edge("edge.current-visit.pharmacy", "infra.current_visit", "external.pharmacy_erx_rail", "CONNECTS_TO"),
  edge("edge.current-visit.financial", "infra.current_visit", "infra.financial_os", "CREATES_BILLING_READINESS"),
  edge("edge.financial.clearinghouse", "infra.financial_os", "external.clearinghouse_rail", "CONNECTS_TO"),
  edge("edge.clearinghouse.payer", "external.clearinghouse_rail", "external.payer_rail", "TRANSMITS_TO"),
  edge("edge.match.offer", "lifecycle.match", "lifecycle.offer", "PRECEDES"),
  edge("edge.offer.agreement", "lifecycle.offer", "lifecycle.agreement", "PRECEDES"),
  edge("edge.agreement.reservation", "lifecycle.agreement", "lifecycle.reservation", "MAY_CREATE"),
  edge("edge.agreement.assignment", "lifecycle.agreement", "lifecycle.assignment", "MAY_CREATE"),
  edge("edge.reservation.fulfillment", "lifecycle.reservation", "lifecycle.fulfillment", "PRECEDES"),
  edge("edge.assignment.fulfillment", "lifecycle.assignment", "lifecycle.fulfillment", "PRECEDES"),
  edge("edge.fulfillment.obligation", "lifecycle.fulfillment", "lifecycle.financial_obligation", "MAY_CREATE"),
  edge("edge.obligation.payment", "lifecycle.financial_obligation", "lifecycle.payment", "MAY_REQUIRE"),
  edge("edge.payment.settlement", "lifecycle.payment", "lifecycle.settlement", "PRECEDES"),
  edge("edge.fulfillment.outcome", "lifecycle.fulfillment", "lifecycle.outcome", "PRODUCES"),
  edge("edge.outcome.reputation", "lifecycle.outcome", "lifecycle.reputation", "MAY_INFORM"),
  edge("edge.quality.expert", "infra.quality_guardian", "resource.expert_service", "ESCALATES_TO"),
  edge("edge.expert.grid", "resource.expert_service", "infra.grid", "SOURCED_THROUGH"),
  edge("edge.integration.zumi", "infra.integration_hub", "infra.zumi", "SURFACES_EXCEPTIONS_TO"),
  edge("edge.zumi.openai", "infra.zumi", "external.openai_rail", "MAY_USE_GOVERNED"),
  edge("edge.outcome.insights", "lifecycle.outcome", "infra.insights", "MEASURED_BY"),
  edge("edge.insights.retention", "infra.insights", "business.retention", "INFORMS"),
  edge("edge.acquisition.customer", "business.acquisition", "business.customer", "CONVERTS_TO"),
  edge("edge.customer.revenue", "business.customer", "business.revenue", "CREATES"),
  edge("edge.revenue.retention", "business.revenue", "business.retention", "SUSTAINED_BY"),
  edge("edge.retention.distribution", "business.retention", "business.distribution", "ENABLES_ADVOCACY"),
  edge("edge.distribution.acquisition", "business.distribution", "business.acquisition", "LOWERS_CAC_FOR"),
  edge("edge.revenue.capital", "business.revenue", "business.capital", "REDUCES_DEPENDENCE_ON"),
  edge("edge.capital.enterprise-value", "business.capital", "business.enterprise_value", "REINVESTS_TOWARD"),
  edge("edge.network.distribution", "infra.network", "business.distribution", "AMPLIFIES"),
  edge("edge.memory.insights", "infra.memory_knowledge", "infra.insights", "INFORMS"),
];

const routeBindings: RouteGraphBinding[] = [
  { routeId: "find-extra-work", nodeIds: ["healthcare.professional", "resource.work", "lifecycle.eligibility", "infra.grid"] },
  { routeId: "become-grid-ready", nodeIds: ["healthcare.learner", "infra.edu", "healthcare.professional", "lifecycle.eligibility", "infra.grid"] },
  { routeId: "student-clinical-placement", nodeIds: ["healthcare.learner", "resource.placement_capacity", "lifecycle.placement", "infra.edu", "infra.grid"] },
  { routeId: "clinician-independent-practice", nodeIds: ["healthcare.professional", "healthcare.clinic", "infra.clinic_os", "business.customer"] },
  { routeId: "provider-to-clinic-owner", nodeIds: ["healthcare.professional", "healthcare.clinic", "infra.identity_trust", "infra.clinic_os"] },
  { routeId: "fill-staffing-need", nodeIds: ["healthcare.clinic", "resource.work", "lifecycle.eligibility", "infra.grid"] },
  { routeId: "clinic-monetize-capacity", nodeIds: ["healthcare.clinic", "resource.space", "infra.grid", "business.revenue"] },
  { routeId: "clinic-operational-optimization", nodeIds: ["healthcare.clinic", "infra.clinic_os", "infra.insights"] },
  { routeId: "clinic-add-service", nodeIds: ["healthcare.clinic", "resource.professional_service", "infra.clinic_os", "infra.grid"] },
  { routeId: "clinic-improve-revenue", nodeIds: ["healthcare.clinic", "infra.financial_os", "business.revenue"] },
  { routeId: "clinic-expand-locations", nodeIds: ["healthcare.clinic", "infra.network", "business.enterprise_value"] },
  { routeId: "fix-referral-leakage", nodeIds: ["healthcare.clinic", "resource.referral_capacity", "infra.clinic_os", "infra.network"] },
  { routeId: "organization-education-partner", nodeIds: ["healthcare.clinic", "healthcare.school", "resource.placement_capacity", "infra.edu", "infra.grid"] },
  { routeId: "school-placement-network", nodeIds: ["healthcare.school", "healthcare.learner", "resource.placement_capacity", "infra.edu", "infra.grid"] },
  { routeId: "educator-preceptor-opportunity", nodeIds: ["healthcare.professional", "resource.placement_capacity", "lifecycle.eligibility", "infra.edu", "infra.grid"] },
  { routeId: "grid-higher-value-opportunity", nodeIds: ["healthcare.professional", "resource.work", "lifecycle.reputation", "lifecycle.eligibility", "infra.grid"] },
  { routeId: "patient-find-care", nodeIds: ["healthcare.patient", "resource.care_capacity", "lifecycle.appointment", "infra.grid"] },
  { routeId: "launch-another-organization", nodeIds: ["healthcare.person", "healthcare.organization", "infra.identity_trust", "infra.clinic_os"] },
];

const journeys: EcosystemJourney[] = [
  {
    id: "patient-care",
    label: "Patient to governed care and follow-up",
    planeIds: ["healthcare_universe", "economic_resource", "lifecycle", "operating_infrastructure"],
    nodeIds: ["healthcare.patient", "resource.care_capacity", "lifecycle.appointment", "lifecycle.encounter", "infra.current_visit"],
  },
  {
    id: "learner-placement-work",
    label: "Learner to placement to professional opportunity",
    planeIds: ["healthcare_universe", "economic_resource", "lifecycle", "operating_infrastructure"],
    nodeIds: ["healthcare.learner", "infra.edu", "resource.placement_capacity", "lifecycle.placement", "lifecycle.fulfillment", "healthcare.professional", "infra.grid"],
  },
  {
    id: "professional-grid",
    label: "Professional to eligible Grid opportunity",
    planeIds: ["healthcare_universe", "economic_resource", "lifecycle", "operating_infrastructure"],
    nodeIds: ["healthcare.professional", "resource.work", "lifecycle.eligibility", "lifecycle.match", "infra.grid"],
  },
  {
    id: "clinic-grid",
    label: "Clinic demand and capacity to Grid",
    planeIds: ["healthcare_universe", "economic_resource", "operating_infrastructure"],
    nodeIds: ["healthcare.clinic", "resource.work", "resource.space", "infra.clinic_os", "infra.grid"],
  },
  {
    id: "current-visit-rcm",
    label: "Current Visit to financial lifecycle",
    planeIds: ["lifecycle", "operating_infrastructure"],
    nodeIds: ["lifecycle.encounter", "infra.current_visit", "lifecycle.financial_obligation", "infra.financial_os", "external.clearinghouse_rail", "external.payer_rail"],
  },
  {
    id: "quality-expert",
    label: "Quality signal to governed expert remediation",
    planeIds: ["healthcare_universe", "economic_resource", "lifecycle", "operating_infrastructure"],
    nodeIds: ["infra.quality_guardian", "resource.expert_service", "healthcare.expert", "lifecycle.eligibility", "infra.grid", "lifecycle.outcome"],
  },
  {
    id: "company-compounding",
    label: "Customer value to compounding enterprise value",
    planeIds: ["lifecycle", "operating_infrastructure", "compounding_business"],
    nodeIds: ["lifecycle.outcome", "infra.insights", "business.retention", "business.distribution", "business.acquisition", "business.revenue", "business.capital", "business.enterprise_value"],
  },
];

const lenses: EcosystemLens[] = [
  { id: "whole-healthcare-universe", label: "Whole healthcare universe", nodeIds: ["healthcare.person", "healthcare.patient", "healthcare.professional", "healthcare.clinic", "healthcare.school", "external.payer_rail"] },
  { id: "identity-trust", label: "Identity, trust and authority", nodeIds: ["healthcare.person", "infra.identity_trust", "lifecycle.claim_evidence", "lifecycle.verification", "lifecycle.relationship", "lifecycle.authority"] },
  { id: "patient-care", label: "Patient and care", nodeIds: ["healthcare.patient", "resource.care_capacity", "lifecycle.appointment", "lifecycle.encounter", "infra.current_visit"] },
  { id: "current-visit", label: "Current Visit", nodeIds: ["lifecycle.encounter", "infra.current_visit", "external.lab_rail", "external.imaging_rail", "external.pharmacy_erx_rail"] },
  { id: "learner-edu", label: "Learner and EDU", nodeIds: ["healthcare.learner", "resource.education", "lifecycle.learning_activity", "infra.edu"] },
  { id: "placement", label: "Clinical placement", nodeIds: ["healthcare.learner", "healthcare.school", "resource.placement_capacity", "lifecycle.placement", "infra.edu", "infra.grid"] },
  { id: "professional-career", label: "Professional and career", nodeIds: ["healthcare.professional", "resource.work", "lifecycle.eligibility", "lifecycle.reputation", "infra.grid"] },
  { id: "injector-aesthetics", label: "Injector / aesthetics progression", nodeIds: ["healthcare.learner", "infra.edu", "healthcare.professional", "lifecycle.eligibility", "resource.professional_service", "infra.grid"] },
  { id: "grid-exchange", label: "Grid exchange", nodeIds: ["infra.grid", "resource.work", "resource.space", "resource.equipment", "resource.permitted_product", "lifecycle.match", "lifecycle.offer", "lifecycle.agreement", "lifecycle.fulfillment"] },
  { id: "medspa-commerce-resource", label: "Med-spa commerce and resource", nodeIds: ["healthcare.clinic", "healthcare.professional", "resource.space", "resource.equipment", "resource.permitted_product", "resource.regulated_clinical_inventory", "infra.clinic_os", "infra.grid"] },
  { id: "clinic-operations", label: "Clinic operations", nodeIds: ["healthcare.clinic", "infra.clinic_os", "infra.network", "infra.insights", "infra.grid"] },
  { id: "rcm-money", label: "RCM and money", nodeIds: ["infra.financial_os", "lifecycle.financial_obligation", "lifecycle.payment", "lifecycle.settlement", "external.clearinghouse_rail", "external.payer_rail"] },
  { id: "quality-expert", label: "Quality and Expert Grid", nodeIds: ["infra.quality_guardian", "healthcare.expert", "resource.expert_service", "infra.grid", "lifecycle.outcome"] },
  { id: "organization-enterprise", label: "Organization and enterprise", nodeIds: ["healthcare.organization", "healthcare.clinic", "infra.identity_trust", "infra.network", "business.enterprise_value"] },
  { id: "partner-integration", label: "Partners and integrations", nodeIds: ["infra.integration_hub", "external.lab_rail", "external.imaging_rail", "external.pharmacy_erx_rail", "external.clearinghouse_rail", "external.payer_rail", "external.credential_authority_rail"] },
  { id: "zumi-openai", label: "Zumi and OpenAI", nodeIds: ["infra.zumi", "external.openai_rail", "infra.security_privacy", "infra.memory_knowledge"] },
  { id: "security-privacy", label: "Security and privacy", nodeIds: ["infra.identity_trust", "infra.security_privacy", "lifecycle.authority", "lifecycle.eligibility"] },
  { id: "distribution", label: "Distribution", nodeIds: ["business.distribution", "business.acquisition", "infra.network"] },
  { id: "retention-network-effects", label: "Retention and network effects", nodeIds: ["business.retention", "business.distribution", "infra.network", "lifecycle.reputation", "business.enterprise_value"] },
  { id: "capital-company-os", label: "Capital and company OS", nodeIds: ["business.customer", "business.revenue", "business.retention", "business.capital", "business.enterprise_value"] },
  { id: "data-evidence-memory", label: "Data, evidence and memory", nodeIds: ["lifecycle.claim_evidence", "lifecycle.outcome", "lifecycle.reputation", "infra.memory_knowledge", "infra.insights"] },
];

export const canonicalEcosystemGraph = {
  kind: "connective_graph" as const,
  isTopLevelPlane: false as const,
  planes: [
    { id: "healthcare_universe" as const, label: "Healthcare Universe" },
    { id: "economic_resource" as const, label: "Economic & Resource" },
    { id: "lifecycle" as const, label: "Lifecycle" },
    { id: "operating_infrastructure" as const, label: "Operating Infrastructure" },
    { id: "compounding_business" as const, label: "Compounding Business" },
  ],
  nodes,
  edges,
  routeBindings,
  journeys,
  lenses,
  invariants: {
    patientDemandPrivateByDefault: true,
    eligibilityBeforeRanking: true,
    educationCompletionIsNotLicense: true,
    resumeIsNotVerifiedCredential: true,
    paymentIsNotAuthority: true,
    aiCannotSelfAuthorizeConsequentialActions: true,
    regulatedClinicalInventoryUsesOrdinaryPublicCommerce: false,
    transactionTruthOrder: [
      "match",
      "offer",
      "agreement",
      "reservation_or_assignment_or_order_or_appointment",
      "fulfillment",
      "evidence",
      "financial_obligation_where_applicable",
      "payment_or_payable_or_payout_where_applicable",
      "settlement_where_applicable",
      "reconciliation_where_applicable",
    ],
  },
} as const;

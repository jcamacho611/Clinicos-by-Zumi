import "server-only";

import {
  evaluateConnectorReadiness,
  type EconomicClass,
  type Gateway,
  type IntegrationClass,
  type OwnershipClass,
  type ReadinessGates,
} from "@/lib/connectors/taxonomy";

export type ConnectorCategory = "ai" | "healthcare" | "services";
export type ConnectorStatus = "planned" | "configurable" | "sandbox-ready" | "live";

/**
 * Canonical external-dependency record.
 *
 * `status` is retained as an implementation label for existing surfaces. It is NOT an
 * authorization decision. Production and PHI authorization come only from the
 * independent readiness gates evaluated below.
 */
export type ConnectorDefinition = {
  id: string;
  name: string;
  category: ConnectorCategory;
  status: ConnectorStatus;
  gateway: Gateway;
  integration: IntegrationClass;
  ownership: OwnershipClass;
  economics: EconomicClass;
  /** Server-side variables. Never serialized with values. */
  env: string[];
  /** Narrow browser exception for separately restricted public credentials. */
  publicEnv?: string[];
  handlesPhi: boolean;
  baaRequired: boolean;
  customerConnectable: boolean;
  gates: ReadinessGates;
  externalGate: string;
  notes: string;
};

const NO_GATES: ReadinessGates = {};

type ConnectorInput = Omit<ConnectorDefinition, "category" | "status"> & {
  category?: ConnectorCategory;
  status?: ConnectorStatus;
};

function categoryForGateway(gateway: Gateway): ConnectorCategory {
  if (gateway === "ai") return "ai";
  if (["healthcare_transaction", "clinical_network", "credentialing"].includes(gateway)) return "healthcare";
  return "services";
}

function connector(input: ConnectorInput): ConnectorDefinition {
  return {
    ...input,
    category: input.category ?? categoryForGateway(input.gateway),
    status: input.status ?? "planned",
  };
}

/**
 * No connector below is declared production-live or PHI-approved. Environment
 * variables are configuration, not evidence that contracts, security review,
 * enrollment, BAAs, or production approval happened.
 */
export const connectorCatalog: readonly ConnectorDefinition[] = [
  connector({
    id: "self_hosted",
    name: "Klinikos Self-Hosted Zumi Inference",
    gateway: "ai",
    integration: "server_only",
    ownership: "klinikos_owned",
    economics: "A_platform",
    env: ["ZUMI_SELF_HOSTED_BASE_URL", "ZUMI_SELF_HOSTED_MODEL"],
    handlesPhi: true,
    baaRequired: false,
    customerConnectable: false,
    gates: NO_GATES,
    status: "configurable",
    externalGate: "Deploy and security-review the Klinikos-controlled inference service; explicitly approve its data/logging/network posture before production or PHI use.",
    notes: "Preferred Zumi engine. Ownership removes per-message model-vendor dependence but does not automatically approve PHI. Optional internal bearer authentication uses ZUMI_SELF_HOSTED_API_KEY.",
  }),
  connector({
    id: "openai",
    name: "OpenAI",
    gateway: "ai",
    integration: "server_only",
    ownership: "klinikos_owned",
    economics: "A_platform",
    env: ["OPENAI_API_KEY"],
    handlesPhi: true,
    baaRequired: true,
    customerConnectable: true,
    gates: NO_GATES,
    externalGate: "Approved contract/security posture and, before PHI, an executed BAA plus explicit PHI approval.",
    notes: "Optional future provider adapter only. No OpenAI adapter is registered by the current Zumi runtime.",
  }),
  connector({
    id: "anthropic",
    name: "Anthropic",
    gateway: "ai",
    integration: "server_only",
    ownership: "klinikos_owned",
    economics: "A_platform",
    env: ["ANTHROPIC_API_KEY"],
    handlesPhi: true,
    baaRequired: true,
    customerConnectable: true,
    gates: NO_GATES,
    externalGate: "Approved contract/security posture and, before PHI, an executed BAA plus explicit PHI approval.",
    notes: "Optional future provider adapter only. It is not the canonical Zumi brain and is not registered by default.",
  }),
  connector({
    id: "google-ai",
    name: "Google Gemini / Vertex AI",
    gateway: "ai",
    integration: "server_only",
    ownership: "klinikos_owned",
    economics: "A_platform",
    env: ["GOOGLE_AI_API_KEY"],
    handlesPhi: true,
    baaRequired: true,
    customerConnectable: true,
    gates: NO_GATES,
    externalGate: "Approved contract/security posture and, before PHI, applicable BAA/terms plus explicit PHI approval.",
    notes: "Optional future provider adapter only; no direct browser model calls are permitted.",
  }),

  connector({
    id: "google-maps-js",
    name: "Google Maps JavaScript API",
    gateway: "location",
    integration: "browser_and_server",
    ownership: "klinikos_owned",
    economics: "A_platform",
    env: [],
    publicEnv: ["NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"],
    handlesPhi: false,
    baaRequired: false,
    customerConnectable: false,
    gates: NO_GATES,
    status: "configurable",
    externalGate: "Google Cloud billing account with the browser key restricted to approved klinikos.io origins and only required browser APIs.",
    notes: "The only public credential class in the catalog. Server APIs use a separate non-public key.",
  }),
  connector({ id: "google-places", name: "Google Places API", gateway: "location", integration: "server_only", ownership: "klinikos_owned", economics: "A_platform", env: ["GOOGLE_MAPS_API_KEY"], handlesPhi: false, baaRequired: false, customerConnectable: false, gates: NO_GATES, status: "configurable", externalGate: "Google Cloud billing with the server key restricted by API and deployment network.", notes: "Autocomplete, place details, and normalized place IDs for Grid." }),
  connector({ id: "google-geocoding", name: "Google Geocoding API", gateway: "location", integration: "server_only", ownership: "klinikos_owned", economics: "A_platform", env: ["GOOGLE_MAPS_API_KEY"], handlesPhi: false, baaRequired: false, customerConnectable: false, gates: NO_GATES, status: "configurable", externalGate: "Google Cloud billing with the server key restricted by API and deployment network.", notes: "Address normalization and coordinates for Grid resources and service areas." }),
  connector({ id: "google-routes", name: "Google Routes API", gateway: "location", integration: "server_only", ownership: "klinikos_owned", economics: "A_platform", env: ["GOOGLE_MAPS_API_KEY"], handlesPhi: false, baaRequired: false, customerConnectable: false, gates: NO_GATES, status: "configurable", externalGate: "Google Cloud billing with the server key restricted by API and deployment network.", notes: "Travel time and distance for deterministic Grid ranking." }),
  connector({ id: "google-route-matrix", name: "Google Route Matrix", gateway: "location", integration: "server_only", ownership: "klinikos_owned", economics: "A_platform", env: ["GOOGLE_MAPS_API_KEY"], handlesPhi: false, baaRequired: false, customerConnectable: false, gates: NO_GATES, status: "configurable", externalGate: "Google Cloud billing with the server key restricted by API and deployment network.", notes: "Bulk travel-time ranking for Grid matching." }),
  connector({ id: "google-address-validation", name: "Google Address Validation API", gateway: "location", integration: "server_only", ownership: "klinikos_owned", economics: "A_platform", env: ["GOOGLE_MAPS_API_KEY"], handlesPhi: false, baaRequired: false, customerConnectable: false, gates: NO_GATES, externalGate: "Enable only if address validation is needed and the server key is API/network restricted.", notes: "Optional normalized address validation for onboarding and marketplace records." }),

  connector({
    id: "stripe",
    name: "Stripe Payments",
    gateway: "payment",
    integration: "webhook_driven",
    ownership: "klinikos_owned",
    economics: "A_platform",
    env: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
    handlesPhi: false,
    baaRequired: false,
    customerConnectable: true,
    gates: NO_GATES,
    status: "configurable",
    externalGate: "Verified Stripe business account plus a registered, signature-verified webhook endpoint.",
    notes: "Payment/entitlement truth must come from verified server events, never a browser redirect. Keep PHI out of processor metadata.",
  }),
  connector({ id: "stripe-connect", name: "Stripe Connect", gateway: "payment", integration: "oauth_authorized", ownership: "clinic_owned", economics: "C_activate_after_sale", env: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_CONNECT_CLIENT_ID"], handlesPhi: false, baaRequired: false, customerConnectable: true, gates: NO_GATES, status: "configurable", externalGate: "Platform onboarding approval and supported connected-account configuration for marketplace payouts.", notes: "Grid settlement rail. Connection and payout status are server-owned, never inferred from a return URL." }),

  connector({ id: "twilio", name: "Twilio Messaging / Voice", gateway: "communication", integration: "webhook_driven", ownership: "clinic_owned", economics: "B_customer_owned", env: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"], handlesPhi: true, baaRequired: true, customerConnectable: true, gates: NO_GATES, status: "configurable", externalGate: "Clinic/platform Twilio relationship, executed BAA, security review, and HIPAA-eligible configuration before clinical messaging.", notes: "Klinikos owns workflow; Twilio is a replaceable delivery rail." }),
  connector({ id: "twilio-verify", name: "Twilio Verify", gateway: "communication", integration: "server_only", ownership: "klinikos_owned", economics: "A_platform", env: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_VERIFY_SERVICE_SID"], handlesPhi: false, baaRequired: false, customerConnectable: false, gates: NO_GATES, externalGate: "Provision an approved Verify service for account-verification traffic only.", notes: "Identity/contact verification, not clinical content." }),
  connector({ id: "resend", name: "Resend", gateway: "communication", integration: "server_only", ownership: "klinikos_owned", economics: "A_platform", env: ["RESEND_API_KEY"], handlesPhi: true, baaRequired: true, customerConnectable: false, gates: NO_GATES, status: "configurable", externalGate: "Verified sending domain; any PHI-bearing email additionally requires approved terms/BAA and explicit PHI approval.", notes: "Non-PHI lifecycle mail may be a separate use. Clinical content remains blocked until PHI gates pass." }),

  connector({ id: "stedi", name: "Stedi", gateway: "healthcare_transaction", integration: "regulated_network", ownership: "clinic_owned", economics: "B_customer_owned", env: ["STEDI_API_KEY", "STEDI_MODE"], handlesPhi: true, baaRequired: true, customerConnectable: true, gates: NO_GATES, status: "sandbox-ready", externalGate: "Executed BAA, production account, payer enrollment/testing, and explicit production approval.", notes: "Eligibility, claims, claim status, ERA, payer and X12 rail. Sandbox mode is never production evidence." }),
  connector({ id: "cms-blue-button", name: "CMS Blue Button", gateway: "healthcare_transaction", integration: "oauth_authorized", ownership: "patient_authorized", economics: "B_customer_owned", env: ["CMS_BLUE_BUTTON_CLIENT_ID", "CMS_BLUE_BUTTON_CLIENT_SECRET", "CMS_BLUE_BUTTON_MODE"], handlesPhi: true, baaRequired: false, customerConnectable: true, gates: NO_GATES, externalGate: "CMS production application approval and patient-authorized OAuth grant.", notes: "The patient authorizes access. A clinic cannot grant this on the patient's behalf." }),

  connector({ id: "nppes", name: "CMS NPPES", gateway: "credentialing", integration: "server_only", ownership: "klinikos_owned", economics: "A_platform", env: [], handlesPhi: false, baaRequired: false, customerConnectable: false, gates: NO_GATES, status: "configurable", externalGate: "Public source; remaining gate is tested adapter/reliability review.", notes: "NPI/taxonomy enrichment informs human credential review and never activates a provider." }),
  connector({ id: "labs", name: "Laboratory Interfaces", gateway: "clinical_network", integration: "regulated_network", ownership: "clinic_owned", economics: "B_customer_owned", env: [], handlesPhi: true, baaRequired: true, customerConnectable: true, gates: NO_GATES, externalGate: "Per-lab agreement, BAA as applicable, interface credentials, enrollment, and certification/testing.", notes: "Quest/Labcorp/BioReference or intermediary adapters belong behind one clinical-network gateway." }),
  connector({ id: "imaging", name: "Imaging / Radiology Interfaces", gateway: "clinical_network", integration: "regulated_network", ownership: "clinic_owned", economics: "B_customer_owned", env: [], handlesPhi: true, baaRequired: true, customerConnectable: true, gates: NO_GATES, externalGate: "Facility/intermediary agreement plus approved HL7/FHIR/PACS interface and security testing.", notes: "Manual documented fallback remains honest until a production interface is approved." }),
  connector({ id: "erx", name: "E-Prescribing Network", gateway: "clinical_network", integration: "regulated_network", ownership: "regulated_network", economics: "C_activate_after_sale", env: [], handlesPhi: true, baaRequired: true, customerConnectable: true, gates: NO_GATES, externalGate: "Certified vendor/network participation, identity proofing/EPCS requirements, contracts, enrollment, and certification testing.", notes: "A regulated network, categorically not an ordinary API-key integration." }),

  connector({ id: "state-license", name: "State Professional License Sources", gateway: "credentialing", integration: "server_only", ownership: "klinikos_owned", economics: "A_platform", env: [], handlesPhi: false, baaRequired: false, customerConnectable: false, gates: NO_GATES, externalGate: "Per-board source access and human verification path where no reliable API exists.", notes: "Source result is evidence, never credential approval authority." }),
  connector({ id: "oig-leie", name: "HHS OIG LEIE", gateway: "credentialing", integration: "server_only", ownership: "klinikos_owned", economics: "A_platform", env: [], handlesPhi: false, baaRequired: false, customerConnectable: false, gates: NO_GATES, externalGate: "Public dataset ingestion/matching implementation and validation.", notes: "Exclusion-screening evidence for human review." }),
  connector({ id: "sam-exclusions", name: "SAM.gov Exclusions", gateway: "credentialing", integration: "server_only", ownership: "klinikos_owned", economics: "A_platform", env: ["SAM_GOV_API_KEY"], handlesPhi: false, baaRequired: false, customerConnectable: false, gates: NO_GATES, externalGate: "SAM.gov API access plus validated matching/review workflow.", notes: "Never sole provider activation authority." }),
  connector({ id: "credentialing", name: "Credential Verification", gateway: "credentialing", integration: "server_only", ownership: "clinic_owned", economics: "C_activate_after_sale", env: [], handlesPhi: true, baaRequired: true, customerConnectable: true, gates: NO_GATES, externalGate: "Select/contract approved primary-source verification services and define human adjudication workflow.", notes: "License, malpractice, sanctions, certification inputs. Upload alone never authorizes work." }),
  connector({ id: "background-check", name: "Background Check Provider", gateway: "credentialing", integration: "server_only", ownership: "klinikos_owned", economics: "C_activate_after_sale", env: ["BACKGROUND_CHECK_API_KEY"], handlesPhi: false, baaRequired: false, customerConnectable: true, gates: NO_GATES, externalGate: "Vendor selection plus legally reviewed consent/adverse-action workflow where applicable.", notes: "Human decision required. Variable expense should follow a funded customer need." }),

  connector({ id: "storage", name: "Secure Object Storage", gateway: "document", integration: "server_only", ownership: "klinikos_owned", economics: "A_platform", env: ["OBJECT_STORAGE_ENDPOINT", "OBJECT_STORAGE_BUCKET", "OBJECT_STORAGE_ACCESS_KEY_ID", "OBJECT_STORAGE_SECRET_ACCESS_KEY"], handlesPhi: true, baaRequired: true, customerConnectable: false, gates: NO_GATES, externalGate: "Approved private object-storage deployment, encryption/access review, retention policy, and BAA where required.", notes: "Private buckets, signed expiring access, tenant ownership and audit." }),
  connector({ id: "esign", name: "Electronic Signature Provider", gateway: "document", integration: "webhook_driven", ownership: "klinikos_owned", economics: "C_activate_after_sale", env: ["ESIGN_PROVIDER", "ESIGN_API_KEY"], handlesPhi: true, baaRequired: true, customerConnectable: true, gates: NO_GATES, externalGate: "Approved vendor/contract; PHI-bearing documents require full PHI gates. Completion must be verified server-side.", notes: "Agreements and consents stay behind the document gateway." }),
  connector({ id: "daily", name: "Daily", gateway: "telehealth", integration: "server_only", ownership: "klinikos_owned", economics: "C_activate_after_sale", env: ["DAILY_API_KEY"], handlesPhi: true, baaRequired: true, customerConnectable: false, gates: NO_GATES, externalGate: "HIPAA-eligible account, executed BAA, security review, production configuration and explicit PHI approval.", notes: "Media transport only; visit authority remains in Klinikos." }),
];

export function getConnector(id: string) {
  return connectorCatalog.find((item) => item.id === id);
}

export function connectorsByGateway(gateway: Gateway) {
  return connectorCatalog.filter((item) => item.gateway === gateway);
}

export function connectorsByEconomicClass(economics: EconomicClass) {
  return connectorCatalog.filter((item) => item.economics === economics);
}

export function connectorReadiness(definition: ConnectorDefinition) {
  return evaluateConnectorReadiness({
    gates: definition.gates,
    handlesPhi: definition.handlesPhi,
    baaRequired: definition.baaRequired,
  });
}

export function customerConnectableConnectors() {
  return connectorCatalog.filter((item) => item.customerConnectable);
}

/** Backward-compatible configuration summary. Presence never means approved. */
export function connectorConfigStatus(definition: ConnectorDefinition) {
  const required = [...definition.env, ...(definition.publicEnv ?? [])];
  const configured = required.length === 0 || required.every((name) => Boolean(process.env[name]?.trim()));
  return {
    id: definition.id,
    name: definition.name,
    category: definition.category,
    status: definition.status,
    configured,
    handlesPhi: definition.handlesPhi,
    baaRequired: definition.baaRequired,
    customerConnectable: definition.customerConnectable,
  };
}

export function connectorStatusSummary() {
  const connectors = connectorCatalog.map(connectorConfigStatus);
  return {
    total: connectors.length,
    configured: connectors.filter((item) => item.configured).length,
    connectors,
  };
}

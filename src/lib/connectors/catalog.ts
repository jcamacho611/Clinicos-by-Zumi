import {
  evaluateConnectorReadiness,
  type EconomicClass,
  type Gateway,
  type IntegrationClass,
  type OwnershipClass,
  type ReadinessGates,
} from "@/lib/connectors/taxonomy";

/**
 * The Klinikos connector catalog.
 *
 * One row per external dependency, classified on every axis in `taxonomy.ts`. This is
 * the implementation matrix: what the vendor does, who owns the account, who bears the
 * cost, which gateway owns the call, what credentials are needed, and exactly which
 * gates remain before it may carry production traffic or PHI.
 *
 * Every `gates` field below is the honest current state. None of these connectors is
 * live: nothing in this repository has a contract, a BAA, or production credentials,
 * so every readiness gate is false and every connector reports Pending Connection.
 * Flipping a gate to true is a deliberate act that should accompany the actual
 * paperwork, not a convenience to make a demo look further along.
 *
 * Pure module — no environment reads. `status.ts` resolves configuration separately so
 * this data can be tested without a process environment.
 */

export type ConnectorDefinition = {
  id: string;
  name: string;
  gateway: Gateway;
  integration: IntegrationClass;
  ownership: OwnershipClass;
  economics: EconomicClass;
  /** Server-side environment variables required before the adapter may be used. */
  env: string[];
  /**
   * Public environment variables. Present only for `browser_and_server` connectors,
   * and separated so a public key can never be confused for a secret.
   */
  publicEnv?: string[];
  handlesPhi: boolean;
  baaRequired: boolean;
  /** Whether a clinic can connect its own existing account instead of using Klinikos'. */
  customerConnectable: boolean;
  gates: ReadinessGates;
  /** The concrete external step that unblocks this connector. */
  externalGate: string;
  notes: string;
};

const NO_GATES: ReadinessGates = {};

export const connectorCatalog: readonly ConnectorDefinition[] = [
  // -------------------------------------------------------------------------
  // AI Gateway — Class A platform infrastructure
  // -------------------------------------------------------------------------
  {
    id: "openai", name: "OpenAI", gateway: "ai", integration: "server_only",
    ownership: "klinikos_owned", economics: "A_platform",
    env: ["OPENAI_API_KEY"], handlesPhi: false, baaRequired: true, customerConnectable: true,
    gates: NO_GATES,
    externalGate: "Contracted account and, before any PHI workload, an executed BAA.",
    notes: "Primary provider candidate behind the Zumi AI Gateway. No adapter is registered, so Zumi reports Pending Connection.",
  },
  {
    id: "anthropic", name: "Anthropic", gateway: "ai", integration: "server_only",
    ownership: "klinikos_owned", economics: "A_platform",
    env: ["ANTHROPIC_API_KEY"], handlesPhi: false, baaRequired: true, customerConnectable: true,
    gates: NO_GATES,
    externalGate: "Contracted account and, before any PHI workload, an executed BAA.",
    notes: "Secondary provider candidate for routed workloads.",
  },
  {
    id: "google-ai", name: "Google Gemini / Vertex AI", gateway: "ai", integration: "server_only",
    ownership: "klinikos_owned", economics: "A_platform",
    env: ["GOOGLE_AI_API_KEY"], handlesPhi: false, baaRequired: true, customerConnectable: true,
    gates: NO_GATES,
    externalGate: "Contracted account and, before any PHI workload, an executed BAA.",
    notes: "Optional provider for future model routing.",
  },

  // -------------------------------------------------------------------------
  // Location Gateway — Class A. The one legitimate browser/server key split.
  // -------------------------------------------------------------------------
  {
    id: "google-maps-js", name: "Google Maps JavaScript API", gateway: "location", integration: "browser_and_server",
    ownership: "klinikos_owned", economics: "A_platform",
    env: [], publicEnv: ["NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"], handlesPhi: false, baaRequired: false, customerConnectable: false,
    gates: NO_GATES,
    externalGate: "Google Cloud billing account with the browser key restricted to approved klinikos.io origins.",
    notes: "Map rendering only. The public key must never be granted server-side APIs; those use the separate server key.",
  },
  {
    id: "google-places", name: "Google Places API", gateway: "location", integration: "server_only",
    ownership: "klinikos_owned", economics: "A_platform",
    env: ["GOOGLE_MAPS_API_KEY"], handlesPhi: false, baaRequired: false, customerConnectable: false,
    gates: NO_GATES,
    externalGate: "Google Cloud billing account with the server key restricted by API and IP.",
    notes: "Autocomplete, place details, and normalized place IDs for GRID.",
  },
  {
    id: "google-geocoding", name: "Google Geocoding API", gateway: "location", integration: "server_only",
    ownership: "klinikos_owned", economics: "A_platform",
    env: ["GOOGLE_MAPS_API_KEY"], handlesPhi: false, baaRequired: false, customerConnectable: false,
    gates: NO_GATES,
    externalGate: "Google Cloud billing account with the server key restricted by API and IP.",
    notes: "Address to coordinates for provider, location, and service-area records.",
  },
  {
    id: "google-routes", name: "Google Routes API", gateway: "location", integration: "server_only",
    ownership: "klinikos_owned", economics: "A_platform",
    env: ["GOOGLE_MAPS_API_KEY"], handlesPhi: false, baaRequired: false, customerConnectable: false,
    gates: NO_GATES,
    externalGate: "Google Cloud billing account with the server key restricted by API and IP.",
    notes: "Travel time and distance for GRID matching. The owner sees \"14 minutes away\", never a routing API.",
  },
  {
    id: "google-route-matrix", name: "Google Route Matrix", gateway: "location", integration: "server_only",
    ownership: "klinikos_owned", economics: "A_platform",
    env: ["GOOGLE_MAPS_API_KEY"], handlesPhi: false, baaRequired: false, customerConnectable: false,
    gates: NO_GATES,
    externalGate: "Google Cloud billing account with the server key restricted by API and IP.",
    notes: "Bulk origin/destination ranking for provider and location matching.",
  },

  // -------------------------------------------------------------------------
  // Payment Gateway — webhook-driven. A browser redirect is never proof of payment.
  // -------------------------------------------------------------------------
  {
    id: "stripe", name: "Stripe Payments", gateway: "payment", integration: "webhook_driven",
    ownership: "klinikos_owned", economics: "A_platform",
    env: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"], handlesPhi: false, baaRequired: false, customerConnectable: true,
    gates: NO_GATES,
    externalGate: "Stripe account, verified business details, and a registered webhook endpoint with its signing secret.",
    notes: "Subscriptions and checkout. Entitlement changes come from verified webhook events, never from a redirect. Keep PHI out of metadata.",
  },
  {
    id: "stripe-connect", name: "Stripe Connect", gateway: "payment", integration: "oauth_authorized",
    ownership: "clinic_owned", economics: "C_activate_after_sale",
    env: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_CONNECT_CLIENT_ID"], handlesPhi: false, baaRequired: false, customerConnectable: true,
    gates: NO_GATES,
    externalGate: "Stripe platform onboarding approval and connected-account configuration for marketplace payouts.",
    notes: "GRID payouts and platform fees. An account-connection flow, not a pasted secret key.",
  },

  // -------------------------------------------------------------------------
  // Communication Gateway
  // -------------------------------------------------------------------------
  {
    id: "twilio", name: "Twilio Messaging / Voice", gateway: "communication", integration: "webhook_driven",
    ownership: "clinic_owned", economics: "B_customer_owned",
    env: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"], handlesPhi: true, baaRequired: true, customerConnectable: true,
    gates: NO_GATES,
    externalGate: "Twilio account, executed BAA, and HIPAA-eligible configuration before any clinical messaging.",
    notes: "The clinic experiences Klinikos messaging; Twilio is the delivery rail. Many clinics already hold an account worth reusing.",
  },
  {
    id: "twilio-verify", name: "Twilio Verify", gateway: "communication", integration: "server_only",
    ownership: "klinikos_owned", economics: "A_platform",
    env: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_VERIFY_SERVICE_SID"], handlesPhi: false, baaRequired: false, customerConnectable: false,
    gates: NO_GATES,
    externalGate: "Twilio Verify service provisioned on the Klinikos account.",
    notes: "Phone verification for account activation and high-risk changes. Carries no clinical content.",
  },
  {
    id: "resend", name: "Resend", gateway: "communication", integration: "server_only",
    ownership: "klinikos_owned", economics: "A_platform",
    env: ["RESEND_API_KEY"], handlesPhi: false, baaRequired: true, customerConnectable: false,
    gates: NO_GATES,
    externalGate: "Resend account with a verified sending domain; PHI email additionally requires an executed BAA.",
    notes: "Transactional and acquisition email. Non-PHI lifecycle mail is the first use; clinical email stays blocked until approved.",
  },

  // -------------------------------------------------------------------------
  // Healthcare Transaction Gateway
  // -------------------------------------------------------------------------
  {
    id: "stedi", name: "Stedi", gateway: "healthcare_transaction", integration: "regulated_network",
    ownership: "clinic_owned", economics: "B_customer_owned",
    env: ["STEDI_API_KEY", "STEDI_MODE"], handlesPhi: true, baaRequired: true, customerConnectable: true,
    gates: NO_GATES,
    externalGate: "Stedi account, executed BAA, and per-payer enrollment before production 270/271, 837, 276/277 or 835 traffic.",
    notes: "Klinikos owns the eligibility and claims workflow; Stedi carries the X12. Sandbox and production must stay explicitly separate.",
  },
  {
    id: "nppes", name: "CMS NPPES", gateway: "credentialing", integration: "server_only",
    ownership: "klinikos_owned", economics: "A_platform",
    env: [], handlesPhi: false, baaRequired: false, customerConnectable: false,
    gates: NO_GATES,
    externalGate: "None — public API. Remaining work is the adapter itself.",
    notes: "NPI and taxonomy lookup. Informs credential review; never authorizes it.",
  },
  {
    id: "cms-blue-button", name: "CMS Blue Button", gateway: "healthcare_transaction", integration: "oauth_authorized",
    ownership: "patient_authorized", economics: "B_customer_owned",
    env: ["CMS_BLUE_BUTTON_CLIENT_ID", "CMS_BLUE_BUTTON_CLIENT_SECRET", "CMS_BLUE_BUTTON_MODE"], handlesPhi: true, baaRequired: false, customerConnectable: true,
    gates: NO_GATES,
    externalGate: "CMS application approval and a registered production redirect URI.",
    notes: "The patient authorizes this, not the clinic. Access follows the patient's grant and ends when they revoke it.",
  },

  // -------------------------------------------------------------------------
  // Clinical Network Gateway — regulated rails, not ordinary SaaS APIs
  // -------------------------------------------------------------------------
  {
    id: "labs", name: "Laboratory Interfaces", gateway: "clinical_network", integration: "regulated_network",
    ownership: "clinic_owned", economics: "B_customer_owned",
    env: [], handlesPhi: true, baaRequired: true, customerConnectable: true,
    gates: NO_GATES,
    externalGate: "Per-lab commercial agreement, interface credentials, and interface certification/testing.",
    notes: "A shared LabConnector interface with Quest, Labcorp and BioReference adapters beneath it — no lab-specific code in Klinikos business logic. Most clinics already hold these relationships.",
  },
  {
    id: "imaging", name: "Imaging / Radiology Interfaces", gateway: "clinical_network", integration: "regulated_network",
    ownership: "clinic_owned", economics: "B_customer_owned",
    env: [], handlesPhi: true, baaRequired: true, customerConnectable: true,
    gates: NO_GATES,
    externalGate: "Facility or intermediary agreement plus HL7/FHIR/PACS interface credentials.",
    notes: "An ImagingConnector interface with HL7, FHIR and PACS adapters beneath it. Manual workflow remains the fallback until connected.",
  },
  {
    id: "erx", name: "E-Prescribing Network", gateway: "clinical_network", integration: "regulated_network",
    ownership: "regulated_network", economics: "C_activate_after_sale",
    env: [], handlesPhi: true, baaRequired: true, customerConnectable: true,
    gates: NO_GATES,
    externalGate: "Certified vendor selection, network participation, EPCS identity proofing, and certification testing.",
    notes: "A PrescriptionNetworkConnector, kept separate because certification and identity requirements make it categorically unlike adding an API key.",
  },

  // -------------------------------------------------------------------------
  // Credentialing Gateway — informs human review, never replaces it
  // -------------------------------------------------------------------------
  {
    id: "state-license", name: "State Professional License Sources", gateway: "credentialing", integration: "server_only",
    ownership: "klinikos_owned", economics: "A_platform",
    env: [], handlesPhi: false, baaRequired: false, customerConnectable: false,
    gates: NO_GATES,
    externalGate: "Per-board access; many states have no reliable API and require human verification.",
    notes: "Adapter per board plus human review wherever no source exists. A returned result never activates a provider.",
  },
  {
    id: "oig-leie", name: "HHS OIG LEIE", gateway: "credentialing", integration: "server_only",
    ownership: "klinikos_owned", economics: "A_platform",
    env: [], handlesPhi: false, baaRequired: false, customerConnectable: false,
    gates: NO_GATES,
    externalGate: "None — public dataset. Remaining work is ingestion and matching.",
    notes: "Exclusion screening input for credential review. A clear result is not an approval.",
  },
  {
    id: "sam-exclusions", name: "SAM.gov Exclusions", gateway: "credentialing", integration: "server_only",
    ownership: "klinikos_owned", economics: "A_platform",
    env: ["SAM_GOV_API_KEY"], handlesPhi: false, baaRequired: false, customerConnectable: false,
    gates: NO_GATES,
    externalGate: "SAM.gov API key request and approval.",
    notes: "Federal exclusion and debarment screening. Never the sole activation authority.",
  },
  {
    id: "background-check", name: "Background Check Provider", gateway: "credentialing", integration: "server_only",
    ownership: "klinikos_owned", economics: "C_activate_after_sale",
    env: ["BACKGROUND_CHECK_API_KEY"], handlesPhi: false, baaRequired: false, customerConnectable: true,
    gates: NO_GATES,
    externalGate: "Vendor selection and FCRA-compliant consent and adverse-action workflow review.",
    notes: "Requires consent, role-based access, and a human decision. Ordered per candidate, so the cost follows the need.",
  },

  // -------------------------------------------------------------------------
  // Document Gateway
  // -------------------------------------------------------------------------
  {
    id: "storage", name: "Secure Object Storage", gateway: "document", integration: "server_only",
    ownership: "klinikos_owned", economics: "A_platform",
    env: ["OBJECT_STORAGE_ENDPOINT", "OBJECT_STORAGE_BUCKET", "OBJECT_STORAGE_ACCESS_KEY_ID", "OBJECT_STORAGE_SECRET_ACCESS_KEY"],
    handlesPhi: true, baaRequired: true, customerConnectable: false,
    gates: NO_GATES,
    externalGate: "Cloud storage account with an executed BAA and encryption/access configuration reviewed.",
    notes: "Private buckets, signed expiring URLs, tenant ownership, retention and audit. An encrypted database fallback exists today.",
  },
  {
    id: "esign", name: "Electronic Signature Provider", gateway: "document", integration: "webhook_driven",
    ownership: "klinikos_owned", economics: "C_activate_after_sale",
    env: ["ESIGN_PROVIDER", "ESIGN_API_KEY"], handlesPhi: true, baaRequired: true, customerConnectable: true,
    gates: NO_GATES,
    externalGate: "Vendor selection; PHI-bearing documents additionally require an executed BAA.",
    notes: "Contractor and chair-rental agreements, consents. Completion arrives by webhook, not by trusting a redirect.",
  },

  // -------------------------------------------------------------------------
  // Telehealth Gateway
  // -------------------------------------------------------------------------
  {
    id: "daily", name: "Daily", gateway: "telehealth", integration: "server_only",
    ownership: "klinikos_owned", economics: "C_activate_after_sale",
    env: ["DAILY_API_KEY"], handlesPhi: true, baaRequired: true, customerConnectable: false,
    gates: NO_GATES,
    externalGate: "Daily account on a HIPAA-eligible plan with an executed BAA.",
    notes: "Media transport only. The visit experience stays inside Klinikos — the clinic should never feel it left.",
  },
];

export function getConnector(id: string) {
  return connectorCatalog.find((connector) => connector.id === id);
}

export function connectorsByGateway(gateway: Gateway) {
  return connectorCatalog.filter((connector) => connector.gateway === gateway);
}

export function connectorsByEconomicClass(economics: EconomicClass) {
  return connectorCatalog.filter((connector) => connector.economics === economics);
}

/** Readiness for a connector, computed from its gates rather than asserted. */
export function connectorReadiness(connector: ConnectorDefinition) {
  return evaluateConnectorReadiness({
    gates: connector.gates,
    handlesPhi: connector.handlesPhi,
    baaRequired: connector.baaRequired,
  });
}

/**
 * Connectors a clinic can satisfy with an account it already holds.
 *
 * This is the list the Connections experience is built from. Reusing an existing
 * relationship lowers the clinic's total cost and is often the only lawful path,
 * since the enrollment belongs to them rather than to Klinikos.
 */
export function customerConnectableConnectors() {
  return connectorCatalog.filter((connector) => connector.customerConnectable);
}

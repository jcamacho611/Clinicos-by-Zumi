import "server-only";

export type ConnectorCategory = "ai" | "healthcare" | "services";
export type ConnectorStatus = "planned" | "configurable" | "sandbox-ready" | "live";

export type ConnectorDefinition = {
  id: string;
  name: string;
  category: ConnectorCategory;
  env: string[];
  handlesPhi: boolean;
  baaRequired: boolean;
  customerConnectable: boolean;
  status: ConnectorStatus;
  notes: string;
};

export const connectorCatalog: ConnectorDefinition[] = [
  { id: "openai", name: "OpenAI", category: "ai", env: ["OPENAI_API_KEY"], handlesPhi: true, baaRequired: true, customerConnectable: true, status: "configurable", notes: "Primary AI provider candidate behind the Klinikos AI Gateway. Do not send PHI until production approval and required agreements are complete." },
  { id: "anthropic", name: "Anthropic", category: "ai", env: ["ANTHROPIC_API_KEY"], handlesPhi: true, baaRequired: true, customerConnectable: true, status: "planned", notes: "Secondary AI provider candidate for routed workloads." },
  { id: "google-ai", name: "Google Gemini / Vertex AI", category: "ai", env: ["GOOGLE_AI_API_KEY"], handlesPhi: true, baaRequired: true, customerConnectable: true, status: "planned", notes: "Optional provider for future model routing." },

  { id: "google-maps-js", name: "Google Maps JavaScript API", category: "services", env: ["NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"], handlesPhi: false, baaRequired: false, customerConnectable: false, status: "configurable", notes: "GRID map rendering. Browser key must be origin restricted to approved Klinikos domains and limited to required APIs." },
  { id: "google-places", name: "Google Places API", category: "services", env: ["GOOGLE_MAPS_API_KEY"], handlesPhi: false, baaRequired: false, customerConnectable: false, status: "configurable", notes: "Provider/location autocomplete, place details, nearby discovery, and normalized place IDs for GRID." },
  { id: "google-geocoding", name: "Google Geocoding API", category: "services", env: ["GOOGLE_MAPS_API_KEY"], handlesPhi: false, baaRequired: false, customerConnectable: false, status: "configurable", notes: "Address to latitude/longitude and reverse geocoding for provider, clinic-chair, partner-location, and service-area records." },
  { id: "google-routes", name: "Google Routes API", category: "services", env: ["GOOGLE_MAPS_API_KEY"], handlesPhi: false, baaRequired: false, customerConnectable: false, status: "configurable", notes: "Travel time, distance, route computation, and provider-to-location matching for GRID." },
  { id: "google-route-matrix", name: "Google Route Matrix", category: "services", env: ["GOOGLE_MAPS_API_KEY"], handlesPhi: false, baaRequired: false, customerConnectable: false, status: "configurable", notes: "Bulk origin/destination distance and travel-time ranking for provider and location matching." },
  { id: "google-address-validation", name: "Google Address Validation API", category: "services", env: ["GOOGLE_MAPS_API_KEY"], handlesPhi: false, baaRequired: false, customerConnectable: false, status: "planned", notes: "Optional address normalization and deliverability validation for provider and partner-location onboarding." },

  { id: "stripe", name: "Stripe Payments", category: "services", env: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"], handlesPhi: false, baaRequired: false, customerConnectable: true, status: "configurable", notes: "Customer payments and booking charges. Keep PHI out of processor metadata." },
  { id: "stripe-connect", name: "Stripe Connect", category: "services", env: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_CONNECT_CLIENT_ID"], handlesPhi: false, baaRequired: false, customerConnectable: true, status: "configurable", notes: "GRID contractor/provider payouts, onboarding, connected accounts, transfer accounting, and platform fee support. Production use requires completed platform onboarding and supported account configuration." },

  { id: "twilio", name: "Twilio Messaging / Voice", category: "services", env: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"], handlesPhi: true, baaRequired: true, customerConnectable: true, status: "configurable", notes: "GRID booking notifications, callback workflows, SMS, and voice. PHI use requires approved configuration and agreements." },
  { id: "twilio-verify", name: "Twilio Verify", category: "services", env: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_VERIFY_SERVICE_SID"], handlesPhi: false, baaRequired: false, customerConnectable: false, status: "planned", notes: "Optional phone verification for provider/contractor account activation and high-risk account changes." },
  { id: "resend", name: "Resend", category: "services", env: ["RESEND_API_KEY"], handlesPhi: true, baaRequired: true, customerConnectable: false, status: "configurable", notes: "Transactional email candidate. Treat PHI email as blocked until vendor/compliance approval." },

  { id: "stedi", name: "Stedi", category: "healthcare", env: ["STEDI_API_KEY", "STEDI_MODE"], handlesPhi: true, baaRequired: true, customerConnectable: true, status: "sandbox-ready", notes: "Eligibility, claims, claim status, ERA, payer and X12 adapter candidate. Default to sandbox until production enrollment/BAA verification." },
  { id: "nppes", name: "CMS NPPES", category: "healthcare", env: [], handlesPhi: false, baaRequired: false, customerConnectable: false, status: "configurable", notes: "Public NPI and taxonomy lookup for provider identity and credential profile enrichment." },
  { id: "cms-blue-button", name: "CMS Blue Button", category: "healthcare", env: ["CMS_BLUE_BUTTON_CLIENT_ID", "CMS_BLUE_BUTTON_CLIENT_SECRET", "CMS_BLUE_BUTTON_MODE"], handlesPhi: true, baaRequired: false, customerConnectable: true, status: "planned", notes: "Patient-authorized Medicare claims connection where applicable. Keep sandbox and production modes explicit." },

  { id: "daily", name: "Daily", category: "services", env: ["DAILY_API_KEY"], handlesPhi: true, baaRequired: true, customerConnectable: false, status: "planned", notes: "Telemedicine video adapter candidate; production PHI use requires approved HIPAA configuration and BAA." },
  { id: "erx", name: "E-Prescribing Network", category: "healthcare", env: [], handlesPhi: true, baaRequired: true, customerConnectable: true, status: "planned", notes: "Vendor selection and certification/commercial requirements pending." },
  { id: "labs", name: "Laboratory Interfaces", category: "healthcare", env: [], handlesPhi: true, baaRequired: true, customerConnectable: true, status: "planned", notes: "Quest, Labcorp, BioReference and/or intermediary adapters. Contracts and credentials required." },
  { id: "imaging", name: "Imaging / Radiology Interfaces", category: "healthcare", env: [], handlesPhi: true, baaRequired: true, customerConnectable: true, status: "planned", notes: "HL7/FHIR/PACS vendor adapters with manual fallback until connected." },
  { id: "credentialing", name: "Credential Verification", category: "healthcare", env: [], handlesPhi: true, baaRequired: true, customerConnectable: true, status: "planned", notes: "Provider license, malpractice, sanctions, certification, and credential verification sources still require vendor selection and contracts. Upload alone never authorizes clinical work." },
  { id: "state-license", name: "State Professional License Sources", category: "healthcare", env: [], handlesPhi: false, baaRequired: false, customerConnectable: false, status: "planned", notes: "State-by-state nursing/medical license verification varies by board and jurisdiction; GRID must support adapters plus human review where no reliable API exists." },
  { id: "oig-leie", name: "HHS OIG LEIE", category: "healthcare", env: [], handlesPhi: false, baaRequired: false, customerConnectable: false, status: "planned", notes: "Exclusion screening source for credential-review workflows. Human review remains required before activation." },
  { id: "sam-exclusions", name: "SAM.gov Exclusions", category: "healthcare", env: ["SAM_GOV_API_KEY"], handlesPhi: false, baaRequired: false, customerConnectable: false, status: "planned", notes: "Federal exclusion/debarment screening input for GRID credential review; never used as sole activation authority." },

  { id: "storage", name: "Secure Object Storage", category: "services", env: ["OBJECT_STORAGE_ENDPOINT", "OBJECT_STORAGE_BUCKET", "OBJECT_STORAGE_ACCESS_KEY_ID", "OBJECT_STORAGE_SECRET_ACCESS_KEY"], handlesPhi: true, baaRequired: true, customerConnectable: false, status: "planned", notes: "Credential documents, agreements, and evidence should use encrypted private object storage with signed expiring URLs, tenant ownership, audit, retention, and approved BAA where PHI is possible." },
  { id: "esign", name: "Electronic Signature Provider", category: "services", env: ["ESIGN_PROVIDER", "ESIGN_API_KEY"], handlesPhi: true, baaRequired: true, customerConnectable: true, status: "planned", notes: "Contractor agreements, chair-rental agreements, consent/acknowledgment, and partner contracts. Vendor selection pending." },
  { id: "background-check", name: "Background Check Provider", category: "services", env: ["BACKGROUND_CHECK_API_KEY"], handlesPhi: false, baaRequired: false, customerConnectable: true, status: "planned", notes: "Optional screening workflow for participating organizations when legally appropriate. Must require consent, role-based access, adverse-action compliance where applicable, and human decision making." },
];

export function connectorConfigStatus(definition: ConnectorDefinition) {
  const configured = definition.env.length === 0 || definition.env.every((name) => Boolean(process.env[name]));
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
    configured: connectors.filter((connector) => connector.configured).length,
    connectors,
  };
}

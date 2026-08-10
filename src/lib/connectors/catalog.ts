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
  { id: "google-maps", name: "Google Maps Platform", category: "services", env: ["GOOGLE_MAPS_API_KEY", "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"], handlesPhi: false, baaRequired: false, customerConnectable: false, status: "configurable", notes: "GRID maps, geocoding, Places autocomplete, routes, travel-time and proximity ranking. Restrict browser keys by origin and server keys by API/IP." },
  { id: "stripe", name: "Stripe", category: "services", env: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"], handlesPhi: false, baaRequired: false, customerConnectable: true, status: "configurable", notes: "Payments and future Connect-based marketplace payouts. Keep PHI out of processor metadata." },
  { id: "twilio", name: "Twilio", category: "services", env: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"], handlesPhi: true, baaRequired: true, customerConnectable: true, status: "configurable", notes: "SMS/voice adapter candidate. PHI use requires approved configuration and agreements." },
  { id: "resend", name: "Resend", category: "services", env: ["RESEND_API_KEY"], handlesPhi: true, baaRequired: true, customerConnectable: false, status: "configurable", notes: "Transactional email candidate. Treat PHI email as blocked until vendor/compliance approval." },
  { id: "stedi", name: "Stedi", category: "healthcare", env: ["STEDI_API_KEY", "STEDI_MODE"], handlesPhi: true, baaRequired: true, customerConnectable: true, status: "sandbox-ready", notes: "Eligibility, claims, claim status, ERA, payer and X12 adapter candidate. Default to sandbox until production enrollment/BAA verification." },
  { id: "nppes", name: "CMS NPPES", category: "healthcare", env: [], handlesPhi: false, baaRequired: false, customerConnectable: false, status: "configurable", notes: "Public NPI and taxonomy lookup." },
  { id: "cms-blue-button", name: "CMS Blue Button", category: "healthcare", env: ["CMS_BLUE_BUTTON_CLIENT_ID", "CMS_BLUE_BUTTON_CLIENT_SECRET", "CMS_BLUE_BUTTON_MODE"], handlesPhi: true, baaRequired: false, customerConnectable: true, status: "planned", notes: "Patient-authorized Medicare claims connection where applicable. Keep sandbox and production modes explicit." },
  { id: "daily", name: "Daily", category: "services", env: ["DAILY_API_KEY"], handlesPhi: true, baaRequired: true, customerConnectable: false, status: "planned", notes: "Telemedicine video adapter candidate; production PHI use requires approved HIPAA configuration and BAA." },
  { id: "erx", name: "E-Prescribing Network", category: "healthcare", env: [], handlesPhi: true, baaRequired: true, customerConnectable: true, status: "planned", notes: "Vendor selection and certification/commercial requirements pending." },
  { id: "labs", name: "Laboratory Interfaces", category: "healthcare", env: [], handlesPhi: true, baaRequired: true, customerConnectable: true, status: "planned", notes: "Quest, Labcorp, BioReference and/or intermediary adapters. Contracts and credentials required." },
  { id: "imaging", name: "Imaging / Radiology Interfaces", category: "healthcare", env: [], handlesPhi: true, baaRequired: true, customerConnectable: true, status: "planned", notes: "HL7/FHIR/PACS vendor adapters with manual fallback until connected." },
  { id: "credentialing", name: "Credential Verification", category: "healthcare", env: [], handlesPhi: true, baaRequired: true, customerConnectable: true, status: "planned", notes: "Provider license, malpractice and credential verification source(s) still to be selected." },
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

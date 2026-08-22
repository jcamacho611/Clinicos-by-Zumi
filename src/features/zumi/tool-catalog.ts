export type ZumiToolRisk = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ZumiToolAction = "read" | "compute" | "draft" | "write" | "execute";
export type ZumiToolReadiness = "active" | "provider_capability" | "available_to_wire" | "configured" | "pending_connection" | "roadmap";

export type ZumiToolDescriptor = {
  key: string;
  family: string;
  label: string;
  description: string;
  actions: readonly ZumiToolAction[];
  risk: ZumiToolRisk;
  sendsDataExternally: boolean;
  publicResearchTool?: boolean;
  implementation: "internal" | "provider" | "connector" | "available_to_wire" | "roadmap";
  /** At least one value must be configured. */
  requiredEnvAny?: readonly string[];
  /** Every value must be configured. */
  requiredEnvAll?: readonly string[];
  requiresExplicitApprovalForWrite?: boolean;
};

export const zumiToolCatalog = [
  { key: "canonical_knowledge", family: "knowledge", label: "Klinikos knowledge", description: "Search canonical Klinikos product, architecture, security, commercial, and status material.", actions: ["read"], risk: "LOW", sendsDataExternally: false, implementation: "internal" },
  { key: "conversation_memory", family: "memory", label: "Conversation memory", description: "Recall approved durable user preferences and working context across sessions.", actions: ["read", "write"], risk: "MEDIUM", sendsDataExternally: false, implementation: "internal", requiresExplicitApprovalForWrite: true },
  { key: "web_search", family: "research", label: "Live web research", description: "Research current public information and collect source-backed evidence.", actions: ["read"], risk: "MEDIUM", sendsDataExternally: true, publicResearchTool: true, implementation: "provider", requiredEnvAny: ["OPENAI_API_KEY", "ZUMI_RESEARCH_BASE_URL"] },
  { key: "file_search", family: "knowledge", label: "File and document search", description: "Retrieve information from approved files and knowledge stores.", actions: ["read"], risk: "MEDIUM", sendsDataExternally: true, implementation: "provider", requiredEnvAny: ["ZUMI_OPENAI_VECTOR_STORE_ID"] },
  { key: "code_interpreter", family: "compute", label: "Computation and code", description: "Calculate, transform, analyze, simulate, or execute bounded code when it improves accuracy.", actions: ["compute"], risk: "MEDIUM", sendsDataExternally: true, implementation: "provider", requiredEnvAny: ["OPENAI_API_KEY"] },
  { key: "clinic_records", family: "operations", label: "Clinic operations", description: "Read authorized clinic work queues, scheduling, tasks, operational signals, and workflow state.", actions: ["read", "draft"], risk: "HIGH", sendsDataExternally: false, implementation: "internal" },
  { key: "quality_guardian", family: "assurance", label: "Quality Guardian", description: "Read the tenant/RBAC-scoped persisted active QualityGap backlog, project it through deterministic Quality Guardian orchestration, and prepare governed internal-first next actions. Current coverage is the persisted unresolved backlog only; it is not a population-wide CMS/NCQA/HEDIS/MIPS program calculation.", actions: ["read", "compute", "draft"], risk: "HIGH", sendsDataExternally: false, implementation: "internal" },
  { key: "patient_records", family: "clinical", label: "Patient context", description: "Use minimum-necessary patient information through approved tenant-scoped loaders only.", actions: ["read", "draft"], risk: "CRITICAL", sendsDataExternally: false, implementation: "available_to_wire" },
  { key: "grid", family: "marketplace", label: "Klinikos Grid", description: "Find, compare, match, request, reserve, and coordinate healthcare people, places, products, equipment, services, education, and capacity.", actions: ["read", "draft", "write"], risk: "HIGH", sendsDataExternally: false, implementation: "internal", requiresExplicitApprovalForWrite: true },
  { key: "grid_map", family: "location", label: "Grid interactive map", description: "Render reviewed Grid capacity and permission-derived user location through the primary MapLibre/OpenFreeMap path without a paid map credential.", actions: ["read", "compute"], risk: "MEDIUM", sendsDataExternally: true, implementation: "internal" },
  { key: "calendar", family: "productivity", label: "Calendar", description: "Inspect availability, propose meetings, and create or update events through an approved calendar connector.", actions: ["read", "draft", "write"], risk: "MEDIUM", sendsDataExternally: true, implementation: "connector", requiredEnvAny: ["GOOGLE_CALENDAR_CONNECTED", "MICROSOFT_CALENDAR_CONNECTED"], requiresExplicitApprovalForWrite: true },
  { key: "email", family: "communications", label: "Email", description: "Read authorized mail context, draft messages, and send only with approved connector permissions.", actions: ["read", "draft", "write"], risk: "HIGH", sendsDataExternally: true, implementation: "connector", requiredEnvAny: ["GMAIL_CONNECTED", "OUTLOOK_CONNECTED", "RESEND_API_KEY"], requiresExplicitApprovalForWrite: true },
  { key: "sms", family: "communications", label: "SMS", description: "Draft text communications, but keep product sending unavailable until Klinikos has durable consent/preferences, opt-out handling, and message-class policy. Twilio credentials configure transport only; they do not authorize contact.", actions: ["draft", "write"], risk: "HIGH", sendsDataExternally: true, implementation: "available_to_wire", requiredEnvAll: ["TWILIO_ACCOUNT_SID", "TWILIO_API_KEY_SID", "TWILIO_API_KEY_SECRET", "TWILIO_MESSAGING_SERVICE_SID"], requiresExplicitApprovalForWrite: true },
  { key: "voice", family: "communications", label: "Voice", description: "Support speech input/output, call workflows, transcripts, and approved voice-agent integrations.", actions: ["read", "draft", "write"], risk: "HIGH", sendsDataExternally: true, implementation: "connector", requiredEnvAny: ["TWILIO_ACCOUNT_SID", "DAILY_API_KEY"], requiresExplicitApprovalForWrite: true },
  { key: "documents", family: "documents", label: "Documents", description: "Search, summarize, classify, draft, and route authorized documents with provenance and review status.", actions: ["read", "draft", "write"], risk: "HIGH", sendsDataExternally: false, implementation: "internal", requiresExplicitApprovalForWrite: true },
  { key: "maps", family: "location", label: "Geocoding and routes", description: "Geocode permitted locations, compare travel distance, and calculate routes through an optional reviewed provider. Core Grid mapping and browser geolocation do not depend on this connector.", actions: ["read", "compute"], risk: "MEDIUM", sendsDataExternally: true, implementation: "connector", requiredEnvAny: ["GEOAPIFY_API_KEY", "GOOGLE_MAPS_API_KEY"] },
  { key: "payments", family: "finance", label: "Payments", description: "Inspect payment state, prepare checkout/payment actions, and reconcile settlement truthfully.", actions: ["read", "draft", "write", "execute"], risk: "CRITICAL", sendsDataExternally: true, implementation: "connector", requiredEnvAny: ["STRIPE_SECRET_KEY"], requiresExplicitApprovalForWrite: true },
  { key: "marketplace_payouts", family: "finance", label: "Marketplace payouts", description: "Prepare and reconcile seller/provider payouts with platform-fee accounting.", actions: ["read", "draft", "write", "execute"], risk: "CRITICAL", sendsDataExternally: true, implementation: "connector", requiredEnvAny: ["STRIPE_CONNECT_CLIENT_ID"], requiresExplicitApprovalForWrite: true },
  { key: "billing", family: "revenue_cycle", label: "Billing readiness", description: "Explain billing readiness, missing information, claim state, and revenue-cycle workflow.", actions: ["read", "draft", "write"], risk: "CRITICAL", sendsDataExternally: false, implementation: "internal", requiresExplicitApprovalForWrite: true },
  { key: "eligibility_claims", family: "revenue_cycle", label: "Eligibility and transactions", description: "Use approved healthcare transaction gateways for eligibility, claims, remittance, and payer data.", actions: ["read", "draft", "write"], risk: "CRITICAL", sendsDataExternally: true, implementation: "connector", requiredEnvAny: ["STEDI_API_KEY"], requiresExplicitApprovalForWrite: true },
  { key: "labs", family: "clinical", label: "Labs", description: "Prepare, route, retrieve, and track lab orders/results through approved integrations.", actions: ["read", "draft", "write"], risk: "CRITICAL", sendsDataExternally: true, implementation: "roadmap", requiresExplicitApprovalForWrite: true },
  { key: "imaging", family: "clinical", label: "Imaging", description: "Prepare, route, retrieve, and track imaging orders/results through approved HL7/FHIR/PACS integrations.", actions: ["read", "draft", "write"], risk: "CRITICAL", sendsDataExternally: true, implementation: "roadmap", requiresExplicitApprovalForWrite: true },
  { key: "telemedicine", family: "clinical", label: "Telemedicine", description: "Prepare and coordinate authorized virtual visits through an approved video provider.", actions: ["read", "draft", "write"], risk: "HIGH", sendsDataExternally: true, implementation: "connector", requiredEnvAny: ["DAILY_API_KEY"], requiresExplicitApprovalForWrite: true },
  { key: "identity_credentials", family: "trust", label: "Identity and credentials", description: "Inspect identity, licensure, credential, privilege, verification, and expiration state without autonomously approving credentials.", actions: ["read", "draft", "write"], risk: "CRITICAL", sendsDataExternally: false, implementation: "internal", requiresExplicitApprovalForWrite: true },
  { key: "security", family: "security", label: "Security intelligence", description: "Inspect authorized audit/security signals, explain risk, and prepare remediation while respecting step-up and approval gates.", actions: ["read", "draft"], risk: "CRITICAL", sendsDataExternally: false, implementation: "internal" },
  { key: "analytics", family: "analytics", label: "Analytics", description: "Analyze authorized operational, financial, marketplace, growth, and quality data.", actions: ["read", "compute"], risk: "MEDIUM", sendsDataExternally: false, implementation: "internal" },
  { key: "github", family: "engineering", label: "GitHub", description: "Inspect repositories, code, issues, pull requests, CI, and prepare engineering changes through approved development tooling.", actions: ["read", "draft", "write", "execute"], risk: "HIGH", sendsDataExternally: true, implementation: "connector", requiredEnvAny: ["GITHUB_CONNECTED"], requiresExplicitApprovalForWrite: true },
  { key: "database", family: "engineering", label: "Database", description: "Inspect or change authorized structured data through typed database tools; never accept model-generated arbitrary production SQL as authorization.", actions: ["read", "compute", "write"], risk: "CRITICAL", sendsDataExternally: false, implementation: "available_to_wire", requiresExplicitApprovalForWrite: true },
  { key: "browser", family: "computer_use", label: "Browser and web tasks", description: "Navigate approved websites and perform bounded browser actions when a browser-control adapter is available.", actions: ["read", "draft", "write", "execute"], risk: "HIGH", sendsDataExternally: true, implementation: "roadmap", requiresExplicitApprovalForWrite: true },
  { key: "vision", family: "multimodal", label: "Vision", description: "Interpret approved images, screenshots, diagrams, and visual context while preserving source and privacy boundaries.", actions: ["read"], risk: "MEDIUM", sendsDataExternally: true, implementation: "provider", requiredEnvAny: ["OPENAI_API_KEY", "GOOGLE_AI_API_KEY", "ANTHROPIC_API_KEY"] },
  { key: "device_presence", family: "ambient", label: "Device presence", description: "Receive approved device/surface context for hands-free and ambient assistance without covert monitoring.", actions: ["read"], risk: "HIGH", sendsDataExternally: false, implementation: "roadmap" },
] satisfies readonly ZumiToolDescriptor[];

function configured(env: Record<string, string | undefined>, key: string) {
  return typeof env[key] === "string" && env[key]!.trim().length > 0;
}

function anyConfigured(env: Record<string, string | undefined>, keys: readonly string[] | undefined) {
  return Boolean(keys?.some((key) => configured(env, key)));
}

function allConfigured(env: Record<string, string | undefined>, keys: readonly string[] | undefined) {
  return !keys?.length || keys.every((key) => configured(env, key));
}

export function resolveZumiToolReadiness(
  tool: ZumiToolDescriptor,
  env: Record<string, string | undefined> = process.env,
): ZumiToolReadiness {
  if (tool.implementation === "roadmap") return "roadmap";
  if (tool.implementation === "internal") return "active";
  if (tool.implementation === "available_to_wire") return "available_to_wire";

  const allSatisfied = allConfigured(env, tool.requiredEnvAll);
  const anySatisfied = tool.requiredEnvAny?.length ? anyConfigured(env, tool.requiredEnvAny) : true;
  const configuredForTool = allSatisfied && anySatisfied;

  if (tool.implementation === "provider") return configuredForTool ? "provider_capability" : "pending_connection";
  if (tool.implementation === "connector") return configuredForTool ? "configured" : "pending_connection";
  return "pending_connection";
}

export function resolvedZumiToolCatalog(env: Record<string, string | undefined> = process.env) {
  return zumiToolCatalog.map((tool) => ({ ...tool, readiness: resolveZumiToolReadiness(tool, env) }));
}

export function getZumiTool(key: string) {
  return zumiToolCatalog.find((tool) => tool.key === key) ?? null;
}

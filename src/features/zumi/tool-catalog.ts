export const zumiToolKinds = [
  "web_search",
  "knowledge_search",
  "code_interpreter",
  "function",
  "mcp",
  "computer",
  "image",
] as const;

export type ZumiToolKind = (typeof zumiToolKinds)[number];

export type ZumiToolRisk = "LOW" | "MEDIUM" | "HIGH";

export type ZumiToolDefinition = {
  key: string;
  kind: ZumiToolKind;
  label: string;
  description: string;
  risk: ZumiToolRisk;
  enabledByDefault: boolean;
  publicDataOnly?: boolean;
  requiresHumanApproval?: boolean;
  learnsFromUse?: boolean;
};

/**
 * Capability catalog, not a claim that every external connector is configured.
 * Provider adapters expose only tools whose deployment configuration is actually present.
 */
export const zumiToolCatalog: readonly ZumiToolDefinition[] = [
  {
    key: "web",
    kind: "web_search",
    label: "Live web research",
    description: "Search current public information, follow evidence, and cite sources.",
    risk: "LOW",
    enabledByDefault: true,
    publicDataOnly: true,
    learnsFromUse: true,
  },
  {
    key: "knowledge",
    kind: "knowledge_search",
    label: "Zumi knowledge retrieval",
    description: "Retrieve compact retained knowledge and prior research strategies.",
    risk: "LOW",
    enabledByDefault: true,
    learnsFromUse: true,
  },
  {
    key: "compute",
    kind: "code_interpreter",
    label: "Computation and analysis",
    description: "Use sandboxed code for calculations, statistics, parsing, transformation, and verification.",
    risk: "LOW",
    enabledByDefault: true,
    learnsFromUse: true,
  },
  {
    key: "functions",
    kind: "function",
    label: "Klinikos functions",
    description: "Invoke typed Klinikos application functions under existing authorization rules.",
    risk: "MEDIUM",
    enabledByDefault: true,
    requiresHumanApproval: false,
    learnsFromUse: true,
  },
  {
    key: "mcp",
    kind: "mcp",
    label: "Approved external tools",
    description: "Use explicitly configured MCP servers/connectors with per-server permissions and approvals.",
    risk: "MEDIUM",
    enabledByDefault: false,
    requiresHumanApproval: true,
    learnsFromUse: true,
  },
  {
    key: "computer",
    kind: "computer",
    label: "Computer interaction",
    description: "Interact with a graphical computer environment only for approved workflows.",
    risk: "HIGH",
    enabledByDefault: false,
    requiresHumanApproval: true,
    learnsFromUse: false,
  },
  {
    key: "image",
    kind: "image",
    label: "Image generation",
    description: "Create supporting visuals when the product experience calls for them.",
    risk: "LOW",
    enabledByDefault: false,
    learnsFromUse: false,
  },
] as const;

export function getZumiTool(key: string) {
  return zumiToolCatalog.find((tool) => tool.key === key) ?? null;
}

export type ZumiToolPolicy = {
  allowed: string[];
  approvalRequired: string[];
  unavailable: string[];
};

export function resolveZumiToolPolicy(input: {
  requested?: readonly string[];
  publicResearch: boolean;
  knowledgeConfigured: boolean;
  computationAllowed: boolean;
  configuredMcpKeys?: readonly string[];
}) : ZumiToolPolicy {
  const requested = new Set(input.requested ?? zumiToolCatalog.filter((tool) => tool.enabledByDefault).map((tool) => tool.key));
  const configuredMcp = new Set(input.configuredMcpKeys ?? []);
  const allowed: string[] = [];
  const approvalRequired: string[] = [];
  const unavailable: string[] = [];

  for (const tool of zumiToolCatalog) {
    if (!requested.has(tool.key)) continue;
    if (tool.key === "web" && !input.publicResearch) { unavailable.push(tool.key); continue; }
    if (tool.key === "knowledge" && !input.knowledgeConfigured) { unavailable.push(tool.key); continue; }
    if (tool.key === "compute" && !input.computationAllowed) { unavailable.push(tool.key); continue; }
    if (tool.key === "mcp" && configuredMcp.size === 0) { unavailable.push(tool.key); continue; }
    if (tool.key === "computer") { approvalRequired.push(tool.key); continue; }
    if (tool.requiresHumanApproval) approvalRequired.push(tool.key);
    else allowed.push(tool.key);
  }

  return { allowed, approvalRequired, unavailable };
}

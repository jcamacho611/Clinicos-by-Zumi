import { REDACTION_LIMITATION_NOTICE } from "@/features/zumi/redaction";

export type ZumiEnv = Record<string, string | undefined>;

export const providerHealthStates = [
  "NOT_CONFIGURED",
  "CONFIGURED",
  "HEALTHY",
  "DEGRADED",
  "ERROR",
  "DISABLED",
] as const;
export type ProviderHealthState = (typeof providerHealthStates)[number];

const USABLE: readonly ProviderHealthState[] = ["CONFIGURED", "HEALTHY", "DEGRADED"];

export function providerIsUsable(state: ProviderHealthState) {
  return USABLE.includes(state);
}

export type ZumiExternalSource = {
  url: string;
  title?: string | null;
};

export type ZumiMcpServer = {
  label: string;
  serverUrl?: string;
  connectorId?: string;
  requireApproval: boolean;
  allowedTools?: readonly string[];
};

export type ProviderRequest = {
  system: string;
  prompt: string;
  maxOutputTokens: number;
  timeoutMs: number;
  signal?: AbortSignal;
  previousResponseId?: string | null;
  allowWebSearch?: boolean;
  allowKnowledgeSearch?: boolean;
  allowCodeInterpreter?: boolean;
  allowedDomains?: readonly string[];
  mcpServers?: readonly ZumiMcpServer[];
};

export type ProviderResult = {
  text: string;
  inputTokens: number;
  outputTokens: number;
  costMicroUsd: number;
  modelId: string;
  responseId?: string | null;
  sources?: ZumiExternalSource[];
  toolsUsed?: string[];
};

export type ProviderAdapter = {
  key: string;
  label: string;
  modelId: string;
  requiredEnv: readonly string[];
  baaOnFile: boolean;
  invoke: (request: ProviderRequest) => Promise<ProviderResult>;
};

export type ProviderStatus = {
  key: string;
  label: string;
  modelId: string;
  state: ProviderHealthState;
  missingEnv: string[];
  baaOnFile: boolean;
  detail: string;
};

const registry = new Map<string, ProviderAdapter>();

export function registerProvider(adapter: ProviderAdapter) {
  registry.set(adapter.key, adapter);
  return adapter;
}

export function resetProviderRegistry() {
  registry.clear();
}

function missingEnvFor(adapter: ProviderAdapter, env: ZumiEnv) {
  return adapter.requiredEnv.filter((name) => {
    const value = env[name];
    return typeof value !== "string" || value.trim().length === 0;
  });
}

function killSwitchEngaged(env: ZumiEnv) {
  const value = env.ZUMI_DISABLED;
  return value === "1" || value?.toLowerCase() === "true";
}

export function providerStatus(adapter: ProviderAdapter, env: ZumiEnv = process.env): ProviderStatus {
  const base = { key: adapter.key, label: adapter.label, modelId: adapter.modelId, baaOnFile: adapter.baaOnFile };
  if (killSwitchEngaged(env)) {
    return { ...base, state: "DISABLED", missingEnv: [], detail: "Zumi is disabled for this deployment (ZUMI_DISABLED)." };
  }
  const missingEnv = missingEnvFor(adapter, env);
  if (missingEnv.length > 0) {
    return {
      ...base,
      state: "NOT_CONFIGURED",
      missingEnv,
      detail: `Pending connection. Missing configuration: ${missingEnv.join(", ")}.`,
    };
  }
  return { ...base, state: "CONFIGURED", missingEnv: [], detail: "Credentials present. Not yet exercised in this process." };
}

export function listProviderStatus(env: ZumiEnv = process.env): ProviderStatus[] {
  return [...registry.values()].map((adapter) => providerStatus(adapter, env));
}

export function selectProvider(env: ZumiEnv = process.env):
  | { ok: true; adapter: ProviderAdapter; status: ProviderStatus }
  | { ok: false; reason: "no_providers" | "disabled" | "not_configured" | "unknown_provider"; detail: string; statuses: ProviderStatus[] } {
  const statuses = listProviderStatus(env);
  if (registry.size === 0) {
    return { ok: false, reason: "no_providers", detail: "No Zumi model provider is registered. AI features are inert until an approved provider is contracted and configured.", statuses };
  }
  if (killSwitchEngaged(env)) return { ok: false, reason: "disabled", detail: "Zumi is disabled for this deployment (ZUMI_DISABLED).", statuses };

  const named = env.ZUMI_PROVIDER?.trim();
  if (named) {
    const adapter = registry.get(named);
    if (!adapter) return { ok: false, reason: "unknown_provider", detail: `ZUMI_PROVIDER names "${named}", which is not registered.`, statuses };
    const status = providerStatus(adapter, env);
    if (!providerIsUsable(status.state)) return { ok: false, reason: "not_configured", detail: status.detail, statuses };
    return { ok: true, adapter, status };
  }

  for (const adapter of registry.values()) {
    const status = providerStatus(adapter, env);
    if (providerIsUsable(status.state)) return { ok: true, adapter, status };
  }
  return { ok: false, reason: "not_configured", detail: "Every registered provider is missing configuration. Zumi reports Pending Connection rather than answering.", statuses };
}

export function phiEgressPermitted(adapter: ProviderAdapter, env: ZumiEnv = process.env) {
  const approved = env.ZUMI_PHI_EGRESS_APPROVED === "1";
  return { permitted: adapter.baaOnFile && approved, notice: REDACTION_LIMITATION_NOTICE };
}

export function zumiGatewayStatus(env: ZumiEnv = process.env) {
  const selection = selectProvider(env);
  if (selection.ok) {
    return {
      available: true as const,
      mode: "connected" as const,
      provider: selection.adapter.key,
      detail: `Zumi is connected to ${selection.adapter.label}. Output remains governed: every recommendation cites evidence and higher-risk capabilities require human review.`,
    };
  }
  return { available: false as const, mode: "pending_connection" as const, provider: null, detail: selection.detail };
}

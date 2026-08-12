/**
 * Zumi model provider registry.
 *
 * Every model call in Klinikos goes through one adapter surface. Nothing else in the
 * codebase is permitted to call a model provider directly, because scattered calls
 * make the two things that actually matter here — redaction before egress, and an
 * audit record after — impossible to guarantee.
 *
 * The registry reports honestly. A provider with no credentials/configuration is
 * NOT_CONFIGURED, not "ready". There is no fallback to a canned response that would
 * let a demo look live while nothing is connected.
 */

import { createSelfHostedZumiAdapter, selfHostedZumiRequested } from "@/features/zumi/adapters/self-hosted";
import { REDACTION_LIMITATION_NOTICE } from "@/features/zumi/redaction";

/** The narrow environment shape used by the provider boundary and tests. */
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

/** States in which a provider may be handed a request. */
const USABLE: readonly ProviderHealthState[] = ["CONFIGURED", "HEALTHY", "DEGRADED"];

export function providerIsUsable(state: ProviderHealthState) {
  return USABLE.includes(state);
}

export type ZumiExternalSource = {
  url: string;
  title?: string | null;
};

export type ProviderRequest = {
  /** Already redacted. The adapter must not be the first thing to see raw text. */
  system: string;
  prompt: string;
  maxOutputTokens: number;
  timeoutMs: number;
  signal?: AbortSignal;
  /** Optional provider-native conversation continuity. */
  previousResponseId?: string | null;
  /** Optional capabilities. An adapter that does not support one simply ignores it. */
  allowWebSearch?: boolean;
  allowKnowledgeSearch?: boolean;
  allowCodeInterpreter?: boolean;
  allowedDomains?: readonly string[];
  /** Hard ceiling supplied by the gateway. Provider adapters must never widen it. */
  maxToolCalls?: number;
};

export type ProviderResult = {
  text: string;
  inputTokens: number;
  outputTokens: number;
  /** Integer micro-USD. Money is never a float in this codebase. */
  costMicroUsd: number;
  modelId: string;
  /** Provider-native response identifier for continuation when supported. */
  responseId?: string | null;
  /** Public sources actually used by a research-capable provider. */
  sources?: ZumiExternalSource[];
  /** Tool types actually invoked, for audit/cost/strategy telemetry. */
  toolsUsed?: string[];
};

export type ProviderAdapter = {
  key: string;
  label: string;
  /** Model identifier this adapter will actually call, for the audit record. */
  modelId: string;
  /** Environment variables that must be present before the adapter may be used. */
  requiredEnv: readonly string[];
  /**
   * Whether a Business Associate Agreement is on file for this provider in this
   * deployment. This stays false for self-hosted inference until the broader PHI
   * deployment assurance model is deliberately generalized; ownership alone is not
   * approval to process PHI.
   */
  baaOnFile: boolean;
  invoke: (request: ProviderRequest) => Promise<ProviderResult>;
};

export type ProviderStatus = {
  key: string;
  label: string;
  modelId: string;
  state: ProviderHealthState;
  /** Which required variables are absent. Names only — never values. */
  missingEnv: string[];
  baaOnFile: boolean;
  detail: string;
};

const registry = new Map<string, ProviderAdapter>();

export function registerProvider(adapter: ProviderAdapter) {
  registry.set(adapter.key, adapter);
  return adapter;
}

/** Test seam. Runtime selection may re-register environment-backed built-ins. */
export function resetProviderRegistry() {
  registry.clear();
}

/**
 * Register built-in providers only when the deployment explicitly asks for them or
 * begins configuring them. This preserves the honest "no providers" state in a blank
 * environment while making `self_hosted` a first-class production option without an
 * application-level bootstrap side effect.
 */
function ensureEnvironmentProvidersRegistered(env: ZumiEnv) {
  if (selfHostedZumiRequested(env) && !registry.has("self_hosted")) {
    registerProvider(createSelfHostedZumiAdapter(env));
  }
}

function missingEnvFor(adapter: ProviderAdapter, env: ZumiEnv) {
  return adapter.requiredEnv.filter((name) => {
    const value = env[name];
    return typeof value !== "string" || value.trim().length === 0;
  });
}

/** `ZUMI_DISABLED=1` is a deployment-level kill switch. */
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

  return { ...base, state: "CONFIGURED", missingEnv: [], detail: "Configuration present. Not yet exercised in this process." };
}

export function listProviderStatus(env: ZumiEnv = process.env): ProviderStatus[] {
  ensureEnvironmentProvidersRegistered(env);
  return [...registry.values()].map((adapter) => providerStatus(adapter, env));
}

/**
 * The provider a request should use, or a stated reason there is none.
 *
 * Selection is explicit-first: `ZUMI_PROVIDER` names the adapter, and only when it is
 * unset does the registry fall back to the first usable one. An operator who names a
 * provider gets that provider or an error — never a silent substitution.
 */
export function selectProvider(env: ZumiEnv = process.env):
  | { ok: true; adapter: ProviderAdapter; status: ProviderStatus }
  | { ok: false; reason: "no_providers" | "disabled" | "not_configured" | "unknown_provider"; detail: string; statuses: ProviderStatus[] } {
  ensureEnvironmentProvidersRegistered(env);
  const statuses = listProviderStatus(env);

  if (registry.size === 0) {
    return {
      ok: false,
      reason: "no_providers",
      detail: "No Zumi model provider is registered. AI features are inert until an approved inference deployment is configured.",
      statuses,
    };
  }
  if (killSwitchEngaged(env)) {
    return { ok: false, reason: "disabled", detail: "Zumi is disabled for this deployment (ZUMI_DISABLED).", statuses };
  }

  const named = env.ZUMI_PROVIDER?.trim();
  if (named) {
    const adapter = registry.get(named);
    if (!adapter) {
      return { ok: false, reason: "unknown_provider", detail: `ZUMI_PROVIDER names "${named}", which is not registered.`, statuses };
    }
    const status = providerStatus(adapter, env);
    if (!providerIsUsable(status.state)) {
      return { ok: false, reason: "not_configured", detail: status.detail, statuses };
    }
    return { ok: true, adapter, status };
  }

  for (const adapter of registry.values()) {
    const status = providerStatus(adapter, env);
    if (providerIsUsable(status.state)) return { ok: true, adapter, status };
  }

  return {
    ok: false,
    reason: "not_configured",
    detail: "Every registered provider is missing configuration. Zumi reports Pending Connection rather than answering.",
    statuses,
  };
}

/**
 * Whether this deployment may send protected health information to its model provider.
 *
 * Two independent conditions, both required: the adapter declares a signed BAA, and
 * the deployment is explicitly flagged as approved for it. Neither alone is enough,
 * and the default answer is no. Self-hosting deliberately does not bypass this rule.
 */
export function phiEgressPermitted(adapter: ProviderAdapter, env: ZumiEnv = process.env) {
  const approved = env.ZUMI_PHI_EGRESS_APPROVED === "1";
  return {
    permitted: adapter.baaOnFile && approved,
    notice: REDACTION_LIMITATION_NOTICE,
  };
}

/** Status for surfaces that need to tell a user why Zumi is quiet. */
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
  return {
    available: false as const,
    mode: "pending_connection" as const,
    provider: null,
    detail: selection.detail,
  };
}

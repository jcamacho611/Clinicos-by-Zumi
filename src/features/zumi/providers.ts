/**
 * Zumi model provider registry.
 *
 * Every model call in Klinikos goes through one adapter surface. Nothing else in the
 * codebase is permitted to hold a provider SDK, because scattered calls make the two
 * things that actually matter here — redaction before egress, and an audit record
 * after — impossible to guarantee.
 *
 * The registry reports honestly. A provider with no credentials is NOT_CONFIGURED,
 * not "ready". There is no fallback to a canned response that would let a demo look
 * live while nothing is connected.
 *
 * Pure module: reads environment, never calls the network. The adapter that would
 * make the call is supplied at registration time.
 */

import { REDACTION_LIMITATION_NOTICE } from "@/features/zumi/redaction";

/**
 * The slice of the environment this module reads.
 *
 * Narrower than `NodeJS.ProcessEnv` on purpose: these functions need a string map and
 * nothing more, which keeps the test seam honest instead of casting fixtures.
 */
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

export type ProviderRequest = {
  /** Already redacted. The adapter must not be the first thing to see raw text. */
  system: string;
  prompt: string;
  maxOutputTokens: number;
  timeoutMs: number;
  signal?: AbortSignal;
};

export type ProviderResult = {
  text: string;
  inputTokens: number;
  outputTokens: number;
  /** Integer micro-USD. Money is never a float in this codebase. */
  costMicroUsd: number;
  modelId: string;
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
   * deployment. Declared per adapter and defaulted to false — a provider is not
   * PHI-eligible because someone assumed it was.
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

/** Test seam. Production code registers at module load and never clears. */
export function resetProviderRegistry() {
  registry.clear();
}

function missingEnvFor(adapter: ProviderAdapter, env: ZumiEnv) {
  return adapter.requiredEnv.filter((name) => {
    const value = env[name];
    return typeof value !== "string" || value.trim().length === 0;
  });
}

/**
 * `ZUMI_DISABLED=1` is a deployment-level kill switch.
 *
 * It exists so an operator can stop all AI egress without a redeploy, which is the
 * first thing anyone asks for after an incident.
 */
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
  const statuses = listProviderStatus(env);

  if (registry.size === 0) {
    return {
      ok: false,
      reason: "no_providers",
      detail: "No Zumi model provider is registered. AI features are inert until an approved provider is contracted and configured.",
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
 * and the default answer is no.
 */
export function phiEgressPermitted(adapter: ProviderAdapter, env: ZumiEnv = process.env) {
  const approved = env.ZUMI_PHI_EGRESS_APPROVED === "1";
  return {
    permitted: adapter.baaOnFile && approved,
    notice: REDACTION_LIMITATION_NOTICE,
  };
}

/**
 * Status for surfaces that need to tell a user why Zumi is quiet.
 *
 * Deliberately shaped like `eduAiGatewayStatus()` so EDU can adopt it without either
 * side inventing a second vocabulary for the same fact.
 */
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

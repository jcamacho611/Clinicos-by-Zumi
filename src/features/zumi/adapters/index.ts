import "server-only";

import { registerAnthropicAdapter } from "@/features/zumi/adapters/anthropic";
import { listProviderStatus } from "@/features/zumi/providers";

/**
 * Provider registration.
 *
 * Registering an adapter does **not** turn Zumi on. The registry still evaluates
 * credentials and reports `NOT_CONFIGURED` when they are absent, so with no key
 * present Zumi continues to refuse every request with "Pending Connection" exactly as
 * it did before this file existed.
 *
 * What registration changes is that the moment `ANTHROPIC_API_KEY` and
 * `ZUMI_ANTHROPIC_MODEL` are supplied, Zumi works — with no code change, no deploy of
 * new logic, and every governance control already in place. Both are required: the
 * adapter deliberately holds no default model, because a hard-coded identifier goes
 * stale and then fails against a clinic rather than at configuration time.
 *
 * Idempotent: the registry is keyed by adapter, so repeated calls in a hot-reloading
 * dev server replace rather than accumulate.
 */

let registered = false;

export function ensureProvidersRegistered() {
  if (registered) return;
  registerAnthropicAdapter();
  registered = true;
}

/** Provider status after registration, for surfaces that report connection state. */
export function providerStatusReport() {
  ensureProvidersRegistered();
  return listProviderStatus();
}

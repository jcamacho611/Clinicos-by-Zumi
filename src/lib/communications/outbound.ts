import "server-only";

/**
 * The outbound communications port.
 *
 * One place decides whether a message actually left Klinikos. Everything upstream —
 * the follow-up loop, account activation, anything added later — asks this port and
 * records what it says, rather than inferring delivery from the fact that a connector
 * has credentials.
 *
 * The distinction this port exists to preserve, in order of increasing truth:
 *
 *   `no_connector`  — nothing is configured for this channel.
 *   `no_sender`     — a connector is configured, but Klinikos has no code that sends
 *                     on this channel. This is the state that used to be reported as
 *                     "done": readiness was mistaken for capability.
 *   `provider_error`— a real send was attempted and the provider refused it.
 *   `accepted`      — a provider accepted the message and returned a reference.
 *
 * Only `accepted` means a message left the building, and only `accepted` carries a
 * provider reference. A caller that cannot produce one has not delivered anything.
 */

export const outboundChannels = ["email", "sms"] as const;
export type OutboundChannel = (typeof outboundChannels)[number];

export type OutboundMessage = {
  channel: OutboundChannel;
  to: string;
  subject: string;
  body: string;
};

export type OutboundResult =
  | { ok: true; providerReference: string; provider: string }
  | { ok: false; reason: "no_connector" | "no_sender" | "provider_error" | "invalid_recipient"; detail: string };

export type OutboundEnv = Record<string, string | undefined>;

/**
 * A channel's sending implementation.
 *
 * `configured` answers "are credentials present"; the existence of the adapter itself
 * answers "is there code that sends". Both are required, and they are deliberately
 * separate questions — conflating them is the defect this module was written for.
 */
export type OutboundAdapter = {
  channel: OutboundChannel;
  provider: string;
  /**
   * The connector catalog entry this adapter actually sends through.
   *
   * Required, because compliance questions are asked about the rail a message will
   * take, and only the adapter knows which rail that is. A gateway-wide answer — "some
   * communication connector is approved for PHI" — is not an answer about this one:
   * Twilio being approved would say nothing about Resend, which is what would carry
   * the message.
   */
  connectorId: string;
  configured: (env: OutboundEnv) => boolean;
  send: (message: OutboundMessage, env: OutboundEnv) => Promise<OutboundResult>;
};

const adapters = new Map<OutboundChannel, OutboundAdapter>();
let registered = false;

export function registerOutboundAdapter(adapter: OutboundAdapter) {
  adapters.set(adapter.channel, adapter);
  // An explicit registration also satisfies the lazy default, so the defaults can never
  // be installed afterwards and silently replace it. Without this, registering an
  // adapter before the first send is overwritten on that send — which looks like the
  // adapter being ignored for no reason.
  registered = true;
  return adapter;
}

/** Test seam. Production registers once at module load. */
export function resetOutboundAdapters() {
  adapters.clear();
  registered = false;
}

/**
 * Email, via Resend.
 *
 * This is a real sender: it performs an HTTP request and reports what the provider
 * said. It is the only channel with an implementation today.
 */
const resendEmailAdapter: OutboundAdapter = {
  channel: "email",
  provider: "resend",
  connectorId: "resend",
  configured: (env) => Boolean(env.RESEND_API_KEY?.trim()),
  send: async (message, env) => {
    if (!message.to.includes("@")) {
      return { ok: false, reason: "invalid_recipient", detail: "The recipient is not an email address." };
    }
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${env.RESEND_API_KEY?.trim()}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: env.ACCESS_EMAIL_FROM || "Klinikos <no-reply@klinikos.io>",
        to: [message.to],
        subject: message.subject,
        text: message.body,
      }),
    }).catch(() => null);

    if (!response) return { ok: false, reason: "provider_error", detail: "The email provider could not be reached." };
    if (!response.ok) {
      // The provider's body is not forwarded; it echoes the message, which may name a
      // patient. The status is enough to decide whether to retry.
      return { ok: false, reason: "provider_error", detail: `The email provider returned ${response.status}.` };
    }

    const payload = (await response.json().catch(() => null)) as { id?: string } | null;
    // No id means Klinikos cannot evidence the send, and an unevidenced send is not
    // one this port is willing to call accepted.
    if (!payload?.id) return { ok: false, reason: "provider_error", detail: "The email provider accepted without a reference." };
    return { ok: true, providerReference: payload.id, provider: "resend" };
  },
};

export function ensureOutboundAdaptersRegistered() {
  if (registered) return;
  registerOutboundAdapter(resendEmailAdapter);
  // There is deliberately no SMS adapter. Twilio appears in the connector catalog and
  // a deployment may hold credentials for it, but no Klinikos code sends an SMS — so
  // the port reports `no_sender` for that channel rather than letting credentials be
  // mistaken for the ability to send.
  registered = true;
}

/**
 * Whether this channel could deliver right now, and why not if it could not.
 *
 * Pure: reads the environment, never calls out. Callers that must decide a state
 * before attempting a send use this.
 */
export function outboundChannelStatus(channel: OutboundChannel, env: OutboundEnv = process.env) {
  ensureOutboundAdaptersRegistered();
  const adapter = adapters.get(channel);
  if (!adapter) return { deliverable: false as const, reason: "no_sender" as const, detail: `Klinikos has no ${channel} sending implementation.` };
  if (!adapter.configured(env)) {
    return { deliverable: false as const, reason: "no_connector" as const, detail: `No ${channel} provider is configured for this deployment.` };
  }
  // The connector id travels with the answer so a caller asking a compliance question
  // asks it about this adapter rather than about the gateway it belongs to.
  return { deliverable: true as const, provider: adapter.provider, connectorId: adapter.connectorId };
}

/** Attempt a real send. Never throws — the failure is the answer. */
export async function deliverOutbound(message: OutboundMessage, env: OutboundEnv = process.env): Promise<OutboundResult> {
  const status = outboundChannelStatus(message.channel, env);
  if (!status.deliverable) return { ok: false, reason: status.reason, detail: status.detail };

  const adapter = adapters.get(message.channel);
  if (!adapter) return { ok: false, reason: "no_sender", detail: `Klinikos has no ${message.channel} sending implementation.` };

  try {
    return await adapter.send(message, env);
  } catch {
    return { ok: false, reason: "provider_error", detail: "The provider request failed." };
  }
}

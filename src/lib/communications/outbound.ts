import "server-only";

import { sendTwilioSms, twilioApiKeyCredentials } from "@/lib/communications/twilio";

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
 *                     on this channel.
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

export type OutboundAdapter = {
  channel: OutboundChannel;
  provider: string;
  connectorId: string;
  configured: (env: OutboundEnv) => boolean;
  send: (message: OutboundMessage, env: OutboundEnv) => Promise<OutboundResult>;
};

const adapters = new Map<OutboundChannel, OutboundAdapter>();
let registered = false;

export function registerOutboundAdapter(adapter: OutboundAdapter) {
  adapters.set(adapter.channel, adapter);
  registered = true;
  return adapter;
}

export function resetOutboundAdapters() {
  adapters.clear();
  registered = false;
}

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
    if (!response.ok) return { ok: false, reason: "provider_error", detail: `The email provider returned ${response.status}.` };

    const payload = (await response.json().catch(() => null)) as { id?: string } | null;
    if (!payload?.id) return { ok: false, reason: "provider_error", detail: "The email provider accepted without a reference." };
    return { ok: true, providerReference: payload.id, provider: "resend" };
  },
};

/**
 * SMS via Twilio Messaging Service using a restricted API-key SID/secret.
 * PHI/clinical message authorization remains a separate fail-closed policy decision.
 */
const twilioSmsAdapter: OutboundAdapter = {
  channel: "sms",
  provider: "twilio",
  connectorId: "twilio",
  configured: (env) => Boolean(twilioApiKeyCredentials(env) && env.TWILIO_MESSAGING_SERVICE_SID?.trim()),
  send: async (message, env) => {
    const result = await sendTwilioSms({ to: message.to, body: message.body, env });
    if (result.ok) return { ok: true, providerReference: result.sid, provider: "twilio" };
    if (result.reason === "invalid_recipient") return { ok: false, reason: "invalid_recipient", detail: result.detail };
    if (result.reason === "not_configured") return { ok: false, reason: "no_connector", detail: result.detail };
    return { ok: false, reason: "provider_error", detail: result.detail };
  },
};

export function ensureOutboundAdaptersRegistered() {
  if (registered) return;
  registerOutboundAdapter(resendEmailAdapter);
  registerOutboundAdapter(twilioSmsAdapter);
  registered = true;
}

export function outboundChannelStatus(channel: OutboundChannel, env: OutboundEnv = process.env) {
  ensureOutboundAdaptersRegistered();
  const adapter = adapters.get(channel);
  if (!adapter) return { deliverable: false as const, reason: "no_sender" as const, detail: `Klinikos has no ${channel} sending implementation.` };
  if (!adapter.configured(env)) {
    return { deliverable: false as const, reason: "no_connector" as const, detail: `No ${channel} provider is configured for this deployment.` };
  }
  return { deliverable: true as const, provider: adapter.provider, connectorId: adapter.connectorId };
}

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

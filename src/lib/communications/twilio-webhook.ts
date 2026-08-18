import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Validate Twilio's form-encoded webhook signature.
 *
 * Twilio signs the exact public URL followed by form parameters sorted by name.
 * This helper intentionally accepts the public URL as an argument so callers can
 * reconstruct the externally configured URL correctly when running behind a proxy.
 */
export function validateTwilioWebhookSignature(input: {
  publicUrl: string;
  params: URLSearchParams;
  signature: string | null | undefined;
  authToken: string | null | undefined;
}) {
  const signature = input.signature?.trim() ?? "";
  const authToken = input.authToken?.trim() ?? "";
  if (!signature || !authToken || !input.publicUrl.trim()) return false;

  const valuesByKey = new Map<string, string[]>();
  for (const [key, value] of input.params.entries()) {
    const existing = valuesByKey.get(key) ?? [];
    existing.push(value);
    valuesByKey.set(key, existing);
  }

  let payload = input.publicUrl;
  for (const key of Array.from(valuesByKey.keys()).sort()) {
    for (const value of valuesByKey.get(key) ?? []) payload += `${key}${value}`;
  }

  const expected = createHmac("sha1", authToken).update(payload, "utf8").digest("base64");
  return safeEqual(expected, signature);
}

export type InboundSmsCommand = "stop" | "start" | "help" | "other";

// These are conservative fallback keywords for deployments where Twilio does not send
// OptOutType. When signed OptOutType is present, Klinikos trusts Twilio's provider-side
// classification instead of re-interpreting the body.
const STOP_WORDS = new Set(["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT", "REVOKE", "OPTOUT"]);
const START_WORDS = new Set(["START", "UNSTOP"]);
const HELP_WORDS = new Set(["HELP", "INFO"]);

export function classifyInboundSmsCommand(body: string): InboundSmsCommand {
  const normalized = body.trim().toUpperCase().replace(/\s+/g, " ");
  if (STOP_WORDS.has(normalized)) return "stop";
  if (START_WORDS.has(normalized)) return "start";
  if (HELP_WORDS.has(normalized)) return "help";
  return "other";
}

export function classifySignedTwilioOptOut(input: {
  optOutType?: string | null;
  body: string;
}): InboundSmsCommand {
  const declared = input.optOutType?.trim().toUpperCase();
  if (declared === "STOP") return "stop";
  if (declared === "START") return "start";
  if (declared === "HELP") return "help";
  return classifyInboundSmsCommand(input.body);
}

import "server-only";

export type TwilioEnv = Record<string, string | undefined>;

type TwilioApiKeyCredentials = {
  accountSid: string;
  apiKeySid: string;
  apiKeySecret: string;
};

function clean(value: string | undefined) {
  return value?.trim() ?? "";
}

function e164(value: string) {
  return /^\+[1-9]\d{7,14}$/.test(value);
}

export function twilioApiKeyCredentials(env: TwilioEnv = process.env): TwilioApiKeyCredentials | null {
  const accountSid = clean(env.TWILIO_ACCOUNT_SID);
  const apiKeySid = clean(env.TWILIO_API_KEY_SID);
  const apiKeySecret = clean(env.TWILIO_API_KEY_SECRET);
  if (!accountSid || !apiKeySid || !apiKeySecret) return null;
  if (!accountSid.startsWith("AC") || !apiKeySid.startsWith("SK")) return null;
  return { accountSid, apiKeySid, apiKeySecret };
}

function authorization(credentials: TwilioApiKeyCredentials) {
  return `Basic ${Buffer.from(`${credentials.apiKeySid}:${credentials.apiKeySecret}`).toString("base64")}`;
}

async function twilioFormRequest(input: {
  url: string;
  body: URLSearchParams;
  credentials: TwilioApiKeyCredentials;
}) {
  return fetch(input.url, {
    method: "POST",
    headers: {
      authorization: authorization(input.credentials),
      "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: input.body.toString(),
  }).catch(() => null);
}

export type TwilioSendResult =
  | { ok: true; sid: string; status: string | null }
  | { ok: false; reason: "not_configured" | "invalid_recipient" | "provider_error"; detail: string };

/**
 * Send a non-PHI SMS through a Twilio Messaging Service using a restricted API key.
 *
 * The API-key SID/secret authenticate outbound REST calls. The Twilio master Auth Token
 * is intentionally not used here. Clinical/PHI messaging remains separately gated by
 * connector policy, BAA/security posture, minimum-necessary content, and human approval.
 */
export async function sendTwilioSms(input: {
  to: string;
  body: string;
  env?: TwilioEnv;
}): Promise<TwilioSendResult> {
  const env = input.env ?? process.env;
  const credentials = twilioApiKeyCredentials(env);
  const messagingServiceSid = clean(env.TWILIO_MESSAGING_SERVICE_SID);

  if (!credentials || !messagingServiceSid) {
    return {
      ok: false,
      reason: "not_configured",
      detail: "Twilio restricted API-key credentials and a Messaging Service SID are required.",
    };
  }
  if (!e164(input.to)) {
    return { ok: false, reason: "invalid_recipient", detail: "SMS recipient must be a valid E.164 phone number." };
  }
  if (!input.body.trim()) {
    return { ok: false, reason: "provider_error", detail: "SMS body is empty." };
  }

  const body = new URLSearchParams({
    To: input.to,
    Body: input.body,
    MessagingServiceSid: messagingServiceSid,
  });
  const response = await twilioFormRequest({
    url: `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(credentials.accountSid)}/Messages.json`,
    body,
    credentials,
  });

  if (!response) return { ok: false, reason: "provider_error", detail: "Twilio could not be reached." };
  if (!response.ok) {
    // Do not forward Twilio's provider body. It can echo recipient/message data.
    return { ok: false, reason: "provider_error", detail: `Twilio returned HTTP ${response.status}.` };
  }

  const payload = (await response.json().catch(() => null)) as { sid?: string; status?: string | null } | null;
  if (!payload?.sid) return { ok: false, reason: "provider_error", detail: "Twilio accepted the request without an evidentiary message SID." };
  return { ok: true, sid: payload.sid, status: payload.status ?? null };
}

export type TwilioVerifyResult =
  | { ok: true; sid: string; status: string }
  | { ok: false; reason: "not_configured" | "invalid_recipient" | "invalid_code" | "provider_error"; detail: string };

function verifyService(env: TwilioEnv) {
  const serviceSid = clean(env.TWILIO_VERIFY_SERVICE_SID);
  return serviceSid.startsWith("VA") ? serviceSid : null;
}

/** Start phone-possession verification. This is identity/contact verification, not clinical messaging. */
export async function startTwilioPhoneVerification(input: { to: string; env?: TwilioEnv }): Promise<TwilioVerifyResult> {
  const env = input.env ?? process.env;
  const credentials = twilioApiKeyCredentials(env);
  const serviceSid = verifyService(env);
  if (!credentials || !serviceSid) {
    return { ok: false, reason: "not_configured", detail: "Twilio Verify is not fully configured." };
  }
  if (!e164(input.to)) return { ok: false, reason: "invalid_recipient", detail: "Verification recipient must be a valid E.164 phone number." };

  const response = await twilioFormRequest({
    url: `https://verify.twilio.com/v2/Services/${encodeURIComponent(serviceSid)}/Verifications`,
    body: new URLSearchParams({ To: input.to, Channel: "sms" }),
    credentials,
  });
  if (!response) return { ok: false, reason: "provider_error", detail: "Twilio Verify could not be reached." };
  if (!response.ok) return { ok: false, reason: "provider_error", detail: `Twilio Verify returned HTTP ${response.status}.` };
  const payload = (await response.json().catch(() => null)) as { sid?: string; status?: string } | null;
  if (!payload?.sid || !payload.status) return { ok: false, reason: "provider_error", detail: "Twilio Verify returned no verification reference." };
  return { ok: true, sid: payload.sid, status: payload.status };
}

/** Check a code for a previously started phone-possession verification. */
export async function checkTwilioPhoneVerification(input: { to: string; code: string; env?: TwilioEnv }): Promise<TwilioVerifyResult> {
  const env = input.env ?? process.env;
  const credentials = twilioApiKeyCredentials(env);
  const serviceSid = verifyService(env);
  if (!credentials || !serviceSid) {
    return { ok: false, reason: "not_configured", detail: "Twilio Verify is not fully configured." };
  }
  if (!e164(input.to)) return { ok: false, reason: "invalid_recipient", detail: "Verification recipient must be a valid E.164 phone number." };
  if (!/^\d{4,10}$/.test(input.code.trim())) return { ok: false, reason: "invalid_code", detail: "Verification code format is invalid." };

  const response = await twilioFormRequest({
    url: `https://verify.twilio.com/v2/Services/${encodeURIComponent(serviceSid)}/VerificationCheck`,
    body: new URLSearchParams({ To: input.to, Code: input.code.trim() }),
    credentials,
  });
  if (!response) return { ok: false, reason: "provider_error", detail: "Twilio Verify could not be reached." };
  if (!response.ok) return { ok: false, reason: "provider_error", detail: `Twilio Verify returned HTTP ${response.status}.` };
  const payload = (await response.json().catch(() => null)) as { sid?: string; status?: string } | null;
  if (!payload?.sid || !payload.status) return { ok: false, reason: "provider_error", detail: "Twilio Verify returned no verification result." };
  return { ok: true, sid: payload.sid, status: payload.status };
}

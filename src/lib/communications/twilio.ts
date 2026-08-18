import "server-only";

export type TwilioEnv = Record<string, string | undefined>;

type TwilioApiKeyCredentials = {
  accountSid: string;
  apiKeySid: string;
  apiKeySecret: string;
};

function clean(value: string | undefined | null) {
  return value?.trim() ?? "";
}

function e164(value: string) {
  return /^\+[1-9]\d{7,14}$/.test(value);
}

function messagingServiceSid(value: string) {
  return /^MG[0-9a-fA-F]{32}$/.test(value);
}

export function twilioApiKeyCredentials(env: TwilioEnv = process.env): TwilioApiKeyCredentials | null {
  const accountSid = clean(env.TWILIO_ACCOUNT_SID);
  const apiKeySid = clean(env.TWILIO_API_KEY_SID);
  const apiKeySecret = clean(env.TWILIO_API_KEY_SECRET);
  if (!/^AC[0-9a-fA-F]{32}$/.test(accountSid) || !/^SK[0-9a-fA-F]{32}$/.test(apiKeySid) || apiKeySecret.length < 20) return null;
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
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
}

async function twilioJsonGet(input: { url: string; credentials: TwilioApiKeyCredentials }) {
  return fetch(input.url, {
    method: "GET",
    headers: { authorization: authorization(input.credentials), accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
}

export type TwilioSendResult =
  | { ok: true; sid: string; status: string | null }
  | { ok: false; reason: "not_configured" | "no_sender" | "invalid_recipient" | "provider_error"; detail: string };

/**
 * Send a bounded non-PHI SMS using restricted API-key credentials.
 *
 * Twilio supports specifying both MessagingServiceSid and From. The governed patient
 * rail uses both: the tenant sender remains deterministic while Messaging Service
 * features such as Advanced Opt-Out remain associated with the outbound message.
 */
export async function sendTwilioSms(input: {
  to: string;
  body: string;
  from?: string | null;
  messagingServiceSid?: string | null;
  env?: TwilioEnv;
}): Promise<TwilioSendResult> {
  const env = input.env ?? process.env;
  const credentials = twilioApiKeyCredentials(env);
  if (!credentials) {
    return { ok: false, reason: "not_configured", detail: "Twilio restricted API-key credentials are not configured." };
  }
  if (!e164(input.to)) {
    return { ok: false, reason: "invalid_recipient", detail: "SMS recipient must be a valid E.164 phone number." };
  }

  const bodyText = input.body.trim();
  if (!bodyText || bodyText.length > 480) {
    return { ok: false, reason: "provider_error", detail: "SMS body must contain 1 to 480 characters." };
  }

  const explicitFrom = clean(input.from);
  const explicitService = clean(input.messagingServiceSid);
  const fallbackService = explicitService ? "" : clean(env.TWILIO_MESSAGING_SERVICE_SID);
  const serviceSid = explicitService || fallbackService;

  if (explicitFrom && !e164(explicitFrom)) {
    return { ok: false, reason: "no_sender", detail: "The configured tenant SMS sender is not valid E.164." };
  }
  if (serviceSid && !messagingServiceSid(serviceSid)) {
    return { ok: false, reason: "no_sender", detail: "The configured Twilio Messaging Service SID is invalid." };
  }
  if (!explicitFrom && !serviceSid) {
    return { ok: false, reason: "no_sender", detail: "No valid SMS sender or Twilio Messaging Service is configured." };
  }

  const body = new URLSearchParams({ To: input.to, Body: bodyText });
  if (explicitFrom) body.set("From", explicitFrom);
  if (serviceSid) body.set("MessagingServiceSid", serviceSid);

  const response = await twilioFormRequest({
    url: `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(credentials.accountSid)}/Messages.json`,
    body,
    credentials,
  });

  if (!response) return { ok: false, reason: "provider_error", detail: "Twilio could not be reached within the request timeout." };
  if (!response.ok) return { ok: false, reason: "provider_error", detail: `Twilio returned HTTP ${response.status}.` };

  const payload = (await response.json().catch(() => null)) as { sid?: string; status?: string | null } | null;
  if (!payload?.sid || !/^[A-Z]{2}[0-9a-fA-F]{32}$/.test(payload.sid)) {
    return { ok: false, reason: "provider_error", detail: "Twilio accepted the request without a valid evidentiary message SID." };
  }
  return { ok: true, sid: payload.sid, status: payload.status ?? null };
}

export type TwilioSmsRoutingVerificationResult =
  | { ok: true; phoneNumberSid: string; messagingServiceSid: string; smsCapable: true }
  | {
      ok: false;
      reason: "not_configured" | "invalid_sender" | "invalid_messaging_service_sid" | "sender_not_owned" | "sender_not_in_service" | "sender_not_sms_capable" | "provider_error";
      detail: string;
    };

/**
 * Prove that a configured tenant sender belongs to the platform Twilio account and is
 * present in the configured Messaging Service sender pool. This is runtime provider
 * evidence, not proof that carrier registration or Advanced Opt-Out is configured.
 */
export async function verifyTwilioSmsRouting(input: {
  senderPhone: string;
  messagingServiceSid: string;
  env?: TwilioEnv;
}): Promise<TwilioSmsRoutingVerificationResult> {
  const env = input.env ?? process.env;
  const credentials = twilioApiKeyCredentials(env);
  if (!credentials) return { ok: false, reason: "not_configured", detail: "Twilio restricted API-key credentials are not configured." };
  const senderPhone = clean(input.senderPhone);
  const serviceSid = clean(input.messagingServiceSid);
  if (!e164(senderPhone)) return { ok: false, reason: "invalid_sender", detail: "Tenant sender must be valid E.164." };
  if (!messagingServiceSid(serviceSid)) return { ok: false, reason: "invalid_messaging_service_sid", detail: "Messaging Service SID is invalid." };

  const ownedUrl = new URL(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(credentials.accountSid)}/IncomingPhoneNumbers.json`);
  ownedUrl.searchParams.set("PhoneNumber", senderPhone);
  ownedUrl.searchParams.set("PageSize", "2");
  const ownedResponse = await twilioJsonGet({ url: ownedUrl.toString(), credentials });
  if (!ownedResponse) return { ok: false, reason: "provider_error", detail: "Twilio phone-number ownership lookup could not be reached." };
  if (!ownedResponse.ok) return { ok: false, reason: "provider_error", detail: `Twilio phone-number ownership lookup returned HTTP ${ownedResponse.status}.` };
  const ownedPayload = (await ownedResponse.json().catch(() => null)) as {
    incoming_phone_numbers?: Array<{ sid?: string; phone_number?: string }>;
  } | null;
  const ownedMatches = (ownedPayload?.incoming_phone_numbers ?? []).filter((item) => item.phone_number === senderPhone && /^PN[0-9a-fA-F]{32}$/.test(item.sid ?? ""));
  if (ownedMatches.length !== 1) return { ok: false, reason: "sender_not_owned", detail: "The sender was not uniquely verified as a phone number owned by this Twilio account." };

  const poolUrl = new URL(`https://messaging.twilio.com/v1/Services/${encodeURIComponent(serviceSid)}/PhoneNumbers`);
  poolUrl.searchParams.set("PageSize", "1000");
  const poolResponse = await twilioJsonGet({ url: poolUrl.toString(), credentials });
  if (!poolResponse) return { ok: false, reason: "provider_error", detail: "Twilio Messaging Service sender-pool lookup could not be reached." };
  if (!poolResponse.ok) return { ok: false, reason: "provider_error", detail: `Twilio Messaging Service sender-pool lookup returned HTTP ${poolResponse.status}.` };
  const poolPayload = (await poolResponse.json().catch(() => null)) as {
    phone_numbers?: Array<{ sid?: string; phone_number?: string; service_sid?: string; capabilities?: string[] }>;
  } | null;
  const poolMatch = (poolPayload?.phone_numbers ?? []).find((item) => item.sid === ownedMatches[0].sid && item.phone_number === senderPhone && item.service_sid === serviceSid);
  if (!poolMatch) return { ok: false, reason: "sender_not_in_service", detail: "The owned sender is not present in the configured Messaging Service sender pool." };
  if (Array.isArray(poolMatch.capabilities) && !poolMatch.capabilities.includes("SMS")) {
    return { ok: false, reason: "sender_not_sms_capable", detail: "The configured sender is not SMS-capable in this Messaging Service." };
  }

  return { ok: true, phoneNumberSid: ownedMatches[0].sid!, messagingServiceSid: serviceSid, smsCapable: true };
}

export type TwilioVerifyResult =
  | { ok: true; sid: string; status: string }
  | { ok: false; reason: "not_configured" | "invalid_recipient" | "invalid_code" | "provider_error"; detail: string };

function verifyService(env: TwilioEnv) {
  const serviceSid = clean(env.TWILIO_VERIFY_SERVICE_SID);
  return /^VA[0-9a-fA-F]{32}$/.test(serviceSid) ? serviceSid : null;
}

/** Start phone-possession verification. This is identity/contact verification, not messaging permission. */
export async function startTwilioPhoneVerification(input: { to: string; env?: TwilioEnv }): Promise<TwilioVerifyResult> {
  const env = input.env ?? process.env;
  const credentials = twilioApiKeyCredentials(env);
  const serviceSid = verifyService(env);
  if (!credentials || !serviceSid) return { ok: false, reason: "not_configured", detail: "Twilio Verify is not fully configured." };
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
  if (!credentials || !serviceSid) return { ok: false, reason: "not_configured", detail: "Twilio Verify is not fully configured." };
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

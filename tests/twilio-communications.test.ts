import { afterEach, describe, expect, it, vi } from "vitest";
import { deliverOutbound, outboundChannelStatus, resetOutboundAdapters } from "@/lib/communications/outbound";
import {
  checkTwilioPhoneVerification,
  startTwilioPhoneVerification,
  twilioApiKeyCredentials,
} from "@/lib/communications/twilio";

const env = {
  TWILIO_ACCOUNT_SID: "AC1234567890",
  TWILIO_API_KEY_SID: "SK1234567890",
  TWILIO_API_KEY_SECRET: "opaque-one-time-secret",
  TWILIO_MESSAGING_SERVICE_SID: "MG1234567890",
  TWILIO_VERIFY_SERVICE_SID: "VA1234567890",
};

afterEach(() => {
  vi.restoreAllMocks();
  resetOutboundAdapters();
});

describe("Twilio restricted API-key credentials", () => {
  it("requires AC account SID plus SK API-key SID and the separate secret", () => {
    expect(twilioApiKeyCredentials(env)).toMatchObject({ accountSid: env.TWILIO_ACCOUNT_SID, apiKeySid: env.TWILIO_API_KEY_SID });
    expect(twilioApiKeyCredentials({ ...env, TWILIO_API_KEY_SECRET: "" })).toBeNull();
    expect(twilioApiKeyCredentials({ ...env, TWILIO_API_KEY_SID: "not-an-sk" })).toBeNull();
  });

  it("does not treat partial Twilio configuration as a working SMS rail", () => {
    expect(outboundChannelStatus("sms", { TWILIO_ACCOUNT_SID: env.TWILIO_ACCOUNT_SID })).toMatchObject({
      deliverable: false,
      reason: "no_connector",
    });
    expect(outboundChannelStatus("sms", env)).toMatchObject({ deliverable: true, provider: "twilio", connectorId: "twilio" });
  });

  it("sends through a Messaging Service and records the Twilio SID as evidence", async () => {
    const request = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ sid: "SM_evidence", status: "queued" }), {
      status: 201,
      headers: { "content-type": "application/json" },
    }));

    const result = await deliverOutbound({ channel: "sms", to: "+12125550123", subject: "ignored", body: "Your Klinikos notification is ready." }, env);
    expect(result).toEqual({ ok: true, providerReference: "SM_evidence", provider: "twilio" });

    const [url, options] = request.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`);
    expect(String(options.body)).toContain(`MessagingServiceSid=${env.TWILIO_MESSAGING_SERVICE_SID}`);
    expect(String(options.body)).toContain("To=%2B12125550123");
    expect((options.headers as Record<string, string>).authorization).toBe(`Basic ${Buffer.from(`${env.TWILIO_API_KEY_SID}:${env.TWILIO_API_KEY_SECRET}`).toString("base64")}`);
  });

  it("rejects a non-E.164 recipient before calling Twilio", async () => {
    const request = vi.spyOn(globalThis, "fetch");
    const result = await deliverOutbound({ channel: "sms", to: "2125550123", subject: "", body: "hello" }, env);
    expect(result).toMatchObject({ ok: false, reason: "invalid_recipient" });
    expect(request).not.toHaveBeenCalled();
  });
});

describe("Twilio Verify", () => {
  it("starts and checks phone-possession verification with the same restricted key", async () => {
    const request = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ sid: "VE_start", status: "pending" }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ sid: "VE_check", status: "approved" }), { status: 200 }));

    await expect(startTwilioPhoneVerification({ to: "+12125550123", env })).resolves.toEqual({ ok: true, sid: "VE_start", status: "pending" });
    await expect(checkTwilioPhoneVerification({ to: "+12125550123", code: "123456", env })).resolves.toEqual({ ok: true, sid: "VE_check", status: "approved" });

    expect(String(request.mock.calls[0]?.[0])).toContain(`/Services/${env.TWILIO_VERIFY_SERVICE_SID}/Verifications`);
    expect(String(request.mock.calls[1]?.[0])).toContain(`/Services/${env.TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`);
  });
});

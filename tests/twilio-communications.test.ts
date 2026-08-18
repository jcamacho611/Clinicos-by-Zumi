import { afterEach, describe, expect, it, vi } from "vitest";
import { deliverOutbound, outboundChannelStatus, resetOutboundAdapters } from "@/lib/communications/outbound";
import {
  checkTwilioPhoneVerification,
  startTwilioPhoneVerification,
  twilioApiKeyCredentials,
} from "@/lib/communications/twilio";

const env = {
  TWILIO_ACCOUNT_SID: `AC${"a".repeat(32)}`,
  TWILIO_API_KEY_SID: `SK${"b".repeat(32)}`,
  TWILIO_API_KEY_SECRET: "s".repeat(32),
  TWILIO_MESSAGING_SERVICE_SID: `MG${"c".repeat(32)}`,
  TWILIO_VERIFY_SERVICE_SID: `VA${"d".repeat(32)}`,
};
const messageSid = `SM${"e".repeat(32)}`;

afterEach(() => {
  vi.restoreAllMocks();
  resetOutboundAdapters();
});

describe("Twilio restricted API-key credentials", () => {
  it("requires exact AC/SK identifiers plus the separate secret", () => {
    expect(twilioApiKeyCredentials(env)).toMatchObject({ accountSid: env.TWILIO_ACCOUNT_SID, apiKeySid: env.TWILIO_API_KEY_SID });
    expect(twilioApiKeyCredentials({ ...env, TWILIO_API_KEY_SECRET: "" })).toBeNull();
    expect(twilioApiKeyCredentials({ ...env, TWILIO_API_KEY_SID: "not-an-sk" })).toBeNull();
    expect(twilioApiKeyCredentials({ ...env, TWILIO_ACCOUNT_SID: "AC123" })).toBeNull();
  });

  it("does not treat partial Twilio configuration as a working provider rail", () => {
    expect(outboundChannelStatus("sms", { TWILIO_ACCOUNT_SID: env.TWILIO_ACCOUNT_SID })).toMatchObject({ deliverable: false, reason: "no_connector" });
    expect(outboundChannelStatus("sms", env)).toMatchObject({ deliverable: true, provider: "twilio", connectorId: "twilio" });
  });

  it("uses an explicit tenant sender instead of the global Messaging Service pool when no service is supplied", async () => {
    const request = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ sid: messageSid, status: "queued" }), {
      status: 201,
      headers: { "content-type": "application/json" },
    }));

    const result = await deliverOutbound({
      channel: "sms",
      to: "+12125550123",
      sender: "+12125550199",
      subject: "ignored",
      body: "Your Klinikos notification is ready.",
    }, env);
    expect(result).toEqual({ ok: true, providerReference: messageSid, provider: "twilio" });

    const [url, options] = request.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`);
    expect(String(options.body)).toContain("From=%2B12125550199");
    expect(String(options.body)).not.toContain("MessagingServiceSid=");
    expect(String(options.body)).toContain("To=%2B12125550123");
    expect((options.headers as Record<string, string>).authorization).toBe(`Basic ${Buffer.from(`${env.TWILIO_API_KEY_SID}:${env.TWILIO_API_KEY_SECRET}`).toString("base64")}`);
  });

  it("preserves both the tenant From sender and Messaging Service when both are explicitly governed", async () => {
    const request = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ sid: messageSid, status: "queued" }), { status: 201 }));
    const tenantService = `MG${"f".repeat(32)}`;

    await deliverOutbound({
      channel: "sms",
      to: "+12125550123",
      sender: "+12125550199",
      messagingServiceSid: tenantService,
      subject: "ignored",
      body: "Klinikos has a secure account update for you.",
    }, env);

    const body = String((request.mock.calls[0]?.[1] as RequestInit).body);
    expect(body).toContain("From=%2B12125550199");
    expect(body).toContain(`MessagingServiceSid=${tenantService}`);
  });

  it("retains the Messaging Service only as a non-tenant fallback", async () => {
    const request = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ sid: messageSid, status: "queued" }), { status: 201 }));
    await deliverOutbound({ channel: "sms", to: "+12125550123", subject: "ignored", body: "Generic non-patient notification." }, env);
    expect(String((request.mock.calls[0]?.[1] as RequestInit).body)).toContain(`MessagingServiceSid=${env.TWILIO_MESSAGING_SERVICE_SID}`);
  });

  it("rejects a non-E.164 recipient before calling Twilio", async () => {
    const request = vi.spyOn(globalThis, "fetch");
    const result = await deliverOutbound({ channel: "sms", to: "2125550123", sender: "+12125550199", subject: "", body: "hello" }, env);
    expect(result).toMatchObject({ ok: false, reason: "invalid_recipient" });
    expect(request).not.toHaveBeenCalled();
  });
});

describe("Twilio Verify", () => {
  it("starts and checks phone-possession verification with the same restricted key", async () => {
    const request = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ sid: `VE${"1".repeat(32)}`, status: "pending" }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ sid: `VE${"2".repeat(32)}`, status: "approved" }), { status: 200 }));

    await expect(startTwilioPhoneVerification({ to: "+12125550123", env })).resolves.toEqual({ ok: true, sid: `VE${"1".repeat(32)}`, status: "pending" });
    await expect(checkTwilioPhoneVerification({ to: "+12125550123", code: "123456", env })).resolves.toEqual({ ok: true, sid: `VE${"2".repeat(32)}`, status: "approved" });

    expect(String(request.mock.calls[0]?.[0])).toContain(`/Services/${env.TWILIO_VERIFY_SERVICE_SID}/Verifications`);
    expect(String(request.mock.calls[1]?.[0])).toContain(`/Services/${env.TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`);
  });

  it("rejects malformed provider verification references instead of accepting them as evidence", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ sid: "VE_not_valid", status: "pending" }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ sid: "not-a-verification-sid", status: "approved" }), { status: 200 }));

    await expect(startTwilioPhoneVerification({ to: "+12125550123", env })).resolves.toMatchObject({ ok: false, reason: "provider_error" });
    await expect(checkTwilioPhoneVerification({ to: "+12125550123", code: "123456", env })).resolves.toMatchObject({ ok: false, reason: "provider_error" });
  });
});

import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { classifyInboundSmsCommand, validateTwilioWebhookSignature } from "@/lib/communications/twilio-webhook";

function sign(url: string, params: URLSearchParams, token: string) {
  const valuesByKey = new Map<string, string[]>();
  for (const [key, value] of params.entries()) {
    const values = valuesByKey.get(key) ?? [];
    values.push(value);
    valuesByKey.set(key, values);
  }
  let payload = url;
  for (const key of Array.from(valuesByKey.keys()).sort()) {
    for (const value of valuesByKey.get(key) ?? []) payload += `${key}${value}`;
  }
  return createHmac("sha1", token).update(payload, "utf8").digest("base64");
}

describe("Twilio inbound webhook security", () => {
  it("accepts an exact signed public URL + form payload and rejects tampering", () => {
    const url = "https://www.klinikos.io/api/webhooks/twilio/sms";
    const token = "test-auth-token";
    const params = new URLSearchParams({
      MessageSid: "SM123",
      From: "+12125550123",
      To: "+12125550199",
      Body: "STOP",
    });
    const signature = sign(url, params, token);

    expect(validateTwilioWebhookSignature({ publicUrl: url, params, signature, authToken: token })).toBe(true);

    const tampered = new URLSearchParams(params);
    tampered.set("Body", "START");
    expect(validateTwilioWebhookSignature({ publicUrl: url, params: tampered, signature, authToken: token })).toBe(false);
    expect(validateTwilioWebhookSignature({ publicUrl: url, params, signature: "", authToken: token })).toBe(false);
    expect(validateTwilioWebhookSignature({ publicUrl: url, params, signature, authToken: "" })).toBe(false);
  });

  it("classifies conservative fallback opt-out, resume and help commands", () => {
    for (const word of ["STOP", "stopall", "unsubscribe", "cancel", "end", "quit", "revoke", "optout"]) {
      expect(classifyInboundSmsCommand(word)).toBe("stop");
    }
    for (const word of ["START", "unstop"]) expect(classifyInboundSmsCommand(word)).toBe("start");
    for (const word of ["HELP", "info"]) expect(classifyInboundSmsCommand(word)).toBe("help");

    // YES may be classified by Twilio Advanced Opt-Out and arrive as signed OptOutType=START,
    // but it is not safe as our provider-independent fallback because sender types differ.
    expect(classifyInboundSmsCommand("yes")).toBe("other");
    expect(classifyInboundSmsCommand("please text me tomorrow")).toBe("other");
  });
});

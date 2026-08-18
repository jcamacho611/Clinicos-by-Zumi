import { describe, expect, it } from "vitest";
import { isSameOriginMutation } from "@/lib/security/same-origin-post";

function request(headers: Record<string, string>) {
  return new Request("https://klinikos.io/api/legal/accept", {
    method: "POST",
    headers,
  });
}

describe("legal same-origin mutation boundary", () => {
  it("accepts an exact same-origin browser POST", () => {
    expect(isSameOriginMutation(request({
      origin: "https://klinikos.io",
      host: "klinikos.io",
      "sec-fetch-site": "same-origin",
    }))).toBe(true);
  });

  it("rejects a missing Origin header", () => {
    expect(isSameOriginMutation(request({ host: "klinikos.io" }))).toBe(false);
  });

  it("rejects a cross-origin host", () => {
    expect(isSameOriginMutation(request({
      origin: "https://attacker.example",
      host: "klinikos.io",
      "sec-fetch-site": "cross-site",
    }))).toBe(false);
  });

  it("rejects same-site requests that are not same-origin", () => {
    expect(isSameOriginMutation(request({
      origin: "https://evil.klinikos.io",
      host: "klinikos.io",
      "sec-fetch-site": "same-site",
    }))).toBe(false);
  });

  it("honors trusted proxy host and protocol headers", () => {
    const proxied = new Request("http://internal-render/api/legal/accept", {
      method: "POST",
      headers: {
        origin: "https://klinikos.io",
        host: "internal-render",
        "x-forwarded-host": "klinikos.io",
        "x-forwarded-proto": "https",
        "sec-fetch-site": "same-origin",
      },
    });
    expect(isSameOriginMutation(proxied)).toBe(true);
  });
});

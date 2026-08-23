import { afterEach, describe, expect, it } from "vitest";
import { evaluateSameOriginMutation } from "@/lib/security/same-origin";

const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

afterEach(() => {
  if (originalAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
});

describe("same-origin mutation guard", () => {
  it("accepts the canonical origin", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://klinikos.io";
    const request = new Request("https://internal-render.example/api/test", {
      method: "PATCH",
      headers: { origin: "https://klinikos.io", "sec-fetch-site": "same-origin" },
    });
    expect(evaluateSameOriginMutation(request)).toEqual({ allowed: true });
  });

  it("rejects cross-site and same-site-but-different-origin mutations", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://klinikos.io";
    expect(evaluateSameOriginMutation(new Request("https://klinikos.io/api/test", {
      method: "PATCH",
      headers: { origin: "https://evil.example", "sec-fetch-site": "cross-site" },
    }))).toEqual({ allowed: false, reason: "cross_site" });

    expect(evaluateSameOriginMutation(new Request("https://klinikos.io/api/test", {
      method: "PATCH",
      headers: { origin: "https://attacker.klinikos.io", "sec-fetch-site": "same-site" },
    }))).toEqual({ allowed: false, reason: "origin_mismatch" });
  });

  it("fails closed when a browser mutation omits Origin", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://klinikos.io";
    expect(evaluateSameOriginMutation(new Request("https://klinikos.io/api/test", { method: "PATCH" })))
      .toEqual({ allowed: false, reason: "origin_missing" });
  });
});

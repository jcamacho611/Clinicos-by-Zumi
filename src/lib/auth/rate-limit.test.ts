import { afterEach, describe, expect, it } from "vitest";
import { loginClientIpAddress } from "@/lib/auth/rate-limit";

const originalTrustProxyHeaders = process.env.KLINIKOS_TRUST_PROXY_HEADERS;

afterEach(() => {
  if (originalTrustProxyHeaders === undefined) delete process.env.KLINIKOS_TRUST_PROXY_HEADERS;
  else process.env.KLINIKOS_TRUST_PROXY_HEADERS = originalTrustProxyHeaders;
});

describe("login client address", () => {
  it("ignores request-controlled forwarding headers unless proxy trust is explicit", () => {
    delete process.env.KLINIKOS_TRUST_PROXY_HEADERS;
    const request = new Request("https://klinikos.test/api/auth/login", {
      headers: {
        "x-forwarded-for": "203.0.113.44, 10.0.0.2",
        "x-real-ip": "203.0.113.45",
      },
    });

    expect(loginClientIpAddress(request)).toBe("unknown");
  });

  it("uses the edge-provided client address only in a trusted-proxy deployment", () => {
    process.env.KLINIKOS_TRUST_PROXY_HEADERS = "true";
    const request = new Request("https://klinikos.test/api/auth/login", {
      headers: {
        "x-forwarded-for": "203.0.113.44, 10.0.0.2",
        "x-real-ip": "203.0.113.45",
      },
    });

    expect(loginClientIpAddress(request)).toBe("203.0.113.44");
  });

  it("falls back to the trusted real-ip header when forwarded-for is absent", () => {
    process.env.KLINIKOS_TRUST_PROXY_HEADERS = "true";
    const request = new Request("https://klinikos.test/api/auth/login", {
      headers: { "x-real-ip": "203.0.113.45" },
    });

    expect(loginClientIpAddress(request)).toBe("203.0.113.45");
  });
});

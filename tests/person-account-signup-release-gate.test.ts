import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/account/signup/route";

describe("free person-account deployment release gate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("fails closed before accepting signup input when the deployment is not approved", async () => {
    vi.stubEnv("KLINIKOS_FREE_MEMBER_SIGNUP_ENABLED", "");

    const response = await POST(new Request("https://klinikos.io/api/account/signup", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://klinikos.io",
      },
      body: JSON.stringify({
        email: "person@example.test",
        displayName: "Person Example",
        password: "a-long-enough-passphrase",
      }),
    }));

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      error: "Free Klinikos membership is not enabled in this deployment.",
    });
  });
});

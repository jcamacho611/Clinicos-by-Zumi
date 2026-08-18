import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";

describe("public health endpoint", () => {
  it("returns only a minimal liveness signal", async () => {
    process.env.RENDER_GIT_COMMIT = "69d8ebdf5d542b53e99591e88f21e9723562726c";
    process.env.RENDER_GIT_BRANCH = "main";
    process.env.DATABASE_URL = "postgresql://secret-value-that-must-not-be-returned";

    const response = GET();
    const body = await response.json();

    expect(body).toEqual({ status: "ok" });
    expect(response.headers.get("cache-control")).toContain("no-store");
    const serialized = JSON.stringify(body);
    for (const forbidden of ["release", "commit", "branch", "database", "integration", "mode", "postgresql://", "secret-value"]) {
      expect(serialized.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
  });
});

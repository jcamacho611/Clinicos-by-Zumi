import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

async function body(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

function expectPrivateNoStore(response: Response) {
  expect(response.headers.get("cache-control")).toContain("private");
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect(response.headers.get("pragma")).toBe("no-cache");
  expect(response.headers.get("expires")).toBe("0");
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("networkAccessErrorResponse", () => {
  it("does not expose Zod issue details to the browser", async () => {
    const schema = z.object({ secretField: z.string().min(12) });
    const parsed = schema.safeParse({ secretField: "x" });
    if (parsed.success) throw new Error("Test fixture must fail validation.");

    const response = networkAccessErrorResponse(parsed.error);
    const payload = await body(response);

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "Invalid ClinicOS request." });
    expect(JSON.stringify(payload)).not.toContain("secretField");
    expectPrivateNoStore(response);
  });

  it("normalizes authorization and not-found errors instead of returning internal messages", async () => {
    const forbidden = networkAccessErrorResponse(new NetworkAccessError("Tenant org-123 failed secret policy alpha", 403));
    const missing = networkAccessErrorResponse(new NetworkAccessError("Patient internal-id-456 not found in table patients", 404));

    expect(await body(forbidden)).toEqual({ error: "Access denied." });
    expect(await body(missing)).toEqual({ error: "The requested ClinicOS resource was not found." });
    expectPrivateNoStore(forbidden);
    expectPrivateNoStore(missing);
  });

  it("never returns an unexpected exception message or stack and emits only a correlation reference", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const error = new Error("DATABASE_URL=postgres://secret@host/private internal stack detail");
    error.stack = "STACK /srv/klinikos/src/private/server-only.ts";

    const response = networkAccessErrorResponse(error);
    const payload = await body(response);
    const serialized = JSON.stringify(payload);

    expect(response.status).toBe(503);
    expect(payload.error).toBe("ClinicOS data is temporarily unavailable.");
    expect(typeof payload.reference).toBe("string");
    expect(serialized).not.toContain("DATABASE_URL");
    expect(serialized).not.toContain("postgres://");
    expect(serialized).not.toContain("server-only.ts");
    expectPrivateNoStore(response);

    expect(log).toHaveBeenCalledTimes(1);
    const logged = JSON.stringify(log.mock.calls[0]);
    expect(logged).not.toContain("DATABASE_URL");
    expect(logged).not.toContain("postgres://");
    expect(logged).not.toContain("server-only.ts");
  });
});

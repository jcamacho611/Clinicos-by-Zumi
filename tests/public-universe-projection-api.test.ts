import { afterEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/zumi/public/route";
import { resetProviderRegistry } from "@/features/zumi/providers";

/**
 * Every ordinary successful turn returns the Object Stage the answer recomposes.
 *
 * This is what makes Zumi and the Path stage one interaction. Without a projection on
 * the response the visitor reads an answer and then scrolls to a separate application
 * to see where it leads — the module-first shape the action-first law removes.
 *
 * The route is exercised directly because the origin gate makes a browser-level probe
 * environment-dependent, and because this is the contract worth freezing: the shape the
 * browser receives, and just as importantly what it must never receive.
 */

const originalDisabled = process.env.ZUMI_DISABLED;

afterEach(() => {
  resetProviderRegistry();
  if (originalDisabled === undefined) delete process.env.ZUMI_DISABLED;
  else process.env.ZUMI_DISABLED = originalDisabled;
});

async function ask(question: string, actionId?: string) {
  process.env.ZUMI_DISABLED = "1";
  resetProviderRegistry();
  const response = await POST(new Request("http://localhost/api/zumi/public", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost" },
    body: JSON.stringify({ question, ...(actionId ? { actionId } : {}) }),
  }));
  return { status: response.status, payload: await response.json() as { data?: Record<string, unknown> } };
}

describe("public Living Universe projection over the API", () => {
  it("returns the stage for an ordinary intent", async () => {
    const { status, payload } = await ask("I need weekend RN work");
    expect(status).toBe(200);

    const universe = payload.data?.universe as Record<string, unknown> | null;
    expect(universe, "no Object Stage on an ordinary successful turn").not.toBeNull();
    expect(typeof universe?.pathId).toBe("string");
    expect(typeof universe?.availabilityCopy).toBe("string");
    expect(typeof universe?.governance).toBe("string");
    expect(Array.isArray(universe?.steps)).toBe(true);
  });

  it("uses an allowlisted action identity to select the exact server-owned Path", async () => {
    const { status, payload } = await ask("I have rooms open Friday", "rooms");
    expect(status).toBe(200);
    expect(payload.data?.universe).toMatchObject({
      id: "rooms",
      pathId: "clinic-monetize-capacity",
      side: "have",
    });
    expect(payload.data?.suppressUniverse).toBe(false);
    expect(payload.data?.replaceUniverse).toBe(true);
  });

  it("keeps generic learning in EDU without inventing an injector or placement Path", async () => {
    const { status, payload } = await ask("I want to learn a healthcare skill", "learn");
    expect(status).toBe(200);
    expect(payload.data?.universe ?? null).toBeNull();
    expect(payload.data?.replaceUniverse).toBe(true);
    expect(payload.data?.suppressUniverse).toBe(false);
  });

  it("rejects a client-invented action identity", async () => {
    const { status } = await ask("Put me anywhere", "invented-client-path");
    expect(status).toBe(400);
  });

  it("sends the browser presentation only, never the machinery behind it", async () => {
    const { payload } = await ask("I need weekend RN work");
    const universe = (payload.data?.universe ?? {}) as Record<string, unknown>;

    // Ranking weights, eligibility rules and raw catalog nodes are server authority.
    for (const forbidden of ["ranking", "weights", "score", "rules", "policy", "nodes", "capabilityKey"]) {
      expect(universe, `projection leaks ${forbidden}`).not.toHaveProperty(forbidden);
    }
    // Step hrefs describe internal routing a logged-out visitor cannot follow anyway.
    for (const step of (universe.steps as Array<Record<string, unknown>>) ?? []) {
      expect(Object.keys(step).sort()).toEqual(["description", "label", "state"]);
    }
  });

  it("lets an emergency override the stage entirely", async () => {
    // Someone describing an emergency must not be shown a journey about finding work or
    // filling a shift underneath the answer. Safety outranks ordinary projection, and
    // this is the path that must never quietly acquire one.
    const { status, payload } = await ask(
      "my patient is having chest pain and can't breathe",
      "invented-client-path",
    );
    expect(status).toBe(200);
    const resolution = payload.data?.resolution as Record<string, unknown>;
    expect(String(resolution?.title)).toMatch(/emergency/i);
    expect(payload.data?.universe ?? null).toBeNull();
    expect(payload.data?.suppressUniverse).toBe(true);
  });

  it("returns no stage rather than inventing a journey", async () => {
    // A greeting has no Path. The honest answer is nothing, so the stage keeps whatever
    // it was already showing.
    const { payload } = await ask("hey");
    expect(payload.data?.universe ?? null).toBeNull();
    expect(payload.data?.replaceUniverse).toBe(false);
    expect(payload.data?.suppressUniverse).toBe(false);
  });
});

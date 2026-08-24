import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * The public marketing surface is the most exposed code in Klinikos: anyone can load it
 * and read the bundle without authenticating. `resolvePublicLivingIntent` is the
 * deterministic routing engine, and it used to run in the browser as a resilience
 * fallback, which shipped Klinikos routing logic to every visitor.
 *
 * It now runs server-side in the public Zumi route, including on the no-cost path taken
 * when the durable quota authority does not attest a request. These tests guard that
 * boundary, because the previous arrangement looked deliberate and would otherwise be
 * easy to reintroduce.
 */

const PUBLIC_CLIENT_COMPONENTS = [
  "src/components/marketing/public-living-gateway.tsx",
  "src/components/marketing/public-zumi-site-control.tsx",
];

const route = readFileSync("src/app/api/zumi/public/route.ts", "utf8");

function read(file: string) {
  return readFileSync(file, "utf8");
}

describe("public orchestration browser boundary", () => {
  it.each(PUBLIC_CLIENT_COMPONENTS)("%s is a client module that does not import the engine as a value", (file) => {
    const source = read(file);
    expect(source.startsWith('"use client"')).toBe(true);

    // A type-only import is erased by the compiler and discloses nothing. A value
    // import pulls the engine into the bundle.
    const valueImport = new RegExp(
      String.raw`import\s*\{[^}]*\bresolvePublicLivingIntent\b[^}]*\}\s*from\s*["']@/lib/orchestration/public-living-intent["']`,
    );
    expect(valueImport.test(source)).toBe(false);
    expect(source).not.toMatch(/\bresolvePublicLivingIntent\s*\(/);
  });

  it.each(PUBLIC_CLIENT_COMPONENTS)("%s degrades honestly instead of inventing an answer", (file) => {
    const source = read(file);
    expect(source).toContain("UNREACHABLE_RESOLUTION");
    expect(source).toContain("I can't reach Klinikos right now");
    // Confidence zero: a degraded turn must never present itself as a resolved route.
    expect(source).toMatch(/confidence:\s*0\s*,/);
  });

  it("resolves the no-cost path on the server rather than pushing it to the browser", () => {
    expect(route).toContain("resolvePublicLivingIntent(");
    expect(route).toContain("publicZumiDurableQuotaAttested");
    // The deterministic answer is returned from the unattested branch, so failing
    // closed against paid model execution no longer requires a browser-side engine.
    const unattestedBranch = route.slice(route.indexOf("!publicZumiDurableQuotaAttested"));
    expect(unattestedBranch).toContain("resolvePublicLivingIntent(");
    expect(unattestedBranch).toContain("degraded: true");
  });

  it("still fails closed against paid model execution when the request is unattested", () => {
    // The deterministic fallback must be returned *before* the paid turn resolver, or
    // the cost control this branch exists for is gone.
    const guardAt = route.indexOf("!publicZumiDurableQuotaAttested");
    const paidAt = route.indexOf("await resolvePublicZumiTurn(");
    expect(guardAt).toBeGreaterThan(-1);
    expect(paidAt).toBeGreaterThan(-1);
    expect(guardAt).toBeLessThan(paidAt);
  });

  it("re-validates the prior resolution handed back by the browser", () => {
    // The browser returns a DTO this route previously sent it. It is public and flat,
    // but it is still client-supplied input feeding the engine.
    expect(route).toContain("priorResolutionSchema");
    expect(route).toContain("priorResolution: priorResolutionSchema");
    expect(route).toContain("unresolvedTurns: z.number().int().min(0).max(24)");
  });
});

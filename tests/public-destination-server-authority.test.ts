import { describe, expect, it } from "vitest";
import { resolvePublicLivingIntent, type PublicLivingResolution } from "@/lib/orchestration/public-living-intent";

/**
 * Server owns routing. The browser may say what it was last told, but it may never
 * decide where Klinikos sends someone next.
 *
 * The public gateway echoes its previous resolution back to `/api/zumi/public` so a
 * short follow-up ("Saturday") can be read against the earlier goal. The request schema
 * validates that echoed destination's `key`, but it accepted the browser's `href`,
 * `action` and — through `passthrough()` — any extra fields, and the sticky-prior path
 * returned that same object straight back out. A visitor could therefore influence an
 * internal link the server presented as its own.
 *
 * That is not a clinical-authority hole, but it breaks the boundary that keeps routing
 * server-owned, and it becomes materially worse once the Action Dock renders those
 * destinations as real actions.
 */

function priorWith(destination: Record<string, unknown>): PublicLivingResolution {
  return {
    kind: "route",
    title: "Let's find what you need.",
    body: "Grid is where you can look for or offer healthcare capacity.",
    assumption: null,
    destination: destination as PublicLivingResolution["destination"],
    confidence: 0.8,
  };
}

describe("public destination stays server-owned", () => {
  it("rebuilds a carried-over destination from the server's own catalog", () => {
    // A follow-up that carries the prior goal forward, with everything except the key
    // replaced by the browser.
    const followUp = resolvePublicLivingIntent(
      "Saturday",
      priorWith({ key: "grid", href: "/attacker-controlled", action: "Do the attacker's thing" }),
    );

    expect(followUp.destination).not.toBeNull();
    expect(followUp.destination?.key).toBe("grid");
    // The server's own values for that key, not the ones the browser sent.
    expect(followUp.destination?.href).toBe("/grid");
    expect(followUp.destination?.href).not.toBe("/attacker-controlled");
    expect(followUp.destination?.action).not.toBe("Do the attacker's thing");
  });

  it("drops any extra fields the browser attached to the destination", () => {
    const followUp = resolvePublicLivingIntent(
      "Saturday",
      priorWith({ key: "grid", href: "/grid", action: "Open Grid", injected: "payload" }),
    );

    expect(followUp.destination).not.toBeNull();
    expect(Object.keys(followUp.destination ?? {}).sort()).toEqual(["action", "href", "key"]);
  });

  it("refuses to carry forward a key the server does not recognise", () => {
    // An unknown key previously produced "your undefined request" and still carried the
    // browser's href. It must simply not stick.
    const followUp = resolvePublicLivingIntent(
      "Saturday",
      priorWith({ key: "not-a-real-key", href: "/anywhere", action: "Go" }),
    );

    expect(followUp.body).not.toContain("undefined");
    expect(followUp.destination?.href).not.toBe("/anywhere");
  });
});

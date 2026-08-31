import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolvePublicLivingIntent } from "@/lib/orchestration/public-living-intent";

const gateway = readFileSync(
  join(process.cwd(), "src/components/marketing/public-living-gateway.tsx"),
  "utf8",
);

/**
 * MF-001 (Master Canon §7.1) makes free ecosystem entry law:
 *
 *   DISCOVERY → PUBLIC ZUMI → JOIN FREE → ONE KLINIKOS IDENTITY → INTENT
 *   → ... → FIRST USEFUL RESULT → LIVING HOME → PROGRESSIVE VERIFICATION
 *
 * and it forbids the `signup → empty dashboard` shape outright.
 *
 * Before this suite the public front door had no JOIN FREE step at all. Every one of
 * the eleven public-Zumi destinations was an existing-customer destination, and seven
 * of them were wrapped in a sign-in redirect. A person with no account who said
 * "I need an MA job" was routed either to a marketing page or to a login wall they
 * could not pass, while `/grid/join` — free, live, and already able to enrol exactly
 * that person — was never offered.
 *
 * These guards protect the entry step itself, not any particular wording.
 */

/** The free-entry surface that already exists, is live, and takes no payment. */
const FREE_ENTRY_HREF = "/grid/join";

describe("public front door offers free ecosystem entry", () => {
  it("routes a person who wants to participate to a place they can actually join", () => {
    const prompts = [
      "I need an MA job",
      "I'm a nurse looking for work",
      "how do I join Klinikos",
      "I have a treatment room to rent out",
      "I want to sign up",
    ];

    for (const prompt of prompts) {
      const resolution = resolvePublicLivingIntent(prompt);
      expect(resolution.destination, `${prompt}: no destination at all`).not.toBeNull();
      expect(
        resolution.destination?.href,
        `${prompt}: sent to ${resolution.destination?.href} instead of free entry`,
      ).toBe(FREE_ENTRY_HREF);
    }
  });

  it("never puts a sign-in wall in front of free entry", () => {
    // `publicActionPaths` is the allowlist of destinations the gateway links to
    // directly. Anything absent from it is wrapped in `protectedPublicContinuationHref`,
    // which redirects through `/login` — impassable for a visitor with no account, and
    // the exact dead end MF-001 forbids.
    const allowlist = gateway.match(/const publicActionPaths = new Set\(\[([^\]]*)\]/);
    expect(allowlist, "publicActionPaths allowlist not found").not.toBeNull();
    expect(allowlist?.[1]).toContain(`"${FREE_ENTRY_HREF}"`);
  });

  it("shows free entry in the front door itself, not only after a conversation", () => {
    // A visitor who never types anything must still be able to see that joining is
    // free and possible. Sign-in alone is not an entry point for someone with no
    // account.
    expect(gateway).toContain(FREE_ENTRY_HREF);
    expect(gateway).toMatch(/Join free/i);
  });

  it("keeps a clinic asking for coverage on the demand side, not the join path", () => {
    // "We need an RN tomorrow" is a clinic seeking capacity. It must keep resolving to
    // Grid coverage; free entry must not swallow the demand-side intent.
    for (const prompt of ["we need an RN tomorrow", "I need to hire a receptionist"]) {
      const resolution = resolvePublicLivingIntent(prompt);
      expect(resolution.destination?.href, prompt).not.toBe(FREE_ENTRY_HREF);
    }
  });

  it("does not let free entry imply verification, eligibility, or authority", () => {
    const resolution = resolvePublicLivingIntent("I need an MA job");
    const text = `${resolution.title} ${resolution.body} ${resolution.assumption ?? ""}`;
    // Joining is free. It is not a credential, and it does not qualify anyone for work.
    expect(text).not.toMatch(/\b(?:verified|licensed|credentialed|eligible|approved|qualified)\b/i);
  });
});

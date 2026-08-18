import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { klinikosPathCatalog } from "@/lib/paths/catalog";
import { resolveIntentDeterministically } from "@/lib/orchestration/intent-engine";

/**
 * Klinikos routes are the product journeys; pages are only the surfaces they land on.
 * A route is the thing that crosses engines — EDU competency into provider readiness
 * into Grid eligibility — so a route step pointing at a surface that does not exist
 * breaks a journey, not just a link.
 *
 * `/grid/transactions` is the reason this file exists: it is the terminal step of two
 * routes and it returned a 500 in production-mode browser QA while every unit test
 * stayed green.
 */

const appDir = path.join(process.cwd(), "src/app");

function routeExists(href: string): boolean {
  const segments = href.split("/").filter(Boolean);

  // Next.js route groups — (platform), (clinic) — are invisible in the URL, so a
  // candidate may live under any of them, or at the app root.
  const roots = [appDir, ...fs.readdirSync(appDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("("))
    .map((entry) => path.join(appDir, entry.name))];

  const descend = (dir: string, rest: string[]): boolean => {
    if (!rest.length) return fs.existsSync(path.join(dir, "page.tsx"));
    if (!fs.existsSync(dir)) return false;
    const [head, ...tail] = rest;

    // A literal directory only wins if it actually resolves. `/network` has a
    // `network/` directory holding only children, so Next falls through to the
    // `[workspace]` catch-all — a literal match that returns early here would report
    // a live page as missing.
    if (fs.existsSync(path.join(dir, head)) && descend(path.join(dir, head), tail)) return true;

    // A dynamic segment ([workspace], [patientId]) or a nested route group can absorb
    // this part of the path.
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith("(") && descend(path.join(dir, entry.name), rest)) return true;
      if (entry.name.startsWith("[") && descend(path.join(dir, entry.name), tail)) return true;
    }
    return false;
  };

  return roots.some((root) => descend(root, segments));
}

describe("Klinikos route registry", () => {
  it("has routes", () => {
    expect(klinikosPathCatalog.length).toBeGreaterThan(0);
  });

  it("lands every route step on a surface that actually exists", () => {
    const broken: string[] = [];
    for (const route of klinikosPathCatalog) {
      for (const node of route.nodes) {
        if (!node.href) continue;
        if (!routeExists(node.href)) broken.push(`${route.id} → ${node.id} points at ${node.href}, which has no page`);
      }
    }
    expect(broken).toEqual([]);
  });

  it("gives every route at least one step a person can open", () => {
    for (const route of klinikosPathCatalog) {
      expect(route.nodes.some((node) => Boolean(node.href)), `${route.id} has no openable step`).toBe(true);
    }
  });

  it("resolves each route's own stated intent examples back to that route", () => {
    // A route whose examples do not reach it is unreachable from Living Home, which
    // is the only way most people will ever start one.
    const unreachable: string[] = [];
    for (const route of klinikosPathCatalog) {
      for (const example of route.intentExamples) {
        const candidates = resolveIntentDeterministically(example).candidatePathIds;
        if (!candidates.includes(route.id)) unreachable.push(`${route.id}: "${example}" resolved to [${candidates.join(", ") || "nothing"}]`);
      }
    }
    expect(unreachable).toEqual([]);
  });

  it("keeps route ids and node ids unique within a route", () => {
    const ids = klinikosPathCatalog.map((route) => route.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const route of klinikosPathCatalog) {
      const nodeIds = route.nodes.map((node) => node.id);
      expect(new Set(nodeIds).size, `${route.id} has duplicate node ids`).toBe(nodeIds.length);
    }
  });

  it("never sends a signed-in person to a public marketplace entry page", () => {
    // `/grid` lives outside the (platform) group and renders signed-out chrome with a
    // "Sign in" button. A signed-in clinic owner following a Grid step from Home used
    // to land there and be invited to sign in again. `/grid/workspace` is the
    // authenticated Grid home, and is what the launchpad already pointed at.
    const publicEntries = new Set(["/grid", "/grid/browse", "/grid/pricing", "/grid/join"]);
    const offenders: string[] = [];
    for (const route of klinikosPathCatalog) {
      for (const node of route.nodes) {
        if (node.href && publicEntries.has(node.href)) offenders.push(`${route.id} → ${node.id} points at the public ${node.href}`);
      }
    }
    const rail = fs.readFileSync(path.join(process.cwd(), "src/lib/home/operating-rail.ts"), "utf8");
    for (const entry of publicEntries) {
      if (rail.includes(`href: "${entry}"`)) offenders.push(`the operating rail points at the public ${entry}`);
    }
    expect(offenders).toEqual([]);
  });

  it("lands every Clinic OS → Grid signal on a surface that exists", () => {
    // The bridge offers an action per signal; an action that 404s is a dead control
    // on the one surface meant to carry Clinic OS state into Grid. `/grid/needs`
    // has no page of its own — only `/grid/needs/new` and `/grid/needs/[demandId]`.
    const bridge = fs.readFileSync(path.join(process.cwd(), "src/lib/ecosystem/clinic-grid-bridge.ts"), "utf8");
    const hrefs = [...bridge.matchAll(/href: "([^"]+)"/g)].map((match) => match[1]);
    expect(hrefs.length).toBeGreaterThan(0);
    const broken = hrefs.filter((href) => !routeExists(href));
    expect(broken).toEqual([]);
  });

  it("crosses more than one Klinikos engine on the routes that claim to", () => {
    // The point of a route is that it spans engines. Each of these is asserted to
    // touch at least two distinct top-level surfaces, which is what makes it a
    // journey rather than a link.
    const engineOf = (href: string) => href.split("/").filter(Boolean)[0];
    const crossEngine = ["find-extra-work", "become-grid-ready", "fix-referral-leakage"];
    for (const id of crossEngine) {
      const route = klinikosPathCatalog.find((candidate) => candidate.id === id);
      expect(route, `${id} is missing from the catalog`).toBeDefined();
      const engines = new Set(route!.nodes.map((node) => node.href).filter(Boolean).map((href) => engineOf(href!)));
      expect(engines.size, `${id} stays inside ${[...engines].join(", ")}`).toBeGreaterThan(1);
    }
  });
});

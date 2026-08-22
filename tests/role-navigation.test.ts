import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { clinicRoles, type ClinicRole } from "@/lib/auth/rbac";
import { canAccessWorkspace, workspaceAccessRules } from "@/lib/auth/workspace-authorization";
import { exploreNavigationForRole, klinikosPromptForWorkspace, primaryNavigationForRole } from "@/lib/navigation-experience";
import { navigation } from "@/lib/navigation";

/**
 * The rail is the first thing anyone meets, so its failure modes are expensive: a link
 * to a surface the role cannot open, a label naming a module instead of an outcome, or
 * a quiet return to listing the entire product.
 */

const appDir = path.join(process.cwd(), "src/app");

function routeExists(href: string): boolean {
  const segments = href.split(/[?#]/)[0].split("/").filter(Boolean);
  const roots = [appDir, ...fs.readdirSync(appDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("("))
    .map((entry) => path.join(appDir, entry.name))];
  const descend = (dir: string, rest: string[]): boolean => {
    if (!rest.length) return fs.existsSync(path.join(dir, "page.tsx"));
    if (!fs.existsSync(dir)) return false;
    const [head, ...tail] = rest;
    if (fs.existsSync(path.join(dir, head)) && descend(path.join(dir, head), tail)) return true;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith("(") && descend(path.join(dir, entry.name), rest)) return true;
      if (entry.name.startsWith("[") && descend(path.join(dir, entry.name), tail)) return true;
    }
    return false;
  };
  return roots.some((root) => descend(root, segments));
}

const workspaceOf = (href: string) => href.split("/").filter(Boolean)[0] ?? "";

describe("role-derived navigation", () => {
  it("keeps the permanent rail small enough to read", () => {
    for (const role of clinicRoles) {
      const rail = primaryNavigationForRole(role);
      expect(rail.length, `${role} rail is empty`).toBeGreaterThan(0);
      expect(rail.length, `${role} shows ${rail.length} permanent destinations`).toBeLessThanOrEqual(7);
    }
  });

  it("is dramatically smaller than the workspace catalog it replaced as permanent furniture", () => {
    // The point of the change, stated as a number. The catalog still exists and stays
    // reachable through Explore Klinikos — it just stopped being the first thing a
    // person has to read.
    const catalogSize = navigation.reduce((total, group) => total + group.items.length, 0);
    expect(catalogSize).toBeGreaterThan(30);
    for (const role of clinicRoles) {
      expect(primaryNavigationForRole(role).length).toBeLessThan(catalogSize / 4);
    }
  });

  it("never offers a destination the role would be turned away from", () => {
    const offenders: string[] = [];
    for (const role of clinicRoles) {
      for (const item of primaryNavigationForRole(role)) {
        if (item.href === "/edu") continue;
        if (!canAccessWorkspace(role, workspaceOf(item.href))) offenders.push(`${role} → ${item.label} (${item.href})`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("filters by authorization rather than trusting the curated lists", () => {
    // Guards against the vacuous version of the test above. Take the union of every
    // destination the product defines and check the predicate actually discriminates,
    // then check the rail honours it. If nothing were ever unauthorized, the filter
    // would be doing no work and this file would mean nothing.
    const everyHref = [...new Set(clinicRoles.flatMap((role) => primaryNavigationForRole(role).map((item) => item.href)))];
    const unauthorized = clinicRoles.flatMap((role) =>
      everyHref.filter((href) => href !== "/edu" && !canAccessWorkspace(role, workspaceOf(href))).map((href) => ({ role, href })),
    );
    expect(unauthorized.length, "no role/destination pair is unauthorized").toBeGreaterThan(0);
    for (const { role, href } of unauthorized) {
      expect(
        primaryNavigationForRole(role).some((item) => item.href === href),
        `${role} rail offers ${href}, which ${role} cannot open`,
      ).toBe(false);
    }
  });

  it("lands every destination on a page that exists", () => {
    const broken: string[] = [];
    for (const role of clinicRoles) {
      for (const item of primaryNavigationForRole(role)) {
        if (!routeExists(item.href)) broken.push(`${role} → ${item.href}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it("names every destination for an outcome rather than for a module", () => {
    const moduleVocabulary = ["workspace", "module", "engine", "registry", "orchestration", "console", "dashboard", "admin", "config", "system"];
    const offenders: string[] = [];
    for (const role of clinicRoles) {
      for (const item of primaryNavigationForRole(role)) {
        const label = item.label.toLowerCase();
        for (const word of moduleVocabulary) {
          if (label.includes(word)) offenders.push(`${role} → "${item.label}" uses "${word}"`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("declares an authorization rule for every workspace it routes through", () => {
    for (const role of clinicRoles) {
      for (const item of primaryNavigationForRole(role)) {
        if (item.href === "/edu") continue;
        expect(workspaceAccessRules[workspaceOf(item.href)], `${item.href} has no authorization rule`).toBeDefined();
      }
    }
  });

  it("starts every role that can reach Home at Home, and lands the rest somewhere real", () => {
    // `contractor` holds no clinic-data permission, so /dashboard genuinely 404s for
    // them and sign-in already routes them to Grid instead. Asserting a universal Home
    // would demand a rail entry that does not work.
    for (const role of clinicRoles) {
      const first = primaryNavigationForRole(role)[0];
      expect(first, `${role} has no landing destination`).toBeDefined();
      if (canAccessWorkspace(role, "dashboard")) {
        expect(first!.href, `${role} can reach Home but does not start there`).toBe("/dashboard");
      } else {
        expect(canAccessWorkspace(role, workspaceOf(first!.href)), `${role} lands on a surface it cannot open`).toBe(true);
      }
    }
  });

  it("lands a contractor where sign-in actually sends them", () => {
    // The rail and the post-login redirect are two places answering "where does this
    // person start". Their drifting apart is invisible until somebody signs in.
    const loginRoute = fs.readFileSync(path.join(process.cwd(), "src/app/api/auth/login/route.ts"), "utf8");
    const contractorLanding = loginRoute.match(/role === "contractor" \? "([^"]+)"/)?.[1];
    expect(contractorLanding).toBeTruthy();
    expect(primaryNavigationForRole("contractor")[0]?.href).toBe(contractorLanding);
  });

  it("never sends a signed-in person to the public marketplace entry", () => {
    // `/grid` sits outside the (platform) group and renders signed-out chrome with a
    // "Sign in" button. A signed-in owner following their own rail used to land there
    // and be invited to sign in again.
    const publicEntries = new Set(["/grid", "/grid/browse", "/grid/pricing", "/grid/join"]);
    for (const role of clinicRoles) {
      for (const item of primaryNavigationForRole(role)) {
        expect(publicEntries.has(item.href), `${role} rail points at the public ${item.href}`).toBe(false);
      }
    }
  });

  it("gives each role a rail suited to it, not one rail with the labels swapped", () => {
    const signatures = new Set(
      (clinicRoles as readonly ClinicRole[]).map((role) => primaryNavigationForRole(role).map((item) => item.href).join("|")),
    );
    expect(signatures.size).toBeGreaterThan(4);
  });

  it("does not list a permanent destination again inside Explore Klinikos", () => {
    // Seeing "Money" in two places teaches a person that the two are different things.
    for (const role of clinicRoles) {
      const primary = new Set(primaryNavigationForRole(role).map((item) => item.href));
      for (const group of exploreNavigationForRole(role, primary)) {
        for (const item of group.items) {
          expect(primary.has(item.href), `${role}: ${item.href} appears in both the rail and Explore`).toBe(false);
        }
      }
    }
  });

  it("keeps everything in Explore Klinikos something the role can actually open", () => {
    for (const role of clinicRoles) {
      for (const group of exploreNavigationForRole(role)) {
        for (const item of group.items) {
          if (item.href === "/edu") continue;
          expect(canAccessWorkspace(role, workspaceOf(item.href)), `${role} → ${item.href}`).toBe(true);
        }
      }
    }
  });

  it("asks a question that fits the surface a person is standing on", () => {
    // One conversation, but the invitation should match the work in front of them.
    expect(klinikosPromptForWorkspace("dashboard")).toBe("What needs to happen?");
    expect(klinikosPromptForWorkspace("grid")).toBe("What do you need or have?");
    expect(klinikosPromptForWorkspace("billing")).toMatch(/money/i);
    expect(klinikosPromptForWorkspace("edu")).toMatch(/work on next/i);
    // An unknown surface still gets a question, never an empty placeholder.
    expect(klinikosPromptForWorkspace("not-a-real-workspace").length).toBeGreaterThan(10);
  });
});

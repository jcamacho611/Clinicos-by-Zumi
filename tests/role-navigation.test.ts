import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { clinicRoles, type ClinicRole } from "@/lib/auth/rbac";
import { canAccessWorkspace, workspaceAccessRules } from "@/lib/auth/workspace-authorization";
import { allRoleDestinations, maximumRailSize, roleNavigation } from "@/lib/navigation/role-navigation";
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

describe("role-derived navigation", () => {
  it("keeps the permanent rail small enough to read", () => {
    for (const role of clinicRoles) {
      const rail = roleNavigation(role);
      expect(rail.length, `${role} rail is empty`).toBeGreaterThan(0);
      expect(rail.length, `${role} shows ${rail.length} permanent destinations`).toBeLessThanOrEqual(maximumRailSize);
    }
  });

  it("is dramatically smaller than the workspace catalog it replaced as permanent furniture", () => {
    // The point of the change, stated as a number. The catalog still exists and stays
    // reachable — it just stopped being the first thing a person has to read.
    const catalogSize = navigation.reduce((total, group) => total + group.items.length, 0);
    expect(catalogSize).toBeGreaterThan(30);
    for (const role of clinicRoles) {
      expect(roleNavigation(role).length).toBeLessThan(catalogSize / 4);
    }
  });

  it("never offers a destination the role would be turned away from", () => {
    // A rail assembled by hand drifts out of step with RBAC, and the person finds out
    // by clicking and getting a 404. Check every candidate, including the ones the
    // filter is supposed to drop, so the filter itself is under test.
    const offenders: string[] = [];
    for (const role of clinicRoles) {
      for (const destination of roleNavigation(role)) {
        if (!canAccessWorkspace(role, destination.workspaceSlug)) {
          offenders.push(`${role} → ${destination.label} (${destination.workspaceSlug})`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("filters by authorization rather than trusting the curated lists", () => {
    // Guards against the vacuous version of the test above. The curated rails happen to
    // be fully authorized today, so "nothing was dropped" proves nothing on its own.
    // Instead, take the union of every destination the product defines and check the
    // predicate actually discriminates — then check `roleNavigation` honours it.
    const everyDestination = [...new Map(
      Object.values(allRoleDestinations).flat().map((destination) => [destination.href, destination]),
    ).values()];

    const unauthorized = clinicRoles.flatMap((role) =>
      everyDestination
        .filter((destination) => !canAccessWorkspace(role, destination.workspaceSlug))
        .map((destination) => ({ role, destination })),
    );
    // If this is empty, every role can reach every surface and the rail is not gating
    // anything — which would make the whole file meaningless.
    expect(unauthorized.length, "no role/destination pair is unauthorized").toBeGreaterThan(0);

    for (const { role, destination } of unauthorized) {
      expect(
        roleNavigation(role).some((entry) => entry.href === destination.href),
        `${role} rail offers ${destination.href}, which ${role} cannot open`,
      ).toBe(false);
    }
  });

  it("lands every destination on a page that exists", () => {
    const broken: string[] = [];
    for (const role of clinicRoles) {
      for (const destination of roleNavigation(role)) {
        if (!routeExists(destination.href)) broken.push(`${role} → ${destination.href}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it("names every destination for an outcome, using a rule it declares", () => {
    const moduleVocabulary = [
      "workspace", "module", "engine", "registry", "orchestration", "console",
      "dashboard", "management", "admin", "config", "system",
    ];
    const offenders: string[] = [];
    for (const role of clinicRoles) {
      for (const destination of roleNavigation(role)) {
        const label = destination.label.toLowerCase();
        for (const word of moduleVocabulary) {
          if (label.includes(word)) offenders.push(`${role} → "${destination.label}" uses "${word}"`);
        }
        // Every entry says why a person goes there, in a sentence.
        expect(destination.purpose.length, `${destination.label} has no purpose`).toBeGreaterThan(20);
        expect(destination.purpose.endsWith("."), `${destination.label} purpose is not a sentence`).toBe(true);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("declares every workspace slug it routes through", () => {
    for (const role of clinicRoles) {
      for (const destination of roleNavigation(role)) {
        expect(workspaceAccessRules[destination.workspaceSlug], `${destination.workspaceSlug} has no authorization rule`).toBeDefined();
      }
    }
  });

  it("starts every role that can reach Home at Home, and lands the rest somewhere real", () => {
    // `contractor` holds no clinic-data permission, so `/dashboard` genuinely 404s for
    // them and sign-in already routes them to Grid instead. Asserting a universal Home
    // would have demanded a rail entry that does not work.
    for (const role of clinicRoles) {
      const rail = roleNavigation(role);
      const first = rail[0];
      expect(first, `${role} has no landing destination`).toBeDefined();
      if (canAccessWorkspace(role, "dashboard")) {
        expect(first!.href, `${role} can reach Home but does not start there`).toBe("/dashboard");
      } else {
        expect(canAccessWorkspace(role, first!.workspaceSlug), `${role} lands on a surface it cannot open`).toBe(true);
      }
    }
  });

  it("lands a contractor where sign-in actually sends them", () => {
    // The rail and the post-login redirect are two places that answer "where does this
    // person start". They drifting apart is invisible until someone signs in.
    const loginRoute = fs.readFileSync(path.join(process.cwd(), "src/app/api/auth/login/route.ts"), "utf8");
    const contractorLanding = loginRoute.match(/role === "contractor" \? "([^"]+)"/)?.[1];
    expect(contractorLanding).toBeTruthy();
    expect(roleNavigation("contractor")[0]?.href).toBe(contractorLanding);
  });

  it("gives a clinic owner money and Grid without making them hunt", () => {
    const owner = roleNavigation("clinic_owner").map((destination) => destination.href);
    expect(owner).toContain("/billing");
    expect(owner).toContain("/grid/workspace");
    // The public marketplace entry renders signed-out chrome; a signed-in owner must
    // never be sent there from their own rail.
    expect(owner).not.toContain("/grid");
  });

  it("does not hand an external contractor the clinic's operating surfaces", () => {
    const contractor = roleNavigation("contractor").map((destination) => destination.href);
    for (const clinical of ["/patients", "/front-desk", "/encounters", "/billing", "/labs"]) {
      expect(contractor, `contractor rail exposes ${clinical}`).not.toContain(clinical);
    }
  });

  it("gives each role a rail suited to it, not one rail with the labels swapped", () => {
    const signatures = new Set(
      (clinicRoles as readonly ClinicRole[]).map((role) => roleNavigation(role).map((d) => d.href).join("|")),
    );
    expect(signatures.size).toBeGreaterThan(4);
  });
});

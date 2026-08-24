import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { can, clinicResources } from "@/lib/auth/rbac";
import { canAccessWorkspace, workspaceAccessRules } from "@/lib/auth/workspace-authorization";
import { navigation } from "@/lib/navigation";

function routeFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? routeFiles(path) : entry.name === "route.ts" ? [path] : [];
  });
}

describe("ClinicOS authorization contract", () => {
  it("defines an access rule for every staff navigation destination", () => {
    const destinations = navigation.flatMap((group) => group.items.map((item) => item.href.slice(1)));
    expect(destinations.filter((destination) => !workspaceAccessRules[destination])).toEqual([]);
    expect(destinations.every((destination) => canAccessWorkspace("clinic_owner", destination))).toBe(true);
  });

  it("keeps high-risk administration role-specific", () => {
    expect(canAccessWorkspace("front_desk", "quality")).toBe(false);
    expect(canAccessWorkspace("provider", "settings")).toBe(false);
    expect(canAccessWorkspace("viewer", "settings")).toBe(false);
    expect(canAccessWorkspace("clinic_owner", "settings")).toBe(true);
    expect(can("viewer", "billing", "create")).toBe(false);
    expect(can("quality", "quality", "manage")).toBe(true);
    expect(can("case_manager", "cases", "manage")).toBe(true);
    expect(can("contractor", "grid", "read")).toBe(true);
    expect(can("contractor", "grid", "update")).toBe(true);
    expect(can("contractor", "credentialing", "read")).toBe(false);
    expect(can("contractor", "patients", "read")).toBe(false);
    expect(canAccessWorkspace("contractor", "grid")).toBe(true);
    expect(canAccessWorkspace("contractor", "dashboard")).toBe(false);
    expect(clinicResources).toEqual(expect.arrayContaining(["grid", "cases", "quality", "insurance", "telemedicine", "portal", "integrations", "ai"]));
  });

  it("requires every staff API method to declare an authorization gate", () => {
    const missing: string[] = [];
    for (const path of routeFiles(join(process.cwd(), "src/app/api"))) {
      const source = readFileSync(path, "utf8");
      const blocks = source.matchAll(/export async function (GET|POST|PATCH|PUT|DELETE)\b([\s\S]*?)(?=export async function (?:GET|POST|PATCH|PUT|DELETE)\b|$)/g);
      for (const block of blocks) {
        if (!block[2].includes("getClinicSession")) continue;
        if (/can\(session\.role|enforceApiPermission|canUseBreakGlass|canReviewRecordRequests/.test(block[2])) continue;
        /* EDU authorizes through a second legitimate boundary. resolveEduIdentity requires
           a clinic session, resolves the caller's enrollments, derives an EDU platform role
           by precedence and scopes to one institution — returning null when the caller has
           no enrollment and no clinic role granting EDU admin.

           Calling it is not enough to count. The route must also test the result and deny
           with 403 — routes vary between `!identity` and `!identity?.institutionId`, and
           several add a role check on top. Recognising the call alone would let a route
           resolve identity, ignore the answer, and still pass this guard. */
        const edu = /resolveEduIdentity/.test(block[2]) && /!identity\b/.test(block[2]) && /\b403\b/.test(block[2]);
        if (edu) continue;
        if (path.endsWith("/auth/logout/route.ts")) continue;
        missing.push(`${path.replace(process.cwd(), "")}:${block[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });
});

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { eduCohortFilter, eduInstitutionFilter, type EduIdentity } from "@/lib/edu/edu-session";

function routeFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? routeFiles(path) : entry.name === "route.ts" ? [path] : [];
  });
}

const API_ROOT = join(process.cwd(), "src/app/api");
const routes = routeFiles(API_ROOT).map((path) => ({
  path: path.replace(process.cwd(), ""),
  source: readFileSync(path, "utf8"),
}));
const staffRoutes = routes.filter(
  (route) => route.source.includes("getClinicSession") || route.source.includes("requireClinicSession"),
);

describe("tenant and actor scope are server-owned", () => {
  it("has a meaningful set of authenticated routes to inspect", () => {
    expect(staffRoutes.length).toBeGreaterThan(20);
  });

  it("does not accept tenant identifiers from authenticated request bodies", () => {
    const violations: string[] = [];
    for (const route of staffRoutes) {
      for (const match of route.source.matchAll(/^\s*(organizationId|tenantId)\s*:\s*z\./gm)) {
        violations.push(`${route.path} schema accepts ${match[1]}`);
      }
      for (const match of route.source.matchAll(/(?:body|payload|parsed\.data|input)\.(organizationId|tenantId)\b/g)) {
        violations.push(`${route.path} reads ${match[0]}`);
      }
    }
    expect(violations).toEqual([]);
  });

  it("does not accept a human decision-maker identity from the request body", () => {
    const violations: string[] = [];
    const sensitiveActorFields = [
      "decidedByUserId",
      "approvedByUserId",
      "reviewedByUserId",
      "gradedByUserId",
      "actorUserId",
    ];

    for (const route of staffRoutes) {
      for (const field of sensitiveActorFields) {
        const schemaPattern = new RegExp(`^\\s*${field}\\s*:\\s*z\\.`, "gm");
        if (schemaPattern.test(route.source)) violations.push(`${route.path} schema accepts ${field}`);
        const readPattern = new RegExp(`(?:body|payload|parsed\\.data|input)\\.${field}\\b`, "g");
        if (readPattern.test(route.source)) violations.push(`${route.path} reads ${field} from request input`);
      }
    }
    expect(violations).toEqual([]);
  });

  it("does not derive the session tenant from search params or headers", () => {
    const violations = staffRoutes
      .filter((route) => /organizationId\s*=\s*(?:searchParams|request\.headers|headers\(\))/.test(route.source))
      .map((route) => route.path);
    expect(violations).toEqual([]);
  });
});

describe("EDU scope fails closed", () => {
  const identity = (overrides: Partial<EduIdentity> = {}): EduIdentity =>
    ({ role: "edu_student", institutionId: "inst_1", enrollmentId: "enr_1", cohortIds: ["coh_1"], ...overrides }) as EduIdentity;

  it("filters to the resolved institution", () => {
    expect(eduInstitutionFilter(identity())).toEqual({ institutionId: "inst_1" });
  });

  it("matches nothing rather than everything when institution scope is absent", () => {
    const filter = eduInstitutionFilter(identity({ institutionId: null }));
    expect(filter).not.toEqual({});
    expect(filter.institutionId).toBe("__no_institution__");
  });

  it("narrows non-admins to their own cohorts and none when they have none", () => {
    expect(eduCohortFilter(identity())).toEqual({ cohortId: { in: ["coh_1"] } });
    expect(eduCohortFilter(identity({ cohortIds: [] }))).toEqual({ cohortId: "__no_cohort__" });
  });

  it("allows institution-wide admin scope only alongside the non-empty institution filter", () => {
    expect(eduCohortFilter(identity({ role: "edu_admin", cohortIds: [] }))).toEqual({});
    expect(eduInstitutionFilter(identity({ role: "edu_admin" }))).toEqual({ institutionId: "inst_1" });
  });
});

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { eduCohortFilter, eduInstitutionFilter, type EduIdentity } from "@/lib/edu/edu-session";

/**
 * Multi-tenant isolation, enforced at the shape of the code rather than by review.
 *
 * The failure this file exists to prevent is a single one: a handler that takes the
 * tenant from the request instead of from the session. It is easy to write, it passes
 * every functional test, and it hands one clinic another clinic's records.
 *
 * A behavioural cross-tenant test would need two seeded organizations and a database,
 * which this suite deliberately does not have. So the check is structural and runs
 * over every route in the repository — including ones written after today, which is
 * the property that matters. A new mutation path cannot quietly opt out of it.
 */

function routeFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? routeFiles(path) : entry.name === "route.ts" ? [path] : [];
  });
}

const API_ROOT = join(process.cwd(), "src/app/api");
const routes = routeFiles(API_ROOT).map((path) => ({ path: path.replace(process.cwd(), ""), source: readFileSync(path, "utf8") }));
const staffRoutes = routes.filter((route) => route.source.includes("getClinicSession"));

describe("tenant scope comes from the session", () => {
  it("has staff routes to check", () => {
    // Guards the scan itself: a refactor that moved or renamed routes would otherwise
    // make every assertion below vacuously true.
    expect(staffRoutes.length).toBeGreaterThan(20);
  });

  it("never sets organizationId from anything but the session", () => {
    const violations: string[] = [];
    for (const route of staffRoutes) {
      for (const match of route.source.matchAll(/organizationId:\s*([^,\n}]+)/g)) {
        const value = match[1].trim();
        if (value !== "session.organizationId") violations.push(`${route.path} -> ${value}`);
      }
    }
    expect(violations).toEqual([]);
  });

  it("never reads a tenant identifier out of the request body", () => {
    // A schema field named after a tenant is the tell. If one is ever added, this
    // fails before the handler that trusts it is written.
    const violations: string[] = [];
    for (const route of staffRoutes) {
      for (const match of route.source.matchAll(/^\s*(organizationId|institutionId|tenantId)\s*:\s*z\./gm)) {
        violations.push(`${route.path} -> ${match[1]}`);
      }
      for (const match of route.source.matchAll(/(?:body|parsed\.data|payload)\.(organizationId|institutionId|tenantId)\b/g)) {
        violations.push(`${route.path} -> ${match[0]}`);
      }
    }
    expect(violations).toEqual([]);
  });

  it("never attributes a human decision to a user the request named", () => {
    // `decidedByUserId` and `gradedByUserId` are what make "a person confirmed this"
    // a fact. A request-supplied actor would make them decoration.
    const violations: string[] = [];
    for (const route of staffRoutes) {
      for (const match of route.source.matchAll(/(decidedByUserId|gradedByUserId|actorUserId|createdByUserId):\s*([^,\n}]+)/g)) {
        const value = match[2].trim();
        if (value !== "session.userId" && value !== "input.userId") violations.push(`${route.path} -> ${match[1]}: ${value}`);
      }
    }
    expect(violations).toEqual([]);
  });
});

describe("EDU scope fails closed", () => {
  const identity = (overrides: Partial<EduIdentity> = {}): EduIdentity =>
    ({ role: "edu_student", institutionId: "inst_1", enrollmentId: "enr_1", cohortIds: ["coh_1"], ...overrides }) as EduIdentity;

  it("filters to the resolved institution", () => {
    expect(eduInstitutionFilter(identity())).toEqual({ institutionId: "inst_1" });
  });

  it("matches nothing rather than everything when no institution resolves", () => {
    // The dangerous version of this function returns `{}` — which Prisma reads as
    // "every row in the table". An unresolvable scope must return no rows, not all.
    const filter = eduInstitutionFilter(identity({ institutionId: null }));
    expect(filter).not.toEqual({});
    expect(filter.institutionId).toBeTruthy();
    expect(filter.institutionId).not.toBe("inst_1");
  });

  it("narrows a non-admin to their own cohorts, and to none when they have none", () => {
    expect(eduCohortFilter(identity())).toEqual({ cohortId: { in: ["coh_1"] } });
    expect(eduCohortFilter(identity({ cohortIds: [] }))).toEqual({ cohortId: "__no_cohort__" });
  });

  it("lets an admin read institution-wide, still inside the institution filter", () => {
    // An empty cohort narrowing is correct here only because it is always combined
    // with the institution filter above, which is never empty.
    expect(eduCohortFilter(identity({ role: "edu_admin", cohortIds: [] }))).toEqual({});
    expect(eduInstitutionFilter(identity({ role: "edu_admin" }))).toEqual({ institutionId: "inst_1" });
  });
});

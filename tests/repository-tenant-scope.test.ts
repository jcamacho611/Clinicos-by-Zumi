import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Every repository query must name its tenant, or say why it does not have one.
 *
 * `tests/tenant-isolation.test.ts` covers the input side — a tenant identifier can never
 * arrive from a request body, header or search param. This covers the other half: that
 * the queries themselves actually filter by organization.
 *
 * 391 of 411 queries already do. The discipline is real and was maintained by
 * convention, which is exactly the problem: one new `db.patient.findMany({ where: {
 * status: "active" } })` leaks every tenant's patients and nothing would notice. This
 * turns the convention into a gate.
 *
 * Genuinely cross-organization reads are listed below with a reason. The list is keyed by
 * file, model and operation, so adding a *different* unscoped query to an already-listed
 * file still fails — an entry excuses one known query, never a whole file.
 */

/** Filters that establish a tenant, including scoping through a relation. */
const TENANT_SCOPED = /organizationId|institutionId|tenantId|organization:\s*\{|encounter:\s*\{|patient:\s*\{/;

/**
 * Queries that legitimately have no single tenant. Each records why, because the reason
 * is the part a future reader needs — "it was already like that" is not one.
 */
const CROSS_ORGANIZATION_BY_DESIGN: ReadonlyArray<{
  file: string; model: string; op: string; reason: string;
}> = [
  { file: "care-team-repository.ts", model: "provider", op: "findMany", reason: "Resolves names for provider ids already gathered from a tenant-scoped care team query." },
  { file: "consent-repository.ts", model: "organization", op: "findMany", reason: "Resolves names for recipient organizations named on the patient's own consent record." },
  { file: "feature-registry-repository.ts", model: "featureRegistrySection", op: "findMany", reason: "The product capability registry describes Klinikos itself and has no tenant." },
  { file: "feature-registry-repository.ts", model: "featureRegistrySection", op: "count", reason: "Counts the same tenant-less product registry." },
  { file: "feature-registry-repository.ts", model: "featureRegistryCapability", op: "count", reason: "Counts the same tenant-less product registry." },
  { file: "feature-registry-repository.ts", model: "featureRegistryCapability", op: "groupBy", reason: "Groups the same tenant-less product registry by delivery status." },
  { file: "grid-marketplace-repository.ts", model: "gridServiceListing", op: "findMany", reason: "Grid is a cross-organization marketplace; listings are filtered to active and deliberately span tenants." },
  { file: "grid-marketplace-repository.ts", model: "location", op: "findMany", reason: "Only locations explicitly marked marketplaceVisible, which is the opt-in that makes them cross-organization." },
  { file: "luxe-deposit-checkout-repository.ts", model: "organization", op: "findUnique", reason: "Resolves one known organization by its constant slug." },
  { file: "luxe-godaddy-conversation-repository.ts", model: "organization", op: "findUnique", reason: "Resolves one known organization by its constant slug." },
  { file: "luxe-processor-payment-evidence-repository.ts", model: "organization", op: "findUnique", reason: "Resolves one known organization by its constant slug." },
  { file: "luxe-public-conversion-repository.ts", model: "organization", op: "findFirst", reason: "Resolves one known organization by its constant slug." },
  { file: "luxe-refund-evidence-repository.ts", model: "organization", op: "findUnique", reason: "Resolves one known organization by its constant slug." },
  { file: "network-access-repository.ts", model: "recordRequest", op: "updateMany", reason: "Marks delivery on the request referenced by an access grant that was itself loaded scoped to the caller's organization." },
  { file: "network-directory-repository.ts", model: "organization", op: "findMany", reason: "A network directory of organizations; organizations are the tenant, so listing them is the feature." },
  { file: "network-growth-repository.ts", model: "organization", op: "findMany", reason: "Lists organizations for network growth signals; organizations are the tenant boundary itself." },
  { file: "network-handoff-repository.ts", model: "organization", op: "findMany", reason: "Resolves counterpart organizations for cross-organization handoffs." },
  { file: "provider-consultation-repository.ts", model: "organization", op: "findMany", reason: "Resolves counterpart organizations available for consultation." },
  { file: "referral-repository.ts", model: "organization", op: "findMany", reason: "Resolves names for destination organizations already narrowed by eligibility." },
  { file: "sales-demo-repository.ts", model: "organization", op: "findFirst", reason: "Resolves the demo organization by its constant slug." },
];

const READ_WRITE = "findMany|findFirst|findUnique|count|aggregate|updateMany|deleteMany|groupBy";

function unscopedQueries() {
  const dir = "src/lib/repositories";
  const found: Array<{ file: string; model: string; op: string; line: number }> = [];

  for (const file of readdirSync(dir).filter((name) => name.endsWith(".ts") && !name.endsWith(".test.ts"))) {
    const source = readFileSync(join(dir, file), "utf8");
    for (const match of source.matchAll(new RegExp(`\\bdb\\.([a-zA-Z]+)\\.(${READ_WRITE})\\s*\\(`, "g"))) {
      // Walk the balanced argument so a nested object cannot end the scan early.
      let index = (match.index ?? 0) + match[0].length;
      const start = index;
      let depth = 1;
      while (index < source.length && depth > 0) {
        const char = source[index];
        if (char === "(") depth += 1;
        else if (char === ")") depth -= 1;
        index += 1;
      }
      const argument = source.slice(start, index - 1).slice(0, 900);
      if (TENANT_SCOPED.test(argument)) continue;
      found.push({ file, model: match[1], op: match[2], line: source.slice(0, match.index).split("\n").length });
    }
  }
  return found;
}

describe("repository tenant scope", () => {
  const unscoped = unscopedQueries();

  it("inspects a meaningful number of repositories", () => {
    // Guards the guard: a broken scan that finds nothing must not read as success.
    const files = readdirSync("src/lib/repositories").filter((name) => name.endsWith(".ts"));
    expect(files.length).toBeGreaterThan(50);
    expect(unscoped.length).toBeGreaterThan(0);
  });

  it("allows no repository query to skip its tenant without a recorded reason", () => {
    const allowed = new Set(CROSS_ORGANIZATION_BY_DESIGN.map((entry) => `${entry.file}:${entry.model}:${entry.op}`));
    const offenders = unscoped
      .filter((query) => !allowed.has(`${query.file}:${query.model}:${query.op}`))
      .map((query) => `${query.file}:${query.line} db.${query.model}.${query.op} has no organizationId filter`);

    expect(
      offenders,
      "scope this query by organization, or add it to CROSS_ORGANIZATION_BY_DESIGN with the reason it has no tenant",
    ).toEqual([]);
  });

  it("keeps every recorded exception explained and still real", () => {
    const present = new Set(unscoped.map((query) => `${query.file}:${query.model}:${query.op}`));
    for (const entry of CROSS_ORGANIZATION_BY_DESIGN) {
      expect(entry.reason.length, `${entry.file} needs a real reason`).toBeGreaterThan(30);
      // A stale exception is a hole nobody is watching: it would silently excuse a query
      // that later gets added back unscoped.
      expect(present.has(`${entry.file}:${entry.model}:${entry.op}`), `${entry.file}:${entry.model}.${entry.op} is no longer unscoped — remove this exception`).toBe(true);
    }
  });
});

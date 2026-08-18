import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  competencyDeterminationSchema,
  competencyIsDemonstrated,
  competencyStatuses,
  competencyStatusForDetermination,
} from "@/lib/edu/competency-determination";

/**
 * An instructor's determination and the stored competency status are two different
 * vocabularies. The grades API previously wrote the determination straight into the
 * status column, so every determination was rejected by PostgreSQL with
 * `education_competencies_status_check` — while TypeScript, ESLint and the unit
 * suite all stayed green, because both values are strings.
 *
 * These checks read the CHECK constraint out of the committed migration rather than
 * restating it, so the schema stays the authority.
 */

function statusesAllowedByMigration(): string[] {
  const dir = path.join(process.cwd(), "prisma/migrations");
  for (const entry of fs.readdirSync(dir)) {
    const file = path.join(dir, entry, "migration.sql");
    if (!fs.existsSync(file)) continue;
    const sql = fs.readFileSync(file, "utf8");
    const match = sql.match(/education_competencies_status_check[\s\S]*?CHECK\s*\([\s\S]*?IN\s*\(([^)]*)\)/i);
    if (match) return [...match[1].matchAll(/'([^']+)'/g)].map((hit) => hit[1]);
  }
  throw new Error("education_competencies_status_check was not found in any committed migration");
}

describe("EDU competency status vocabulary", () => {
  it("declares exactly the statuses the database accepts", () => {
    expect([...competencyStatuses].sort()).toEqual(statusesAllowedByMigration().sort());
  });

  it("maps every possible determination onto a status the database accepts", () => {
    const allowed = new Set(statusesAllowedByMigration());
    for (const determination of competencyDeterminationSchema.shape.determination.options) {
      const status = competencyStatusForDetermination(determination);
      expect(allowed.has(status), `"${determination}" maps to "${status}", which the schema rejects`).toBe(true);
    }
  });

  it("never writes the determination vocabulary into the status column", () => {
    // The exact bug: "demonstrated" and "needs_development" are determinations, not
    // statuses, and neither is a legal value in this column.
    const allowed = new Set(statusesAllowedByMigration());
    for (const determination of competencyDeterminationSchema.shape.determination.options) {
      expect(allowed.has(determination), `"${determination}" must not be a stored status`).toBe(false);
    }

    const route = fs.readFileSync(path.join(process.cwd(), "src/app/api/edu/grades/route.ts"), "utf8");
    expect(route).not.toContain("status: body.determination");
    expect(route).toContain("status: competencyStatusForDetermination(body.determination)");
  });

  it("reads demonstrated competencies through the shared helper, not a literal", () => {
    expect(competencyIsDemonstrated(competencyStatusForDetermination("demonstrated"))).toBe(true);
    expect(competencyIsDemonstrated(competencyStatusForDetermination("needs_development"))).toBe(false);
    for (const status of ["not_assessed", "developing", "approaching"] as const) {
      expect(competencyIsDemonstrated(status)).toBe(false);
    }
    // A reader comparing to the determination word would silently find nothing.
    expect(competencyIsDemonstrated("demonstrated")).toBe(false);

    const bridge = fs.readFileSync(path.join(process.cwd(), "src/lib/ecosystem/edu-grid-bridge.ts"), "utf8");
    expect(bridge).not.toContain('=== "demonstrated"');
    expect(bridge).toContain("competencyIsDemonstrated");
  });
});

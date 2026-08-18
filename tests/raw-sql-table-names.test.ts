import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Every Prisma model in this schema is `@@map`ped to a snake_case table, so the model
 * name is never the table name. Raw SQL that names the model compiles, type-checks,
 * lints and passes every unit test — then throws `42P01 relation does not exist` the
 * first time a real request reaches it.
 *
 * This is a known defect class here: `docs/MVP_JOURNEYS.md` records migrations that
 * referenced model names instead of mapped table names, "making a fresh deploy
 * impossible while unit tests stayed green". It recurred in application raw SQL and
 * took down `/grid/transactions`, a terminal step of two Klinikos routes.
 */

function readSchemaModels() {
  const schema = fs.readFileSync(path.join(process.cwd(), "prisma/schema.prisma"), "utf8");
  const models = new Map<string, string>();
  for (const match of schema.matchAll(/^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm)) {
    const [, name, body] = match;
    const mapped = body.match(/@@map\("([^"]+)"\)/);
    models.set(name, mapped ? mapped[1] : name);
  }
  return models;
}

function walk(dir: string, out: string[] = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

describe("raw SQL uses mapped table names", () => {
  it("never names a Prisma model where PostgreSQL expects the mapped table", () => {
    const models = readSchemaModels();
    const remapped = [...models.entries()].filter(([name, table]) => name !== table);
    expect(remapped.length).toBeGreaterThan(0);

    const offenders: string[] = [];
    for (const file of walk(path.join(process.cwd(), "src"))) {
      const source = fs.readFileSync(file, "utf8");
      if (!source.includes("$queryRaw") && !source.includes("$executeRaw")) continue;
      for (const [name, table] of remapped) {
        const pattern = new RegExp(`(?:FROM|JOIN|INTO|UPDATE)\\s+"${name}"`, "g");
        for (const match of source.matchAll(pattern)) {
          const line = source.slice(0, match.index).split("\n").length;
          offenders.push(`${path.relative(process.cwd(), file)}:${line} uses "${name}" but the table is "${table}"`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});

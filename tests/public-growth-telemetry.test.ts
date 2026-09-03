import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schemaPath = "prisma/models/public-growth.prisma";
const eventsPath = "src/lib/distribution/public-growth-events.ts";
const repositoryPath = "src/lib/repositories/public-growth-repository.ts";

describe("P02 funnel telemetry", () => {
  it("stores aggregate counts without a user-level surveillance model", () => {
    expect(existsSync(schemaPath), schemaPath).toBe(true);
    const schema = readFileSync(schemaPath, "utf8");

    for (const required of ["day", "eventType", "count"]) {
      expect(schema).toContain(required);
    }

    for (const forbidden of [
      "personId",
      "accountId",
      "sessionId",
      "email",
      "ipAddress",
      "userAgent",
      "prompt",
      "question",
      "metadata",
    ]) {
      expect(schema).not.toContain(forbidden);
    }
  });

  it("accepts only the controlled aggregate event vocabulary", () => {
    expect(existsSync(eventsPath), eventsPath).toBe(true);
    const events = readFileSync(eventsPath, "utf8");
    for (const name of [
      "PUBLIC_FIRST_VALUE",
      "PUBLIC_NO_RESULT",
      "FREE_SIGNUP_COMPLETED",
      "PERSON_PATH_RESUMED",
    ]) {
      expect(events).toContain(name);
    }
  });

  it("keeps the recorder server-only and bounded to aggregate dimensions", () => {
    expect(existsSync(repositoryPath), repositoryPath).toBe(true);
    const repository = readFileSync(repositoryPath, "utf8");
    expect(repository).toContain('import "server-only"');
    expect(repository).toContain("publicGrowthDailyCounter.upsert");
    expect(repository).toContain("eventType");
    expect(repository).toContain("pathId");
    for (const forbidden of ["personId", "accountId", "sessionId", "email", "ipAddress", "userAgent", "prompt"])
      expect(repository).not.toContain(forbidden);
  });
});

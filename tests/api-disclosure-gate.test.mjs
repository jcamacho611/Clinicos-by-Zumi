import { describe, expect, it } from "vitest";
import {
  findDisclosureFailures,
  responsePayloadRegions,
} from "../scripts/security/api-disclosure-rules.mjs";

function keys(source) {
  return findDisclosureFailures(source).map((failure) => failure.key);
}

/**
 * The gate had no tests, and it showed: its payload rules matched a fixed character
 * window after every `.json(`, so unrelated code below a response was reported as that
 * response disclosing it. Six of nine findings against the real routes were that false
 * positive. These fix the rules in place so the next heuristic cannot quietly rot.
 */
describe("API disclosure rules", () => {
  describe("what must still be caught", () => {
    it("catches environment state serialized into a response", () => {
      expect(
        keys(`return NextResponse.json({ ok: true, db: process.env.DATABASE_URL });`),
      ).toContain("raw-process-env-response");
    });

    it("catches an environment read nested inside the payload", () => {
      expect(
        keys(`return NextResponse.json({ status: { configured: Boolean(process.env.DATABASE_URL) } });`),
      ).toContain("raw-process-env-response");
    });

    it("catches a spread session or config object", () => {
      expect(keys(`return NextResponse.json({ ...session });`)).toContain(
        "raw-sensitive-object-spread",
      );
    });

    it("catches an unnormalized exception message", () => {
      expect(keys(`return NextResponse.json({ error: error.message }, { status: 500 });`)).toContain(
        "raw-error-message",
      );
    });

    it("catches a raw validation issue array", () => {
      expect(keys(`return NextResponse.json({ issues: error.issues });`)).toContain(
        "raw-validation-details",
      );
    });

    it("catches a stack trace", () => {
      expect(keys(`return NextResponse.json({ trace: error.stack });`)).toContain(
        "raw-error-stack",
      );
    });

    it("catches field-name rules anywhere in the route, not only in a payload", () => {
      expect(keys(`const telemetry = { costMicroUsd: 12 };`)).toContain("ai-internal-telemetry");
      expect(keys(`const problem = { missingEnv: "STRIPE_SECRET_KEY" };`)).toContain(
        "environment-secret-name",
      );
    });

    it("catches environment state interpolated into a response string", () => {
      // Masking removes literal text, but an expression inside `${...}` is code and
      // really is disclosure, so it stays visible to the rules.
      expect(
        keys("return NextResponse.json({ error: `Connect ${process.env.DATABASE_URL} first.` });"),
      ).toContain("raw-process-env-response");
    });

    it("catches disclosure through a route's own json() helper", () => {
      // Routes define local `json(...)` wrappers. They reach the same browser.
      expect(keys(`return json({ error: error.message }, 500);`)).toContain("raw-error-message");
    });
  });

  describe("what must no longer be reported", () => {
    it("does not blame a response for an environment guard that follows it", () => {
      // The exact false positive. The response serializes a literal string; the
      // environment read belongs to a different function eleven lines below.
      const source = `
export async function GET() {
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  return NextResponse.json({ data: await load() });
}

export async function POST() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "This needs PostgreSQL." }, { status: 503 });
  }
}`;
      expect(keys(source)).not.toContain("raw-process-env-response");
    });

    it("does not treat the status or headers argument as payload", () => {
      expect(
        keys(`return NextResponse.json({ ok: true }, { headers: { "x-mode": process.env.NODE_ENV } });`),
      ).not.toContain("raw-process-env-response");
    });

    it("does not read request.json() as a response", () => {
      expect(keys(`const body = await request.json();\nif (!process.env.DATABASE_URL) return;`)).toEqual(
        [],
      );
    });

    it("accepts an explicit projection of validation issues", () => {
      // Telling someone which field to fix is the job. Dumping Zod's internal shape,
      // including received values, is not the same thing.
      expect(
        keys(
          `return NextResponse.json({ error: "Invalid.", issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) }, { status: 400 });`,
        ),
      ).not.toContain("raw-validation-details");
    });

    it("does not match text that merely mentions the pattern inside a string", () => {
      expect(
        keys(`return NextResponse.json({ error: "Set process.env.DATABASE_URL to continue." });`),
      ).not.toContain("raw-process-env-response");
    });
  });

  describe("payload extraction", () => {
    it("reads the whole first argument, however nested", () => {
      const source = `NextResponse.json({ a: { b: [1, 2, { c: 3 }] } }, { status: 200 })`;
      const [region] = responsePayloadRegions(source);

      expect(source.slice(region.start, region.end).trim()).toBe("{ a: { b: [1, 2, { c: 3 }] } }");
    });

    it("is not confused by braces or parens inside strings", () => {
      const source = `NextResponse.json({ error: "unbalanced ) { message" }, { status: 400 })`;
      const [region] = responsePayloadRegions(source);

      expect(source.slice(region.start, region.end).trim()).toBe(
        `{ error: "unbalanced ) { message" }`,
      );
    });

    it("records no payload for a call with no arguments", () => {
      expect(responsePayloadRegions(`await request.json()`)).toEqual([]);
    });
  });
});

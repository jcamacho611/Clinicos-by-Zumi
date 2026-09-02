import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("src/app/api/paths/route.ts", "utf8");

describe("Living Home Path authority ordering", () => {
  it("does not require Path mutation authority before classifying a typed request", () => {
    const postStart = source.indexOf("export async function POST");
    const responderStart = source.indexOf("async function respondToTypedIntent");
    const post = source.slice(postStart, responderStart);

    expect(postStart).toBeGreaterThan(-1);
    expect(post).not.toContain('enforceApiPermission(session, "tasks", "create"');
    expect(post).toContain("resolveIntentSchema.safeParse(body)");
  });

  it("requires tasks:create immediately before either Path persistence route", () => {
    const responderStart = source.indexOf("async function respondToTypedIntent");
    const responder = source.slice(responderStart);
    const permission = responder.indexOf('enforceApiPermission(session, "tasks", "create"');
    const persistence = responder.indexOf("createPathInstance(session, { pathId, goal: text })");

    expect(permission).toBeGreaterThan(-1);
    expect(persistence).toBeGreaterThan(permission);

    const directPathMarker = source.indexOf("const input = createPathSchema.parse(body)");
    const directPermission = source.lastIndexOf('enforceApiPermission(session, "tasks", "create"', responderStart);
    const directPersistence = source.indexOf("createPathInstance(session, input)");

    expect(directPathMarker).toBeGreaterThan(-1);
    expect(directPermission).toBeGreaterThan(directPathMarker);
    expect(directPersistence).toBeGreaterThan(directPermission);
  });

  it("keeps read-only surface and clarification outcomes before typed Path mutation", () => {
    const responderStart = source.indexOf("async function respondToTypedIntent");
    const responder = source.slice(responderStart);
    const surface = responder.indexOf("resolveSurfaceLookup");
    const clarification = responder.indexOf('outcome: "clarification"');
    const permission = responder.indexOf('enforceApiPermission(session, "tasks", "create"');

    expect(surface).toBeGreaterThan(-1);
    expect(clarification).toBeGreaterThan(surface);
    expect(permission).toBeGreaterThan(clarification);
  });
});

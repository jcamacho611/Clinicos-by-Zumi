import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  const file = path.join(root, relativePath);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
}

function withoutTypeOnlyImports(source: string) {
  return source
    .replace(/import\s+type\b[\s\S]*?\bfrom\s*["'][^"']+["']\s*;?/g, "")
    .replace(/export\s+type\b[\s\S]*?\bfrom\s*["'][^"']+["']\s*;?/g, "");
}

describe("Living Home server authority boundary", () => {
  it("keeps the browser-safe view model free of orchestration/runtime authority", () => {
    const source = read("src/lib/home/living-home-view-model.ts");
    expect(source).not.toBeNull();
    expect(source).toContain("export type LivingHomePathView");
    expect(source).toContain("export type LivingHomeCommandView");
    expect(source).not.toContain("server-only");
    expect(source).not.toContain("@/lib/orchestration");
    expect(source).not.toContain("@/lib/repositories");
    expect(source).not.toContain("@/lib/db");
  });

  it("marks the Living Home projector as server-only and projects presentation truth", () => {
    const source = read("src/lib/home/living-home-presentation.ts");
    expect(source).not.toBeNull();
    expect(source).toContain('import "server-only"');
    expect(source).toContain("projectLivingHomePath");
    expect(source).toContain("projectLivingHomePaths");
    expect(source).toContain("resolvePathRuntime");
    expect(source).toContain("getKlinikosPath");
    expect(source).not.toContain("alternatives:");
    expect(source).not.toContain("capabilityKey:");
  });

  it("adds an authenticated command endpoint that owns intent and Path selection", () => {
    const source = read("src/app/api/living-home/command/route.ts");
    expect(source).not.toBeNull();
    expect(source).toContain("getClinicSession");
    expect(source).toContain("enforceApiPermission");
    expect(source).toContain("resolveIntentDeterministically");
    expect(source).toContain("resolveSurfaceLookup");
    expect(source).toContain("createPathInstance");
    expect(source).toContain("projectLivingHomePath");
    expect(source).toContain("z.object");
    expect(source).toContain("text:");
    expect(source).not.toContain("organizationId:");
    expect(source).not.toContain("userId:");
    expect(source).not.toContain("pathId: z.");

    const permissionCall = source?.indexOf('enforceApiPermission(session, "tasks", "create"') ?? -1;
    const persistenceCall = source?.indexOf("createPathInstance(session, { pathId, goal: text })") ?? -1;
    expect(permissionCall).toBeGreaterThan(-1);
    expect(persistenceCall).toBeGreaterThan(permissionCall);
  });

  it("projects initial Paths on the dashboard before serialization", () => {
    const source = read("src/app/(platform)/dashboard/page.tsx");
    expect(source).not.toBeNull();
    expect(source).toContain("projectLivingHomePaths");
    expect(source).toContain("initialPaths={livingPathViews}");
    expect(source).not.toContain("initialGuidance={pathGuidance}");
  });

  it("keeps proprietary runtime orchestration out of Living Home Client Components", () => {
    for (const file of [
      "src/components/clinic/living-home.tsx",
      "src/components/clinic/living-home-operations.tsx",
    ]) {
      const source = read(file);
      expect(source, file).not.toBeNull();
      expect(source, file).toContain('"use client"');
      const runtimeSource = withoutTypeOnlyImports(source ?? "");
      expect(runtimeSource, file).not.toMatch(/from ["']@\/lib\/orchestration\//);
      expect(runtimeSource, file).not.toContain("resolveIntentDeterministically");
      expect(runtimeSource, file).not.toContain("resolvePathRuntime");
      expect(runtimeSource, file).not.toContain("getKlinikosPath");
    }
  });

  it("makes the Living Home client call the dedicated command endpoint", () => {
    const source = read("src/components/clinic/living-home.tsx");
    expect(source).not.toBeNull();
    expect(source).toContain('fetch("/api/living-home/command"');
    expect(source).toContain("LivingHomeCommandView");
    expect(source).not.toContain('fetch("/api/paths"');
  });
});

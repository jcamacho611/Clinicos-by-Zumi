import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const vercel = JSON.parse(readFileSync("vercel.json", "utf8"));
const postinstall = readFileSync("scripts/postinstall.mjs", "utf8");

describe("Vercel production deployment contract", () => {
  it("uses the ordinary Next.js application build", () => {
    expect(vercel.framework).toBe("nextjs");
    expect(vercel.buildCommand).toBe("npm run build");
    expect(packageJson.scripts.build).toContain("next build");
  });

  it("does not run database migrations or the Render-specific build path", () => {
    const serialized = JSON.stringify(vercel);
    expect(serialized).not.toContain("migrate deploy");
    expect(serialized).not.toContain("db push");
    expect(serialized).not.toContain("render:build");
  });

  it("keeps non-Render postinstall limited to Prisma client generation", () => {
    const nonRenderBranch = postinstall.slice(postinstall.indexOf("} else {"));
    expect(nonRenderBranch).toContain('"generate"');
    expect(nonRenderBranch).not.toContain('"migrate"');
    expect(nonRenderBranch).not.toContain('"db", "push"');
  });
});

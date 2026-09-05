import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("P01 authenticated RealityProjection boundary", () => {
  it("builds the member spatial projection on the server page", () => {
    const page = read("src/app/member/page.tsx");
    expect(page).toContain('from "@/lib/living-reality/member-reality-projection"');
    expect(page).toContain("memberRealityProjection(projection)");
    expect(page).toContain("realityProjection={realityProjection}");
  });

  it("keeps the client shell from becoming projection or repository authority", () => {
    const shell = read("src/components/living-universe/universe-shell.tsx");
    expect(shell).toContain("realityProjection: RealityProjection");
    expect(shell).not.toContain("member-reality-projection");
    expect(shell).not.toMatch(/@\/lib\/(db|repositories|member\/member-home-repository|orchestration)/);
  });
});

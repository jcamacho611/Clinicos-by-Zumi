import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const layout = fs.readFileSync(path.join(process.cwd(), "src/app/layout.tsx"), "utf8");
const releaseIdentity = fs.readFileSync(path.join(process.cwd(), "src/lib/readiness/release-identity.ts"), "utf8");

describe("browser-visible release identity", () => {
  it("emits a non-secret build identity in document metadata", () => {
    expect(layout).toContain("readBuildReleaseIdentity");
    expect(layout).toContain('name="klinikos-release"');
    expect(layout).not.toContain("NEXT_PUBLIC");
    expect(layout).not.toContain("process.env");
  });

  it("accepts only full hexadecimal Git identities", () => {
    expect(releaseIdentity).toContain("normalizeReleaseCommit");
    expect(releaseIdentity).toContain("40,64");
    expect(releaseIdentity).toContain('import "server-only"');
    expect(releaseIdentity).not.toContain("DATABASE_URL");
  });
});

import { describe, expect, it } from "vitest";
import { normalizeReleaseCommit, resolveReleaseIdentity } from "@/lib/readiness/release-identity";

describe("non-secret release identity", () => {
  const stamp = { commit: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", branch: "main" };

  it("prefers a valid host commit while exposing no unrelated environment values", () => {
    const identity = resolveReleaseIdentity({
      environment: {
        RENDER_GIT_COMMIT: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        RENDER_GIT_BRANCH: "release/living-universe",
      },
      stamp,
    });

    expect(identity).toEqual({
      commit: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      shortCommit: "bbbbbbbbbbbb",
      branch: "release/living-universe",
    });
    expect(JSON.stringify(identity)).not.toContain("password");
  });

  it("rejects malformed values and safely falls back to the validated build stamp", () => {
    expect(normalizeReleaseCommit("not-a-sha<script>")).toBeNull();
    expect(resolveReleaseIdentity({
      environment: {
        RENDER_GIT_COMMIT: "sk_live_not_a_commit",
        RENDER_GIT_BRANCH: "main<script>",
      },
      stamp,
    })).toEqual({
      commit: stamp.commit,
      shortCommit: stamp.commit.slice(0, 12),
      branch: stamp.branch,
    });
  });

  it("returns an unknown identity when neither source is valid", () => {
    expect(resolveReleaseIdentity({
      environment: { GIT_COMMIT_SHA: "short" },
      stamp: { commit: "also-invalid", branch: "../../unsafe branch" },
    })).toEqual({ commit: null, shortCommit: null, branch: null });
  });
});

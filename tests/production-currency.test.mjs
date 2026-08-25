import { describe, expect, it } from "vitest";
import {
  RELEASE_CURRENCY,
  compareRelease,
  describeRelease,
} from "../scripts/release/production-currency.mjs";

const MAIN = "4c6206a117b6ac91611356c255baf121ce4eda53";
const LIVE_DURING_INCIDENT = "43511f7843c2e022f195be534819513a5d5f5009";

describe("production release currency", () => {
  it("reports current when the live commit matches", () => {
    const result = compareRelease({
      liveCommit: MAIN,
      expectedCommit: MAIN,
      commitsBehind: 0,
    });

    expect(result).toMatchObject({ status: RELEASE_CURRENCY.CURRENT, ok: true });
    expect(describeRelease(result, { liveCommit: MAIN, expectedCommit: MAIN })).toContain(
      "running the latest code",
    );
  });

  it("matches a short commit against a full one in either direction", () => {
    expect(
      compareRelease({
        liveCommit: "4c6206a117b6",
        expectedCommit: MAIN,
        commitsBehind: 0,
      }).ok,
    ).toBe(true);

    expect(
      compareRelease({
        liveCommit: MAIN,
        expectedCommit: "4c6206a117b6",
        commitsBehind: 0,
      }).ok,
    ).toBe(true);
  });

  /**
   * The condition this exists for: the real incident, where the site answered "ok" for
   * forty hours while serving code 319 commits old.
   */
  it("fails when the live site is behind, and says so in plain language", () => {
    const result = compareRelease({
      liveCommit: LIVE_DURING_INCIDENT,
      expectedCommit: MAIN,
      commitsBehind: 319,
    });

    expect(result).toMatchObject({
      status: RELEASE_CURRENCY.BEHIND,
      commitsBehind: 319,
      ok: false,
    });

    const message = describeRelease(result, {
      liveCommit: LIVE_DURING_INCIDENT,
      expectedCommit: MAIN,
    });
    expect(message).toContain("319 changes behind");
    expect(message).toContain("43511f7843c2");
    expect(message).toContain("a deploy failed");
    // No internal status names leak into what a person reads.
    expect(message).not.toContain("RELEASE_CURRENCY");
    expect(message).not.toContain("commitsBehind");
  });

  it("pluralizes a single pending change", () => {
    const result = compareRelease({
      liveCommit: LIVE_DURING_INCIDENT,
      expectedCommit: MAIN,
      commitsBehind: 1,
    });

    expect(describeRelease(result, {})).toContain("1 change behind");
  });

  it("does not call a mismatch 'behind' when the distance is unknown", () => {
    const result = compareRelease({
      liveCommit: LIVE_DURING_INCIDENT,
      expectedCommit: MAIN,
      commitsBehind: null,
    });

    expect(result).toMatchObject({
      status: RELEASE_CURRENCY.AHEAD_OR_UNKNOWN,
      ok: false,
    });
    expect(describeRelease(result, {})).toContain("not simply behind");
  });

  it("treats a service that will not name its version as a failure, not as passing", () => {
    const result = compareRelease({
      liveCommit: null,
      expectedCommit: MAIN,
      commitsBehind: null,
    });

    expect(result).toMatchObject({ status: RELEASE_CURRENCY.UNREPORTED, ok: false });
    expect(describeRelease(result, {})).toContain("did not report which version");
  });
});

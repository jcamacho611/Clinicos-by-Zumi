import { describe, expect, it } from "vitest";
import {
  classifyProductionRelease,
  productionReleaseParityStates,
} from "../scripts/production-release-parity.mjs";

const history = ["current-main", "one-behind", "two-behind"];

describe("production release parity", () => {
  it("accepts only the exact current main commit", () => {
    expect(classifyProductionRelease(history, "current-main")).toEqual({
      state: productionReleaseParityStates.exactMain,
      commitsBehind: 0,
    });
  });

  it.each([
    ["one-behind", 1],
    ["two-behind", 2],
  ])("rejects a deployed commit %s main by %i", (commit, commitsBehind) => {
    expect(classifyProductionRelease(history, commit)).toEqual({
      state: productionReleaseParityStates.behindMain,
      commitsBehind,
    });
  });

  it("rejects a deployed commit outside main history", () => {
    expect(classifyProductionRelease(history, "other-branch")).toEqual({
      state: productionReleaseParityStates.notOnMain,
      commitsBehind: null,
    });
  });

  it("fails closed when current main history cannot be read", () => {
    expect(classifyProductionRelease([], "current-main")).toEqual({
      state: productionReleaseParityStates.historyUnavailable,
      commitsBehind: null,
    });
  });
});

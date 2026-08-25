/**
 * Is the code customers are using the code we think we shipped?
 *
 * Production ran 319 commits behind main for roughly forty hours and nothing reported it.
 * Every deploy failed silently: Render keeps serving the last good build when a build
 * fails, so the site stayed up, healthy, and wrong. "status": "ok" was true the entire
 * time — the health endpoint answers "is the server responding", not "is this the release
 * we intended".
 *
 * This answers the second question. It is deliberately pure: the caller fetches and reads
 * git, so the comparison itself can be tested without a network or a repository.
 */

export const RELEASE_CURRENCY = {
  CURRENT: "current",
  BEHIND: "behind",
  AHEAD_OR_UNKNOWN: "ahead_or_unknown",
  UNREPORTED: "unreported",
};

/**
 * @param {object} input
 * @param {string|null} input.liveCommit      commit reported by the running service
 * @param {string} input.expectedCommit       commit that should be live
 * @param {number|null} input.commitsBehind   commits from live to expected, null if unknown
 */
export function compareRelease({ liveCommit, expectedCommit, commitsBehind }) {
  if (!liveCommit) {
    return {
      status: RELEASE_CURRENCY.UNREPORTED,
      commitsBehind: null,
      // A service that cannot say what it is running cannot be verified by anything else
      // either, so this is a failure rather than an inconclusive result.
      ok: false,
    };
  }

  const live = liveCommit.trim().toLowerCase();
  const expected = expectedCommit.trim().toLowerCase();
  const matches =
    live === expected || live.startsWith(expected) || expected.startsWith(live);

  if (matches) {
    return { status: RELEASE_CURRENCY.CURRENT, commitsBehind: 0, ok: true };
  }
  if (typeof commitsBehind === "number" && commitsBehind > 0) {
    return { status: RELEASE_CURRENCY.BEHIND, commitsBehind, ok: false };
  }

  // Different commit, but not an ancestor of the branch we compared against. A rollback,
  // a deploy from another branch, or a stale local checkout all land here, and each one
  // needs a human to look rather than an automatic verdict.
  return { status: RELEASE_CURRENCY.AHEAD_OR_UNKNOWN, commitsBehind: null, ok: false };
}

/**
 * The sentence a person reads.
 *
 * Says what is happening, why it matters, and what to do next — no status enum names, no
 * commit-graph vocabulary, and no implication that someone was careless.
 */
export function describeRelease(result, { liveCommit, expectedCommit } = {}) {
  const live = liveCommit ? liveCommit.slice(0, 12) : "unknown";
  const expected = expectedCommit ? expectedCommit.slice(0, 12) : "unknown";

  switch (result.status) {
    case RELEASE_CURRENCY.CURRENT:
      return `The live site is running the latest code (${live}). Nothing to do.`;

    case RELEASE_CURRENCY.BEHIND: {
      const count = result.commitsBehind;
      const changes = count === 1 ? "1 change" : `${count} changes`;
      return [
        `The live site is running older code. It is ${changes} behind.`,
        `Customers are seeing ${live}. The latest code is ${expected}.`,
        "",
        "This usually means a deploy failed. The site stays up when that happens, so",
        "nothing looks broken from the outside — the last working version keeps serving.",
        "",
        "What to do: open the deploy log for the most recent build and read why it stopped.",
      ].join("\n");
    }

    case RELEASE_CURRENCY.AHEAD_OR_UNKNOWN:
      return [
        `The live site is running ${live}, which is not the latest code (${expected}).`,
        "",
        "It is not simply behind, so this is not an ordinary failed deploy. It may have",
        "been rolled back, deployed from a different branch, or this checkout may be out",
        "of date.",
        "",
        "What to do: confirm which branch the deploy is tracking before changing anything.",
      ].join("\n");

    default:
      return [
        "The live site did not report which version it is running.",
        "",
        "Until it does, there is no way to tell whether a deploy worked.",
        "",
        "What to do: check that the service is reachable and that its health endpoint is",
        "responding.",
      ].join("\n");
  }
}

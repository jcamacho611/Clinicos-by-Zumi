export const productionReleaseParityStates = Object.freeze({
  exactMain: "EXACT_MAIN",
  behindMain: "BEHIND_MAIN",
  notOnMain: "NOT_ON_MAIN",
  historyUnavailable: "HISTORY_UNAVAILABLE",
});

export function classifyProductionRelease(history, deployedCommit) {
  if (!Array.isArray(history) || history.length === 0) {
    return { state: productionReleaseParityStates.historyUnavailable, commitsBehind: null };
  }

  const commitsBehind = history.indexOf(deployedCommit);
  if (commitsBehind === -1) {
    return { state: productionReleaseParityStates.notOnMain, commitsBehind: null };
  }
  if (commitsBehind > 0) {
    return { state: productionReleaseParityStates.behindMain, commitsBehind };
  }
  return { state: productionReleaseParityStates.exactMain, commitsBehind: 0 };
}

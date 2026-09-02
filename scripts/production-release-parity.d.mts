export const productionReleaseParityStates: Readonly<{
  exactMain: "EXACT_MAIN";
  behindMain: "BEHIND_MAIN";
  notOnMain: "NOT_ON_MAIN";
  historyUnavailable: "HISTORY_UNAVAILABLE";
}>;

export type ProductionReleaseParity =
  | { state: "EXACT_MAIN"; commitsBehind: 0 }
  | { state: "BEHIND_MAIN"; commitsBehind: number }
  | { state: "NOT_ON_MAIN" | "HISTORY_UNAVAILABLE"; commitsBehind: null };

export function classifyProductionRelease(
  history: readonly string[],
  deployedCommit: string,
): ProductionReleaseParity;

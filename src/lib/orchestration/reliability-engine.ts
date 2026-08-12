export type DependencyHealth = "healthy" | "degraded" | "unavailable" | "unknown";

export type DependencyState = {
  id: string;
  health: DependencyHealth;
  lastCheckedAt: Date;
  lastSuccessAt?: Date | null;
  message?: string | null;
  manualFallbackAvailable: boolean;
};

export type ReliabilityDecision = {
  continuePath: boolean;
  useManualFallback: boolean;
  retryRecommended: boolean;
  userMessage: string;
};

export function evaluateReliability(state: DependencyState): ReliabilityDecision {
  if (state.health === "healthy") {
    return { continuePath: true, useManualFallback: false, retryRecommended: false, userMessage: "Connection is healthy." };
  }
  if (state.health === "degraded") {
    return {
      continuePath: true,
      useManualFallback: state.manualFallbackAvailable,
      retryRecommended: true,
      userMessage: state.manualFallbackAvailable ? "Connection is degraded. Klinikos can preserve the Path and use the approved fallback." : "Connection is degraded. Klinikos will preserve the Path and retry safe work.",
    };
  }
  if (state.health === "unavailable") {
    return {
      continuePath: state.manualFallbackAvailable,
      useManualFallback: state.manualFallbackAvailable,
      retryRecommended: true,
      userMessage: state.manualFallbackAvailable ? "Connection is unavailable. Your Path is saved and the approved manual fallback is available." : "Connection is unavailable. Your Path is saved; dependent actions remain blocked until recovery.",
    };
  }
  return {
    continuePath: state.manualFallbackAvailable,
    useManualFallback: state.manualFallbackAvailable,
    retryRecommended: true,
    userMessage: "Connection status is unknown. Klinikos will not assume availability; your Path remains preserved.",
  };
}

export function systemHealth(states: readonly DependencyState[]) {
  if (states.some((state) => state.health === "unavailable" && !state.manualFallbackAvailable)) return "unavailable" as const;
  if (states.some((state) => state.health === "degraded" || state.health === "unavailable" || state.health === "unknown")) return "degraded" as const;
  return "healthy" as const;
}

export type ZumiInvocationMeterRow = {
  organizationId: string;
  userId: string | null;
  capability: string;
  tier: string;
  outcome: "admitted" | "denied" | "error";
  reason: string | null;
  providerKey: string | null;
  modelId: string | null;
  inputTokens: number;
  outputTokens: number;
  costMicroUsd: number;
  durationMs: number;
  createdAt: Date;
};

type ZumiUsageBucket = {
  invocationCount: number;
  admittedCount: number;
  deniedCount: number;
  errorCount: number;
  inputTokens: number;
  outputTokens: number;
  costMicroUsd: number;
  durationMs: number;
};

export type ZumiUsageSummary = ZumiUsageBucket & {
  organizationId: string;
  byCapability: Record<string, ZumiUsageBucket>;
  byProvider: Record<string, ZumiUsageBucket>;
  byModel: Record<string, ZumiUsageBucket>;
  byTier: Record<string, ZumiUsageBucket>;
};

function emptyBucket(): ZumiUsageBucket {
  return {
    invocationCount: 0,
    admittedCount: 0,
    deniedCount: 0,
    errorCount: 0,
    inputTokens: 0,
    outputTokens: 0,
    costMicroUsd: 0,
    durationMs: 0,
  };
}

function requireNonNegativeInteger(value: number, field: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer.`);
  }
  return value;
}

function safeAdd(left: number, right: number, field: string) {
  const sum = left + right;
  if (!Number.isSafeInteger(sum) || sum < 0) {
    throw new Error(`${field} exceeds the safe integer range.`);
  }
  return sum;
}

function addRow(bucket: ZumiUsageBucket, row: ZumiInvocationMeterRow) {
  bucket.invocationCount = safeAdd(bucket.invocationCount, 1, "invocationCount");
  bucket.admittedCount = safeAdd(bucket.admittedCount, row.outcome === "admitted" ? 1 : 0, "admittedCount");
  bucket.deniedCount = safeAdd(bucket.deniedCount, row.outcome === "denied" ? 1 : 0, "deniedCount");
  bucket.errorCount = safeAdd(bucket.errorCount, row.outcome === "error" ? 1 : 0, "errorCount");
  bucket.inputTokens = safeAdd(bucket.inputTokens, requireNonNegativeInteger(row.inputTokens, "inputTokens"), "inputTokens");
  bucket.outputTokens = safeAdd(bucket.outputTokens, requireNonNegativeInteger(row.outputTokens, "outputTokens"), "outputTokens");
  bucket.costMicroUsd = safeAdd(bucket.costMicroUsd, requireNonNegativeInteger(row.costMicroUsd, "costMicroUsd"), "costMicroUsd");
  bucket.durationMs = safeAdd(bucket.durationMs, requireNonNegativeInteger(row.durationMs, "durationMs"), "durationMs");
}

function bucketFor(target: Record<string, ZumiUsageBucket>, key: string | null) {
  if (!key) return null;
  return target[key] ?? (target[key] = emptyBucket());
}

/**
 * Pure FinOps projection over the existing ZumiInvocation meter.
 *
 * The function fails closed if a caller accidentally mixes tenant rows. It accepts
 * only telemetry already present in ZumiInvocation and deliberately has no prompt,
 * question, answer, or response-text fields.
 */
export function summarizeZumiInvocations(
  organizationId: string,
  rows: readonly ZumiInvocationMeterRow[],
): ZumiUsageSummary {
  const normalizedOrganizationId = organizationId.trim();
  if (!normalizedOrganizationId) throw new Error("organizationId is required.");

  const summary: ZumiUsageSummary = {
    organizationId: normalizedOrganizationId,
    ...emptyBucket(),
    byCapability: {},
    byProvider: {},
    byModel: {},
    byTier: {},
  };

  for (const row of rows) {
    if (row.organizationId !== normalizedOrganizationId) {
      throw new Error("Cross-organization Zumi invocation data reached the FinOps aggregator.");
    }
    if (!row.capability.trim()) throw new Error("capability is required.");
    if (!row.tier.trim()) throw new Error("tier is required.");
    requireNonNegativeInteger(row.inputTokens, "inputTokens");
    requireNonNegativeInteger(row.outputTokens, "outputTokens");
    requireNonNegativeInteger(row.costMicroUsd, "costMicroUsd");
    requireNonNegativeInteger(row.durationMs, "durationMs");

    addRow(summary, row);
    addRow(bucketFor(summary.byCapability, row.capability)!, row);
    const providerBucket = bucketFor(summary.byProvider, row.providerKey);
    if (providerBucket) addRow(providerBucket, row);
    const modelBucket = bucketFor(summary.byModel, row.modelId);
    if (modelBucket) addRow(modelBucket, row);
    addRow(bucketFor(summary.byTier, row.tier)!, row);
  }

  return summary;
}

export type ZumiSpendGuardInput = {
  spentMicroUsd: number;
  estimatedNextCallMicroUsd: number;
  warningAtMicroUsd: number;
  hardLimitMicroUsd: number;
};

export type ZumiSpendGuardDecision = {
  state: "allow" | "warn" | "block";
  projectedMicroUsd: number;
  remainingMicroUsd: number;
};

/**
 * Deterministic server-side budget math. The caller owns policy such as which plan
 * supplies the limits and whether a clinical workflow may degrade instead of block.
 * This function only evaluates integer micro-USD thresholds.
 */
export function evaluateZumiSpendGuard(input: ZumiSpendGuardInput): ZumiSpendGuardDecision {
  const spent = requireNonNegativeInteger(input.spentMicroUsd, "spentMicroUsd");
  const next = requireNonNegativeInteger(input.estimatedNextCallMicroUsd, "estimatedNextCallMicroUsd");
  const warning = requireNonNegativeInteger(input.warningAtMicroUsd, "warningAtMicroUsd");
  const hard = requireNonNegativeInteger(input.hardLimitMicroUsd, "hardLimitMicroUsd");

  if (warning > hard) throw new Error("warningAtMicroUsd cannot exceed hardLimitMicroUsd.");
  if (hard === 0) throw new Error("hardLimitMicroUsd must be greater than zero.");

  const projectedMicroUsd = safeAdd(spent, next, "projectedMicroUsd");
  if (projectedMicroUsd > hard) {
    return {
      state: "block",
      projectedMicroUsd,
      // The blocked call has not consumed spend, so expose what remains before it.
      remainingMicroUsd: Math.max(0, hard - spent),
    };
  }

  return {
    state: projectedMicroUsd >= warning ? "warn" : "allow",
    projectedMicroUsd,
    remainingMicroUsd: hard - projectedMicroUsd,
  };
}

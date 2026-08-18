const LEGACY_SALES_LABELS: readonly [RegExp, string][] = [
  [/Private Workflow Demo & Cost Review/g, "Clinic Operating Analysis"],
  [/Private Workflow Review/g, "Clinic Operating Analysis"],
  [/Founding Clinic Evaluation/g, "Implementation Blueprint"],
  [/Founding Evaluation/g, "Implementation Blueprint"],
  [/Founding Clinic Program/g, "Founding Clinic Implementation"],
] as const;

/**
 * Display-only compatibility normalization for deterministic/historical sales copy.
 *
 * Persisted keys and historical records remain untouched. New customer-facing code
 * should use the canonical commercial catalog directly; this helper exists so older
 * deterministic narrative text cannot leak legacy product names while those internal
 * rules are gradually retired.
 */
export function canonicalizeSalesDisplayText(value: string) {
  return LEGACY_SALES_LABELS.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
}

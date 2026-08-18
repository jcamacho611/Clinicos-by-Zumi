const CANONICAL_SERVICE_RULES: Array<{ canonical: string; any: string[] }> = [
  { canonical: "Botox", any: ["botox"] },
  { canonical: "Juvederm and fillers", any: ["juvederm", "filler", "fillers", "dermal filler", "dermal fillers"] },
  { canonical: "Body contouring", any: ["body contour", "body contouring", "contour chic"] },
  { canonical: "Weight-loss services", any: ["weight loss", "weight-loss", "semaglutide", "tirzepatide", "glp-1", "glp1"] },
  { canonical: "Pre/post-operative care", any: ["pre/post-operative", "pre operative", "post operative", "post-op", "pre-op"] },
  { canonical: "Lymphatic drainage", any: ["lymphatic", "lymphatic drainage"] },
  { canonical: "IV hydration", any: ["iv hydration", "hydration iv", "iv therapy"] },
  { canonical: "Teeth whitening", any: ["teeth whitening", "tooth whitening", "whitening"] },
  { canonical: "Tooth gems", any: ["tooth gem", "tooth gems"] },
];

function normalized(value: string) {
  return value.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9+/-]+/g, " ").replace(/\s+/g, " ").trim();
}

export function canonicalizeLuxeServiceInterest(value?: string | null) {
  if (!value?.trim()) return null;
  const target = normalized(value);
  const exact = CANONICAL_SERVICE_RULES.find((rule) => normalized(rule.canonical) === target);
  if (exact) return exact.canonical;

  for (const rule of CANONICAL_SERVICE_RULES) {
    if (rule.any.some((alias) => target.includes(normalized(alias)))) return rule.canonical;
  }

  return value.trim();
}

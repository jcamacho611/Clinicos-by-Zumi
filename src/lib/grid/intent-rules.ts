export const gridIntentKinds = [
  "all",
  "work",
  "provider",
  "space",
  "product",
  "equipment",
  "service",
  "network",
  "education",
  "organization",
  "referral",
] as const;

export type GridIntentKind = (typeof gridIntentKinds)[number];
export type GridExchangeDirection = "need" | "offer";

const intentLabels: Record<GridIntentKind, string> = {
  all: "healthcare resource",
  work: "work opportunity",
  provider: "healthcare professional",
  space: "space or facility capacity",
  product: "product or supply",
  equipment: "equipment capacity",
  service: "business service",
  network: "network capacity",
  education: "education opportunity",
  organization: "organization capacity",
  referral: "referral capacity",
};

const commonWords = new Set([
  "a", "an", "and", "are", "available", "for", "find", "have", "i", "in", "is", "me", "my", "need", "of", "on", "or", "something", "the", "to", "want", "with",
]);

function contains(value: string, patterns: readonly string[]) {
  return patterns.some((pattern) => value.includes(pattern));
}

export function inferGridIntent(rawQuery: string, fallback: GridIntentKind = "all") {
  const query = rawQuery.trim().toLowerCase().replace(/\s+/g, " ");
  const offer = /\b(i have|i offer|i provide|i sell|rent my|list my|represent|looking for work|want work|available for work)\b/.test(query);
  const direction: GridExchangeDirection = offer ? "offer" : "need";
  let intent: GridIntentKind = fallback;

  if (contains(query, ["treatment room", "exam room", "procedure room", "therapy room", "dental chair", "med spa chair", "office space", "room", "chair rental", "facility space"])) intent = "space";
  else if (contains(query, ["billing", "biller", "coding", "credentialing", "consulting", "cybersecurity", "translation", "recruiting", "accounting", "marketing", "it service"])) intent = "service";
  else if (contains(query, ["preceptor", "placement", "internship", "training seat", "clinical hours", "education", "student rotation"])) intent = "education";
  else if (contains(query, ["equipment", "ultrasound", "diagnostic device", "simulation device", "treatment device"])) intent = "equipment";
  else if (contains(query, ["supplies", "supply", "product", "inventory", "consumable"])) intent = "product";
  else if (contains(query, ["referral", "consultation capacity", "specialist access"])) intent = "referral";
  else if (contains(query, ["hospital", "clinic", "health system", "imaging center", "laboratory", "lab capacity", "organization"])) intent = "organization";
  else if (contains(query, ["partner network", "network capacity", "partner organization"])) intent = "network";
  else if (contains(query, ["shift", "coverage", "per diem", "per-diem", "prn", "job", "contract work", "full-time", "part-time"]) || (direction === "offer" && contains(query, ["nurse", "rn", "provider", "clinician", "therapist", "assistant"]))) intent = "work";
  else if (contains(query, ["nurse", "rn", "lpn", "injector", "physician", "doctor", "therapist", "provider", "clinician", "medical assistant"])) intent = "provider";

  const locationBased = ["work", "provider", "space", "equipment", "organization", "referral"].includes(intent);
  const hasLocationLanguage = /\b(in|near|around|within)\s+[a-z0-9]/.test(query) || /\b(remote|mobile|onsite|on-site|hybrid)\b/.test(query);
  const followUp = query.length >= 3 && locationBased && !hasLocationLanguage
    ? direction === "offer" && intent === "space"
      ? "What city is the space in?"
      : "What city should Grid search?"
    : null;

  return {
    direction,
    intent,
    label: intentLabels[intent],
    followUp,
    searchTerms: query.split(/[^a-z0-9]+/).filter((term) => term.length >= 2 && !commonWords.has(term)).slice(0, 12),
  };
}

export function gridOfferEnrollmentHref(intent: GridIntentKind) {
  if (["work", "provider"].includes(intent)) return "/grid/join";
  if (intent === "space") return "/grid/join/location";
  if (intent === "organization" || intent === "network") return "/grid/join/location?type=organization";
  if (["product", "equipment", "service", "education", "referral"].includes(intent)) return `/grid/join/seller?type=${intent}`;
  return "/grid/join";
}

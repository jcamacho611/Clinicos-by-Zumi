export type GridMatchInput = {
  provider: {
    id: string;
    verificationStatus: string;
    malpracticeVerificationStatus: string;
    travelRadiusMiles: number;
    onCallNow: boolean;
    servicesOffered: string[];
    serviceLocations: string[];
  };
  service: {
    id: string;
    serviceName: string;
    category: string;
    priceLowCents: number;
    priceHighCents: number;
    requiresMedicalReview: boolean;
  };
  availability: {
    weekday: number;
    startsAt: string;
    endsAt: string;
    locationType: string;
    status: string;
  }[];
};

export type GridDemandInput = {
  category: string;
  serviceName?: string | null;
  requestedStartAt: Date;
  requestedEndAt?: Date | null;
  locationType?: string | null;
  maxPriceCents?: number | null;
  requiresClinicalEligibility?: boolean;
};

export type GridMatchResult = {
  providerId: string;
  serviceId: string;
  eligible: boolean;
  score: number;
  reasons: string[];
};

function hhmm(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function evaluateGridMatch(candidate: GridMatchInput, demand: GridDemandInput): GridMatchResult {
  const reasons: string[] = [];
  const weekday = demand.requestedStartAt.getDay();
  const start = hhmm(demand.requestedStartAt);
  const end = demand.requestedEndAt ? hhmm(demand.requestedEndAt) : start;

  if (candidate.provider.verificationStatus !== "verified") reasons.push("Provider profile is not verified.");
  if (demand.requiresClinicalEligibility && candidate.provider.malpracticeVerificationStatus !== "verified") reasons.push("Required malpractice review is not verified.");

  const categoryMatch = candidate.service.category.toLowerCase() === demand.category.toLowerCase();
  const serviceNameMatch = !demand.serviceName || candidate.service.serviceName.toLowerCase().includes(demand.serviceName.toLowerCase());
  if (!categoryMatch && !serviceNameMatch) reasons.push("Service does not match the requested category.");

  const available = candidate.availability.some((slot) => {
    if (slot.status !== "active" || slot.weekday !== weekday) return false;
    if (demand.locationType && slot.locationType !== demand.locationType) return false;
    return slot.startsAt <= start && slot.endsAt >= end;
  });
  if (!available) reasons.push("Provider is not available for the requested window.");

  if (demand.maxPriceCents != null && candidate.service.priceLowCents > demand.maxPriceCents) reasons.push("Minimum listed price exceeds the requested budget.");

  const eligible = reasons.length === 0;
  let score = 0;
  if (eligible) {
    score += 40;
    if (categoryMatch) score += 20;
    if (serviceNameMatch) score += 10;
    if (candidate.provider.onCallNow) score += 10;
    if (available) score += 20;
  }

  return { providerId: candidate.provider.id, serviceId: candidate.service.id, eligible, score, reasons };
}

export function rankGridMatches(candidates: GridMatchInput[], demand: GridDemandInput) {
  return candidates
    .map((candidate) => evaluateGridMatch(candidate, demand))
    .filter((result) => result.eligible)
    .sort((a, b) => b.score - a.score || a.providerId.localeCompare(b.providerId));
}

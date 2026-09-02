import {
  findKlinikosPathFromIntent,
  klinikosPathCatalog,
  type KlinikosPathAvailability,
  type KlinikosPathDefinition,
} from "@/lib/paths/catalog";

/**
 * The action-first public surface.
 *
 * A visitor does not arrive wanting Grid, EDU or an EHR. They arrive with a sentence:
 * "I need work", "I have two rooms open Friday", "Why hasn't this claim paid?". This
 * module is the seam between how a person says it and the governed Path underneath.
 *
 * Everything a visitor sees here comes from `klinikosPathCatalog`, which is the server's
 * authority on what journeys exist and what state each is really in. The projection below
 * is deliberately narrow: it renames availability for a reader, and it never upgrades it.
 * A path that requires verification is shown as requiring verification on the public page,
 * because the alternative is a landing page that quietly promises eligibility it cannot
 * grant.
 */

export type PublicLivingUniverseAction = {
  id: string;
  /** What the person says, in their words. Never a module name. */
  label: string;
  /** Who tends to say it — used to group the surface, not to create role accounts. */
  side: "need" | "have";
  pathId: string;
};

export const PUBLIC_LIVING_UNIVERSE_ACTIONS: readonly PublicLivingUniverseAction[] = [
  { id: "work", label: "I need work", side: "need", pathId: "find-extra-work" },
  { id: "cover", label: "I need someone tomorrow", side: "need", pathId: "fill-staffing-need" },
  { id: "placement", label: "I need a clinical placement", side: "need", pathId: "student-clinical-placement" },
  { id: "care", label: "I need care", side: "need", pathId: "patient-find-care" },
  { id: "paid", label: "Why hasn't this been paid?", side: "need", pathId: "clinic-improve-revenue" },
  { id: "followup", label: "I need to close open loops", side: "need", pathId: "fix-referral-leakage" },
  { id: "rooms", label: "I have rooms open Friday", side: "have", pathId: "clinic-monetize-capacity" },
  { id: "resource", label: "I need healthcare space or equipment", side: "need", pathId: "find-healthcare-resource" },
  { id: "students", label: "I can take students", side: "have", pathId: "organization-education-partner" },
  { id: "precept", label: "I want to precept", side: "have", pathId: "educator-preceptor-opportunity" },
  { id: "ownpractice", label: "I want to work for myself", side: "have", pathId: "clinician-independent-practice" },
  { id: "runclinic", label: "Help me run my practice", side: "have", pathId: "clinic-operational-optimization" },
  { id: "aesthetics", label: "I want to build an injector career", side: "have", pathId: "become-grid-ready" },
  { id: "procurement", label: "I need to prepare an RFP response", side: "need", pathId: "prepare-procurement-response" },
] as const;

/** Reader-facing wording for each catalog state. Renames only — never promotes. */
const AVAILABILITY_COPY: Record<KlinikosPathAvailability, string> = {
  available_now: "You can start this now",
  requires_setup: "Needs setup first",
  requires_verification: "Needs verification first",
  requires_organization_connection: "Needs an organization to agree",
  defined: "Mapped out, not yet open",
};

export type PublicLivingUniverseStep = {
  label: string;
  description: string;
  state: "complete" | "current" | "upcoming" | "blocked";
};

export type PublicLivingUniverseProjection = {
  id: string;
  label: string;
  side: "need" | "have";
  pathId: string;
  title: string;
  summary: string;
  from: string;
  to: string;
  availability: KlinikosPathAvailability;
  availabilityCopy: string;
  governance: string;
  commercialBoundary: string | null;
  continuationHref: `/member?path=${string}`;
  steps: PublicLivingUniverseStep[];
};

export function continuationHrefForPathId(pathId: string) {
  const path = klinikosPathCatalog.find((candidate) => candidate.id === pathId);
  if (!path) return null;
  // Account creation always returns through the person-owned Living Home first. That
  // single boundary restores the catalog Path, explains what is and is not authoritative,
  // and only then offers the first real engine route. Grid and EDU therefore do not need
  // parallel query-string interpreters, and private patient intent never becomes a public
  // marketplace request by accident.
  return `/member?path=${encodeURIComponent(path.id)}` as PublicLivingUniverseProjection["continuationHref"];
}

/**
 * Server-side. Builds the minimum a public visitor needs to understand the journey and
 * where it really stands. Node `href`s and `capabilityKey`s are deliberately dropped:
 * they describe internal routing, and a logged-out visitor cannot follow them anyway.
 */
/** Shared projection for one Path. Everything public sees goes through here. */
function projectPath(
  path: KlinikosPathDefinition,
  action: { id: string; label: string; side: "need" | "have" },
): PublicLivingUniverseProjection {
  const continuationHref = continuationHrefForPathId(path.id);
  if (!continuationHref) throw new Error(`Unknown public Path continuation: ${path.id}`);

  return {
    id: action.id,
    label: action.label,
    side: action.side,
    pathId: path.id,
    title: path.title,
    summary: path.summary,
    from: path.from,
    to: path.to,
    availability: path.availability,
    availabilityCopy: AVAILABILITY_COPY[path.availability],
    governance: path.governance,
    commercialBoundary: path.commercialBoundary ?? null,
    continuationHref,
    steps: path.nodes.map((node) => ({
      label: node.label,
      description: node.description,
      state: node.state,
    })),
  };
}

/**
 * Which Path each public destination stands for.
 *
 * The deterministic intent engine only recognises a narrow set of phrasings, so the raw
 * prompt is too weak to drive the stage — "I need work" resolves to nothing. The
 * resolution's destination key is reliable, and this maps it to the journey behind it.
 *
 * Written out rather than derived: several Paths can share a destination, and which one
 * a visitor is shown is a product decision that should be reviewable here, not the
 * incidental result of catalog ordering.
 */
const DESTINATION_PATHS: Record<string, string> = {
  grid: "find-healthcare-resource",
  staffing: "fill-staffing-need",
  clinic: "clinic-operational-optimization",
  revenue: "clinic-improve-revenue",
  billing: "clinic-improve-revenue",
  referrals: "fix-referral-leakage",
  patient: "patient-find-care",
  insights: "clinic-operational-optimization",
  priorities: "clinic-operational-optimization",
  care: "clinic-operational-optimization",
  procurement: "prepare-procurement-response",
};

const OFFERED_CAPACITY = /\b(?:i|we)\s+(?:have|offer|provide|own|can\s+provide|am\s+available|are\s+available)\b|\b(?:list|rent\s+out)\s+(?:my|our|a|an)\b/i;
const SPACE_OR_CAPACITY = /\b(?:room|chair|space|facility|equipment|device|capacity)\b/i;
const GENERIC_WORK_NEED = /\b(?:i\s+(?:need|want)|looking\s+for|find(?:\s+me)?)\s+(?:extra\s+|healthcare\s+)?work\b|\bwork\s+opportunit(?:y|ies)\b/i;

/**
 * The seam that makes Zumi and the Path stage one interaction rather than two.
 *
 * A person says what they need; the same turn that produces the reply selects the Path,
 * and the stage recomposes around it. Without this the visitor talks to Zumi and then
 * scrolls to a separate application, which is the module-first shape in disguise.
 *
 * Server-side: the catalog and the intent engine never reach the browser, and what comes
 * back is the same minimum-necessary projection the front-door stage already uses.
 */
export function projectPublicLivingUniverseForIntent(
  prompt: string,
  destinationKey?: string | null,
): PublicLivingUniverseProjection | null {
  const byId = new Map(klinikosPathCatalog.map((path) => [path.id, path]));

  const inferredPath = findKlinikosPathFromIntent(prompt);
  const mappedId = destinationKey === "grid" && OFFERED_CAPACITY.test(prompt) && SPACE_OR_CAPACITY.test(prompt)
    ? "clinic-monetize-capacity"
    : destinationKey === "grid" && GENERIC_WORK_NEED.test(prompt)
      ? "find-extra-work"
      : destinationKey
        ? DESTINATION_PATHS[destinationKey]
        : undefined;
  // Offered capacity must stay on the supply side. Otherwise prefer the exact Path the
  // deterministic intent engine found over a broad destination family. `edu` has no
  // generic default: "I want to learn" is not enough evidence to invent a clinical
  // placement or an injector journey.
  const offeredCapacity = mappedId === "clinic-monetize-capacity";
  const exactProtectedDestination = destinationKey === "procurement";
  const path = (offeredCapacity || exactProtectedDestination) && mappedId
    ? byId.get(mappedId)
    : inferredPath ?? (mappedId ? byId.get(mappedId) : undefined);
  if (!path) return null;

  // Prefer the everyday label the front door already offers for this Path, so the stage
  // headline reads in the person's language rather than the catalog's.
  const known = PUBLIC_LIVING_UNIVERSE_ACTIONS.find((action) => action.pathId === path.id);
  return projectPath(path, {
    id: known?.id ?? path.id,
    label: known?.label ?? path.title,
    side: known?.side ?? "need",
  });
}

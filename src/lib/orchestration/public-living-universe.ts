import { klinikosPathCatalog, type KlinikosPathAvailability } from "@/lib/paths/catalog";

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
  { id: "students", label: "I can take students", side: "have", pathId: "organization-education-partner" },
  { id: "precept", label: "I want to precept", side: "have", pathId: "educator-preceptor-opportunity" },
  { id: "ownpractice", label: "I want to work for myself", side: "have", pathId: "clinician-independent-practice" },
  { id: "runclinic", label: "Help me run my practice", side: "have", pathId: "clinic-operational-optimization" },
  { id: "aesthetics", label: "I want to build an injector career", side: "have", pathId: "become-grid-ready" },
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
  steps: PublicLivingUniverseStep[];
};

/**
 * Server-side. Builds the minimum a public visitor needs to understand the journey and
 * where it really stands. Node `href`s and `capabilityKey`s are deliberately dropped:
 * they describe internal routing, and a logged-out visitor cannot follow them anyway.
 */
export function projectPublicLivingUniverse(): PublicLivingUniverseProjection[] {
  const byId = new Map(klinikosPathCatalog.map((path) => [path.id, path]));

  return PUBLIC_LIVING_UNIVERSE_ACTIONS.flatMap((action) => {
    const path = byId.get(action.pathId);
    if (!path) return [];

    return [{
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
      steps: path.nodes.map((node) => ({
        label: node.label,
        description: node.description,
        state: node.state,
      })),
    }];
  });
}

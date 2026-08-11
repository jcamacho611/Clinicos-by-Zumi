/**
 * Klinikos plan pricing.
 *
 * Server-defined and never accepted from a client, for the same reason the access
 * product catalog is: a price a buyer can name is a price a buyer will name.
 *
 * The entry plan carries a real number rather than "contact sales". A small clinic
 * asked to book a call to learn a price usually just leaves, and the whole point of
 * this layer is to let a clinic buy without a conversation.
 *
 * Pure module. No database, no network.
 */

export const planKeys = ["klinikos", "klinikos_multi", "klinikos_enterprise"] as const;
export type PlanKey = (typeof planKeys)[number];

export type Plan = {
  key: PlanKey;
  name: string;
  tagline: string;
  /** Monthly price in integer cents. Null means the price is genuinely bespoke. */
  monthlyCents: number | null;
  priceNote: string;
  includes: readonly string[];
  /** Stated on the card. A plan that only lists what you get is a plan that misleads. */
  doesNotInclude: readonly string[];
  cta: { label: string; href: string };
  emphasis: boolean;
};

/** Capabilities every plan includes. Listed once so the cards cannot drift apart. */
const CORE_INCLUDES = [
  "Operations dashboard and operating map",
  "Scheduling and appointment workflow",
  "Patient intake and digital forms",
  "Task assignment and staff accountability",
  "Follow-up and escalation queues",
  "CRM, leads, and pipelines",
  "Referral and results tracking",
  "Billing-readiness workflow",
  "Revenue-opportunity tracking",
  "Document management",
  "Reporting",
  "Zumi AI, according to plan limits",
] as const;

/**
 * What no plan includes.
 *
 * Repeated on every card deliberately. These are the assumptions a healthcare buyer
 * makes by default, and letting them stand unchallenged until the contract is how a
 * sale becomes a dispute.
 */
const UNIVERSAL_EXCLUSIONS = [
  // Each bullet states its own denial rather than relying on the heading above it.
  // A list item can be quoted, screenshotted, or read aloud on its own, and a
  // certification named without its heading reads as a feature rather than a limit.
  "Klinikos is not a certified EHR and carries no regulatory certification",
  "No live laboratory, imaging, or e-prescribing connection is included",
  "No clearinghouse enrolment or payer credentialing is included",
  "No clinical judgement, guarantee, or outcome is provided",
] as const;

export const plans: readonly Plan[] = [
  {
    key: "klinikos",
    name: "Klinikos",
    tagline: "One clinic, running on one system.",
    monthlyCents: 89_900,
    priceNote: "per clinic, per month",
    includes: CORE_INCLUDES,
    doesNotInclude: UNIVERSAL_EXCLUSIONS,
    cta: { label: "Get started", href: "/operational-audit" },
    emphasis: true,
  },
  {
    key: "klinikos_multi",
    name: "Klinikos Multi-Site",
    tagline: "Several locations, one operating picture.",
    monthlyCents: 179_900,
    priceNote: "per month, up to five locations",
    includes: [...CORE_INCLUDES, "Cross-location operating map", "Location and provider capacity", "GRID provider network access"],
    doesNotInclude: UNIVERSAL_EXCLUSIONS,
    cta: { label: "Get started", href: "/operational-audit" },
    emphasis: false,
  },
  {
    key: "klinikos_enterprise",
    name: "Klinikos Implementation",
    tagline: "Migration from an existing EHR, or a group that needs a plan.",
    monthlyCents: null,
    priceNote: "scoped per engagement",
    includes: [...CORE_INCLUDES, "Data migration from your current systems", "Workflow configuration and role mapping", "Staff training", "Named implementation contact"],
    doesNotInclude: UNIVERSAL_EXCLUSIONS,
    cta: { label: "Talk to Klinikos", href: "/contact" },
    emphasis: false,
  },
];

export function getPlan(key: string) {
  return plans.find((plan) => plan.key === key);
}

export function formatPlanPrice(plan: Plan) {
  if (plan.monthlyCents === null) return "Scoped";
  return `$${(plan.monthlyCents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

/**
 * What every plan page must say about what a subscription does not do.
 *
 * Kept beside the prices rather than in a footer, because the moment a buyer is
 * deciding is the moment the boundary matters.
 */
export const PRICING_BOUNDARY_NOTICE =
  "A Klinikos subscription provides clinic operations software. It does not provide certification, regulatory approval, live healthcare network connectivity, or clinical judgement. Connections to laboratories, imaging, payers, and pharmacy networks require your clinic's own agreements and enrolments, and Klinikos reports the real status of each.";

export const AUDIT_FIRST_NOTICE =
  "Most clinics start with an Operational Audit. It is a paid review of where your clinic is losing time and revenue today, and what it would take to change that — useful whether or not you go on to run Klinikos.";

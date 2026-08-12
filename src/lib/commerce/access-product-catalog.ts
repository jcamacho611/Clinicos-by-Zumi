/**
 * Server-controlled marketplace product catalog.
 *
 * Price, role target, and what a purchase does (and does not) buy are defined here
 * and never accepted from the client. A request may name a product key; everything
 * else about the order is resolved server-side, matching how the sales engine
 * already handles its $500 / $1,500 / $8,000 offers.
 *
 * These are one-time review and onboarding fees. None of them grants clinical
 * authority, credential verification, placement, or a booking.
 */

import type { PlanKey } from "@/lib/growth/pricing";

export const marketplaceRoleTargets = ["clinic", "contractor", "location_owner", "seller", "advisory"] as const;

export type MarketplaceRoleTarget = (typeof marketplaceRoleTargets)[number];

export const accessProductKeys = [
  "clinic_workflow_review",
  "founding_clinic_seat",
  "contractor_application_review",
  "room_listing_review",
  "seller_listing_review",
  "ai_consulting_call",
] as const;

export type AccessProductKey = (typeof accessProductKeys)[number];

export type AccessProduct = {
  key: AccessProductKey;
  name: string;
  /** Authoritative price. Never read from the request body. */
  amountCents: number;
  currency: "USD";
  roleTarget: MarketplaceRoleTarget;
  /** Portal the buyer lands in once payment is verified and review completes. */
  portalPath: string;
  summary: string;
  includes: readonly string[];
  /** Stated plainly on every surface so a purchase cannot be read as a promise. */
  doesNotInclude: readonly string[];
  /**
   * Whether verified payment alone opens the portal, or a human review gate still
   * stands between payment and access.
   */
  requiresHumanReview: boolean;
  /**
   * Optional software plan that must actually be provisioned before this product may
   * report portal access as granted. Review/application products intentionally leave
   * this null: approving a credential/application review does not create a clinic
   * software subscription.
   */
  provisionPlanKey: PlanKey | null;
};

export const accessProductCatalog: readonly AccessProduct[] = [
  {
    key: "clinic_workflow_review",
    name: "Klinikos Private Workflow Review",
    amountCents: 75_000,
    currency: "USD",
    roleTarget: "clinic",
    portalPath: "/clinic",
    summary: "One-time 1:1 workflow and cost analysis, plus consideration for the Founding Clinic program.",
    includes: ["Scheduled workflow review session", "Written cost and workflow findings", "Founding Clinic program consideration"],
    doesNotInclude: ["Ongoing software subscription", "A guaranteed Founding Clinic seat", "Any production or clinical deployment"],
    requiresHumanReview: true,
    provisionPlanKey: null,
  },
  {
    key: "founding_clinic_seat",
    name: "Founding Clinic Seat",
    amountCents: 800_000,
    currency: "USD",
    roleTarget: "clinic",
    portalPath: "/clinic",
    summary: "Early-access implementation package with priority onboarding and training.",
    includes: ["Priority implementation scheduling", "Onboarding and staff training", "Direct implementation contact"],
    doesNotInclude: ["Automatic qualification", "A certified or HIPAA-compliant production system", "Any clinical or billing guarantee"],
    requiresHumanReview: true,
    provisionPlanKey: "klinikos",
  },
  {
    key: "contractor_application_review",
    name: "Independent Contractor Application Review",
    amountCents: 19_900,
    currency: "USD",
    roleTarget: "contractor",
    portalPath: "/contractor",
    summary: "Submission of an independent nurse or injector profile for marketplace entry review.",
    includes: ["Human review of your submitted profile", "Credential and malpractice evidence intake", "A recorded review decision"],
    doesNotInclude: ["Approval of your credentials", "Placement, bookings, or guaranteed work", "Any earnings guarantee"],
    requiresHumanReview: true,
    provisionPlanKey: null,
  },
  {
    key: "room_listing_review",
    name: "Room / Chair Listing Review",
    amountCents: 29_900,
    currency: "USD",
    roleTarget: "location_owner",
    portalPath: "/location-owner",
    summary: "Review of a treatment room or chair listing for the GRID marketplace.",
    includes: ["Human review of your listing", "Facility and allowed-service intake", "A recorded review decision"],
    doesNotInclude: ["Automatic listing publication", "Bookings or occupancy guarantees", "Verification of your facility authority or insurance"],
    requiresHumanReview: true,
    provisionPlanKey: null,
  },
  {
    key: "seller_listing_review",
    name: "Seller Product / Service Listing Review",
    amountCents: 29_900,
    currency: "USD",
    roleTarget: "seller",
    portalPath: "/seller",
    summary: "Review of a med-spa product or service listing for the marketplace.",
    includes: ["Human review of your listing", "Product and service intake", "A recorded review decision"],
    doesNotInclude: ["Automatic listing publication", "Distribution, fulfilment, or sales guarantees", "Any regulatory clearance for the listed item"],
    requiresHumanReview: true,
    provisionPlanKey: null,
  },
  {
    key: "ai_consulting_call",
    name: "AI & Automation Consulting Call",
    amountCents: 50_000,
    currency: "USD",
    roleTarget: "advisory",
    portalPath: "/portal",
    summary: "A 60-minute consulting session on automation and AI for your clinic.",
    includes: ["60-minute scheduled session", "Written follow-up summary"],
    doesNotInclude: ["Software access or a portal seat", "Implementation work", "Any clinical or compliance advice"],
    requiresHumanReview: false,
    provisionPlanKey: null,
  },
];

export function getAccessProduct(key: string): AccessProduct | undefined {
  return accessProductCatalog.find((product) => product.key === key);
}

/**
 * Environment variable holding the Whop checkout link (or product id) for a product.
 * Derived from the key so adding a catalog entry cannot silently miss its mapping.
 */
export function productEnvVar(key: AccessProductKey) {
  return `WHOP_PRODUCTS_${key.toUpperCase()}`;
}

export function checkoutLinkForProduct(product: AccessProduct, env: Record<string, string | undefined>) {
  return env[productEnvVar(product.key)]?.trim() || null;
}

/** Catalog view annotated with what is actually orderable in this deployment. */
export function accessProductCatalogView(env: Record<string, string | undefined>) {
  return accessProductCatalog.map((product) => ({
    key: product.key,
    name: product.name,
    amountCents: product.amountCents,
    currency: product.currency,
    roleTarget: product.roleTarget,
    portalPath: product.portalPath,
    summary: product.summary,
    includes: [...product.includes],
    doesNotInclude: [...product.doesNotInclude],
    requiresHumanReview: product.requiresHumanReview,
    purchasable: Boolean(checkoutLinkForProduct(product, env)),
  }));
}

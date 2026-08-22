import type { Metadata } from "next";
import { LandingFunnel, type FunnelAudience, type FunnelPriceGroup } from "@/components/marketing/landing-funnel";
import {
  clinicCommercialOffers,
  clinicPlans,
  eduCommercialRule,
  eduPlans,
  gridCommercialRule,
  klinikosCommercialContact,
  serviceCommercialRule,
  serviceEngagements,
} from "@/lib/commercial/klinikos-commercial";
import { GRID_MEMBERSHIP } from "@/lib/commercial/grid-economics";

export const metadata: Metadata = {
  title: "Klinikos — your clinic isn't missing software, it's missing continuity",
  description:
    "Klinikos keeps the thread across follow-up, referrals, results, staffing and revenue — and connects clinics, careers and capacity through one governed ecosystem.",
};

const audiences: FunnelAudience[] = [
  {
    key: "owner",
    label: "I run a clinic",
    title: "Today's priorities, then the money",
    body: "Open loops with no owner, coverage gaps for the week, and the visits that are closed but not claim-ready.",
    surfaces: [
      "Follow-ups and referrals with no recorded owner",
      "Coverage gaps you can post to Grid",
      "Rooms and hours sitting idle",
      "Claim readiness by visit",
    ],
    next: "Most owners start with a Clinic Operating Analysis, then a first connected workflow before touching anything else.",
  },
  {
    key: "desk",
    label: "I run the front desk",
    title: "Arrivals, intake, callbacks",
    body: "Who arrives today without completed intake, who needs a callback, and what payment questions need a human.",
    surfaces: [
      "Arrivals missing intake or consent",
      "Unconfirmed visits after two reminders",
      "No-show recovery list",
      "Balance questions needing a person",
    ],
    next: "Front desk work is included in Klinikos Core — no separate licence, no separate login.",
  },
  {
    key: "provider",
    label: "I see patients",
    title: "Your panel, your signatures",
    body: "Results awaiting review, notes awaiting signature, referral loops with no acknowledgment on file.",
    surfaces: [
      "Results outside reference range, unreleased",
      "Notes complete and coded, awaiting signature",
      "Referrals with no acknowledgment",
      "Follow-up your panel is waiting on",
    ],
    next: "Clinical decisions stay with you. Klinikos only shows what is waiting and who owns the next step.",
  },
  {
    key: "grid",
    label: "I work shifts or contract",
    title: "Eligibility first, then offers",
    body: "What you're eligible for today, where it is, and what's missing from your file before an offer can reach you.",
    surfaces: [
      "Offers you're eligible for",
      "Credentials and coverage on file",
      "Availability you've published",
      "Distance and terms before rate",
    ],
    next: `Grid is free for individuals. ${GRID_MEMBERSHIP.individualPro.name} at ${GRID_MEMBERSHIP.individualPro.priceLabel} adds priority matching and saved availability.`,
  },
  {
    key: "space",
    label: "I have space or capacity",
    title: "Idle capacity is an asset",
    body: "Rooms, chairs, provider hours, equipment and placement slots that currently earn nothing.",
    surfaces: [
      "Rooms idle on your closed days",
      "Unfilled provider hours",
      "Equipment available midweek",
      "Placement slots you could host",
    ],
    next: `Listing and searching are free. Publishing capacity as an organization starts at ${GRID_MEMBERSHIP.organizationPro.priceLabel}.`,
  },
  {
    key: "student",
    label: "I'm learning or newly licensed",
    title: "Where you are, and what's next",
    body: "Requirements mapped to real hours, simulation before patients, and competency recorded on release.",
    surfaces: [
      "Program requirements and progress",
      "Simulation: intake, scheduling, documentation",
      "Sites with preceptor capacity",
      "What opens once evidence is on file",
    ],
    next: `Klinikos EDU is free to start. Pathways run ${eduPlans.pathway.priceLabel} and are only worth it once a route depends on them.`,
  },
];

/**
 * Every price on this page is read from `klinikos-commercial`, never typed into the
 * markup. A marketing surface that carries its own numbers is a second source of
 * truth, and the two drift the first time one of them changes.
 */
const priceGroups: FunnelPriceGroup[] = [
  {
    key: "clinic",
    label: "Clinic OS",
    note: "Per location, monthly, billed to the practice. Implementation is scoped separately. Cancellation is self-service and records stay exportable.",
    tiers: [
      {
        tag: clinicCommercialOffers.privateWorkflowReview.name,
        price: clinicCommercialOffers.privateWorkflowReview.priceLabel,
        unit: "one-time",
        body: "See your own fragmentation before you commit to software.",
        includes: ["Operating analysis and cost review", "Named gaps with owners", "Credited toward implementation"],
        excludes: ["No queue ownership yet"],
      },
      ...Object.values(clinicPlans).map((plan) => ({
        tag: plan.name,
        price: plan.monthlyPriceLabel,
        unit: plan.monthlyPriceCents === null ? "scoped commercial terms" : "per location / month",
        body: plan.idealFor,
        includes: plan.includes,
        excludes: [],
        primary: plan.key === clinicPlans.growth.key,
      })),
    ],
  },
  {
    key: "grid",
    label: "Grid",
    note: gridCommercialRule,
    tiers: Object.values(GRID_MEMBERSHIP).map((plan) => ({
      tag: plan.name,
      price: plan.priceLabel,
      unit: plan.audience,
      body: plan.audience,
      includes: plan.includes,
      // The canonical tiers describe what is included and stop there. An "excludes" list
      // reads as a list of things being withheld, which is the wrong note for a
      // marketplace still trying to attract its first participants.
      excludes: [] as readonly string[],
      primary: plan.key === GRID_MEMBERSHIP.organizationPro.key,
    })),
  },
  {
    key: "edu",
    label: "Klinikos EDU",
    note: eduCommercialRule,
    tiers: Object.values(eduPlans).map((plan) => ({
      tag: plan.name,
      price: plan.priceLabel,
      unit: plan.unitLabel,
      body: plan.idealFor,
      includes: plan.includes,
      excludes: plan.excludes,
      primary: plan.key === eduPlans.pathway.key,
    })),
  },
  {
    key: "services",
    label: "Services",
    note: serviceCommercialRule,
    tiers: [
      {
        tag: clinicCommercialOffers.privateWorkflowReview.name,
        price: clinicCommercialOffers.privateWorkflowReview.priceLabel,
        unit: "one-time",
        body: "A fast read on where continuity breaks.",
        includes: ["Operating analysis", "Named gaps and owners", "Credited toward implementation"],
        excludes: [],
        primary: true,
      },
      {
        tag: clinicCommercialOffers.foundingEvaluation.name,
        price: clinicCommercialOffers.foundingEvaluation.priceLabel,
        unit: "one-time",
        body: "The plan a clinic can actually implement against.",
        includes: ["Workflow and revenue review", "Prioritized findings", "Implementation plan"],
        excludes: [],
      },
      {
        tag: serviceEngagements.audit.name,
        price: serviceEngagements.audit.priceLabel,
        unit: serviceEngagements.audit.unitLabel,
        body: serviceEngagements.audit.idealFor,
        includes: serviceEngagements.audit.includes,
        excludes: [],
      },
      {
        tag: clinicCommercialOffers.foundingImplementation.name,
        price: clinicCommercialOffers.foundingImplementation.priceLabel,
        unit: "per practice",
        body: "Configured, staffed and adopted — not just switched on.",
        includes: ["Workflow build and migration", "Staff training and adoption", "Named implementation lead"],
        excludes: [],
      },
      {
        tag: serviceEngagements.retainer.name,
        price: serviceEngagements.retainer.priceLabel,
        unit: serviceEngagements.retainer.unitLabel,
        body: serviceEngagements.retainer.idealFor,
        includes: serviceEngagements.retainer.includes,
        excludes: [],
      },
    ],
  },
];

export default function KlinikosLandingFunnelPage() {
  return (
    <LandingFunnel
      analysisCredit={clinicCommercialOffers.privateWorkflowReview.creditForward}
      analysisPriceLabel={clinicCommercialOffers.privateWorkflowReview.priceLabel}
      audiences={audiences}
      contactEmail={klinikosCommercialContact.email}
      priceGroups={priceGroups}
    />
  );
}

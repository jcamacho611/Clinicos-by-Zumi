/** Public presentation copy only. Switching a lens never changes identity or authority. */
export type PublicLivingPlaneId =
  | "healthcare_universe"
  | "economic_resource"
  | "lifecycle"
  | "operating_infrastructure"
  | "compounding_business";

export type PublicLivingPlaneLens = {
  id: PublicLivingPlaneId;
  number: string;
  title: string;
  shortTitle: string;
  description: string;
  question: string;
};

export const PUBLIC_LIVING_PLANE_LENSES: readonly PublicLivingPlaneLens[] = [
  {
    id: "healthcare_universe",
    number: "01",
    title: "Healthcare Universe",
    shortTitle: "People & organizations",
    description: "The people, practices, schools, partners, patients, professionals, and institutions involved.",
    question: "Who is involved?",
  },
  {
    id: "economic_resource",
    number: "02",
    title: "Economic & Resource",
    shortTitle: "Needs & capacity",
    description: "Work, care, rooms, equipment, services, placements, and other capacity that can be needed or offered.",
    question: "What is needed or available?",
  },
  {
    id: "lifecycle",
    number: "03",
    title: "Lifecycle",
    shortTitle: "Before, now & next",
    description: "The governed sequence from intent and evidence through eligibility, action, fulfillment, and outcome.",
    question: "Where are we in the journey?",
  },
  {
    id: "operating_infrastructure",
    number: "04",
    title: "Operating Infrastructure",
    shortTitle: "Systems & safeguards",
    description: "Identity, Grid, EDU, Clinic OS, Financial OS, Zumi, evidence, integrations, privacy, and audit.",
    question: "What must coordinate it safely?",
  },
  {
    id: "compounding_business",
    number: "05",
    title: "Compounding Business",
    shortTitle: "Value & continuity",
    description: "How useful work becomes measurable value, revenue, retention, network strength, and better future outcomes.",
    question: "How does value continue?",
  },
] as const;

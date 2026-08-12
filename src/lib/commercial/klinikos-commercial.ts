export const KLINIKOS_GODADDY_PAYLINK = "https://f7b959c2-9748-4f7e-9247-7bea69624c5f.paylinks.godaddy.com/";

export const klinikosCommercialContact = {
  email: process.env.KLINIKOS_SALES_EMAIL ?? process.env.KLINIKOS_CONTACT_EMAIL ?? "",
};

export const clinicCommercialOffers = {
  privateWorkflowReview: {
    key: "private_workflow_demo",
    name: "Private Workflow Review",
    priceCents: 50_000,
    priceLabel: "$500",
    billing: "one_time",
    creditForward: "Credited toward the Founding Clinic Evaluation when the clinic proceeds.",
  },
  foundingEvaluation: {
    key: "founding_clinic_evaluation",
    name: "Founding Clinic Evaluation",
    priceCents: 150_000,
    priceLabel: "$1,500",
    billing: "one_time",
    creditForward: "Credited toward the Founding Clinic Program when the clinic proceeds.",
  },
  foundingImplementation: {
    key: "founding_clinic_program",
    name: "Founding Clinic Implementation",
    priceCents: 800_000,
    priceLabel: "$8,000",
    billing: "one_time",
    creditForward: "Prior eligible review and evaluation fees are credited after human review.",
  },
} as const;

export const clinicSubscriptionPlanning = {
  status: "planning" as const,
  note: "Ongoing software access is priced separately from evaluation and implementation. Final subscription terms depend on approved clinic scope, modules, locations, usage, and connected services.",
};

export const gridCommercialModel = {
  professional: {
    label: "Grid Professional",
    pricing: "Profile access can be offered separately from transaction fees. Regulated work remains gated by verification.",
  },
  facility: {
    label: "Grid Facility",
    pricing: "Space and capacity hosts can be monetized through listing access, booking fees, or transaction fees according to the resource class.",
  },
  seller: {
    label: "Grid Seller",
    pricing: "Products, equipment, services, education, and partner capacity can use class-specific listing, transaction, or fulfillment fees.",
  },
  platform: {
    label: "Klinikos fee",
    pricing: "Platform fees are server-owned and transaction-specific. Do not hardcode one universal percentage.",
  },
} as const;

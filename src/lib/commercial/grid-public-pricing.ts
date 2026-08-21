import { gridPlans } from "@/lib/commercial/klinikos-commercial";

const transactionDisclosure =
  "If an approved resource-class fee applies, Grid shows it before acceptance. No universal transaction percentage is promised.";

export const gridPublicPricingPolicy = {
  status: "resource_class_policy_required" as const,
  universalTransactionPercent: null,
  professional: {
    label: "Grid Professional",
    freeLabel: gridPlans.individual.priceLabel,
    proLabel: `${gridPlans.pro.priceLabel} Grid Pro`,
    transactionLabel: transactionDisclosure,
    pricing:
      "Individuals can join and be findable without paying for presence. Grid Pro adds priority matching, saved availability, search tools, and history. Transaction economics remain resource-class specific and server-owned.",
  },
  facility: {
    label: "Grid Facility",
    freeLabel: "Free to join and publish eligible supply",
    proLabel: `${gridPlans.organization.priceLabel} organization plan`,
    transactionLabel: transactionDisclosure,
    pricing:
      "Facilities can publish eligible rooms, hours, equipment, services, placements, and other capacity with low entry friction. Organization tools add operating controls while transaction fees remain policy-gated by resource class.",
  },
  seller: {
    label: "Grid Seller",
    freeLabel: "Free to join where the resource class allows it",
    proLabel: "Optional Pro tools by account type",
    transactionLabel: transactionDisclosure,
    pricing:
      "Eligible sellers can enter the network without a universal mandatory transaction rate. Paid tools and any transaction economics depend on account type, resource class, jurisdiction, and approved policy.",
  },
  platform: {
    label: "Klinikos fee policy",
    pricing:
      "Klinikos does not publish one universal Grid transaction percentage. Server-owned policy can apply fixed or percentage fees only where the resource class, jurisdiction, economics, and legal review support them, with processor cost, refunds, disputes, and negotiated enterprise terms handled separately.",
  },
} as const;

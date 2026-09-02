import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { GridExchangeField } from "@/components/grid/grid-exchange-field";
import { GridLiveMap } from "@/components/grid/grid-live-map";
import { MarketplaceBrowser } from "@/components/grid/marketplace-browser";
import { UniversalResourceBrowser } from "@/components/grid/universal-resource-browser";
import { marketplaceSurfaces } from "@/lib/design/marketplace-system";
import type { MarketplaceListing } from "@/lib/grid/marketplace-rules";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const listing: MarketplaceListing = {
  id: "reference-listing",
  serviceName: "Reference consultation",
  category: "provider",
  description: "Synthetic listing used to verify presentation behavior.",
  priceLowCents: 10000,
  priceHighCents: 15000,
  requiresDeposit: false,
  requiresConsent: false,
  requiresMedicalReview: false,
  settings: ["clinic_location"],
  provider: {
    id: "reference-provider",
    displayName: "Reference professional",
    providerType: "Physician",
    specialty: null,
    experienceLevel: "Experienced",
    servicesOffered: ["Consultation"],
    travelRadiusMiles: 0,
    onCallNow: false,
    verificationStatus: "verified",
    malpracticeVerificationStatus: "verified",
  },
  availableWeekdays: [1],
  nextAvailableInDays: 1,
  serviceAreas: ["New York"],
  states: ["NY"],
};

const resource = {
  id: "reference-resource",
  organizationId: "reference-organization",
  resourceType: "space",
  subtype: "exam_room",
  title: "Reference exam room",
  description: "Synthetic capacity used to verify presentation behavior.",
  policyClass: "ordinary_resource",
  city: "New York",
  state: "NY",
  timezone: "America/New_York",
  latitude: null,
  longitude: null,
  pricingModel: "hourly",
  priceCents: 10000,
  capacity: 1,
  credentialRequirements: [],
  insuranceRequirements: [],
  operatorRequirements: [],
  usageRestrictions: [],
  availability: [],
};

function expectPublicThemeMarkup(markup: string) {
  expect(markup).toContain("--k-public-");
  expect(markup).not.toContain("--k-work-bg");
  expect(markup).not.toMatch(/(?:bg|text|border)-(?:white|blue|emerald|amber)(?:-|\s|&quot;)/);
  expect(markup).not.toMatch(/#(?:d9dee5|fbfcfd|174ea6|5b6675|4f5a68|cfd6df|0b1220|7b8490|6f6240|8a641f|17745f|a55a22|8a481b)/i);
}

describe("public Grid rendered theme contract", () => {
  it("renders the browse canvas from public appearance rather than clinical Marble", () => {
    expect(marketplaceSurfaces.browsePage).toContain("bg-[var(--k-public-bg)]");
    expect(marketplaceSurfaces.browsePage).not.toContain("--k-work-bg");
    expect(marketplaceSurfaces.page).toContain("grid-marble-surface");
    expect(marketplaceSurfaces.page).toContain("--k-work-bg");
  });

  it("renders exchange, spatial, resource, and service states without fixed light palettes", () => {
    const markup = [
      renderToStaticMarkup(<GridExchangeField initialIntent="provider" initialQuery="nurse Friday" />),
      renderToStaticMarkup(<GridLiveMap locations={[]} providers={[]} resources={[]} />),
      renderToStaticMarkup(<UniversalResourceBrowser intent="space" resources={[resource]} />),
      renderToStaticMarkup(<MarketplaceBrowser listings={[listing]} />),
    ].join("\n");

    expectPublicThemeMarkup(markup);
    expect(markup).toContain("Credentials verified");
    expect(markup).toContain("Reviewed");
  });
});

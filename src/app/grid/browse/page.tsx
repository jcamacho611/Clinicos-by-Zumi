import { KlinikosWordmark } from "@/components/brand/klinikos-brand";
import { GridExchangeField } from "@/components/grid/grid-exchange-field";
import { GridLiveMap } from "@/components/grid/grid-live-map";
import { listPublicGridResources } from "@/lib/grid/resource-repository";
import { inferGridIntent, matchesGridSearchTerms, type GridIntentKind } from "@/lib/grid/intent-rules";
import { listMarketplaceListings, listMarketplaceLocations } from "@/lib/repositories/grid-marketplace-repository";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Klinikos Grid",
  description: "Resolve a healthcare need against real published Grid capacity.",
};

const supportedIntents = new Set<GridIntentKind>([
  "all",
  "work",
  "provider",
  "space",
  "product",
  "equipment",
  "service",
  "network",
  "education",
  "organization",
  "referral",
]);

const intentResourceTypes: Record<GridIntentKind, string[]> = {
  all: ["space", "product", "equipment", "service", "organization_capacity", "education", "referral"],
  work: [],
  provider: [],
  space: ["space"],
  product: ["product"],
  equipment: ["equipment"],
  service: ["service"],
  network: ["organization_capacity", "referral"],
  education: ["education"],
  organization: ["organization_capacity"],
  referral: ["referral"],
};

export default async function GridBrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string; q?: string }>;
}) {
  const { intent, q } = await searchParams;
  const requestedIntent = (intent ?? "all") as GridIntentKind;
  const activeIntent: GridIntentKind = supportedIntents.has(requestedIntent) ? requestedIntent : "all";
  const safeQuery = q?.trim().slice(0, 240) ?? "";
  const interpretation = inferGridIntent(safeQuery, activeIntent);
  const searchTerms = interpretation.searchTerms;
  const temporalWeekdays = interpretation.temporal.weekdays;

  const [listings, locations, resources] = await Promise.all([
    listMarketplaceListings(),
    listMarketplaceLocations(),
    listPublicGridResources(),
  ]);

  const allowedResourceTypes = intentResourceTypes[activeIntent];
  const candidateResources = resources.filter((resource) => allowedResourceTypes.includes(resource.resourceType));
  const candidateListings = ["all", "work", "provider"].includes(activeIntent) ? listings : [];

  const matchingResources = candidateResources.filter((resource) =>
    matchesGridSearchTerms(
      [resource.title, resource.description, resource.subtype, resource.city, resource.state],
      searchTerms,
    ),
  );
  const matchingListings = candidateListings.filter((listing) =>
    matchesGridSearchTerms(
      [
        listing.serviceName,
        listing.description,
        listing.category,
        listing.provider.displayName,
        listing.provider.providerType,
        listing.provider.specialty,
        ...listing.serviceAreas,
        ...listing.states,
      ],
      searchTerms,
    ),
  );
  const visibleLocations = locations.filter(
    (location) =>
      ["all", "space", "organization"].includes(activeIntent) &&
      matchesGridSearchTerms(
        [location.name, location.city, location.state, location.locationType, ...location.roomTypes],
        searchTerms,
      ),
  );
  const temporalListings = temporalWeekdays.length
    ? matchingListings.filter((listing) => temporalWeekdays.some((day) => listing.availableWeekdays.includes(day)))
    : matchingListings;

  const mapProviders = temporalListings.map((listing) => ({
    id: listing.id,
    serviceName: listing.serviceName,
    providerName: listing.provider.displayName,
    providerType: listing.provider.providerType,
    serviceAreas: listing.serviceAreas,
    states: listing.states,
    onCallNow: listing.provider.onCallNow,
  }));
  const mapResources = matchingResources.map((resource) => ({
    id: resource.id,
    title: resource.title,
    resourceType: resource.resourceType,
    city: resource.city,
    state: resource.state,
    latitude: resource.latitude,
    longitude: resource.longitude,
  }));

  return (
    <main className="min-h-screen bg-[#050303] text-[#f8efed]" data-klinikos-ds>
      <header className="border-b border-[#e28b85]/10 bg-[#050303]/96">
        <div className="mx-auto flex min-h-18 max-w-[1500px] items-center px-5 py-3 sm:px-8">
          <KlinikosWordmark
            href="/grid"
            framed
            inverse
            markClassName="h-10 w-10"
            textClassName="h-[19px] w-[170px]"
            className="gap-3"
          />
        </div>
      </header>

      <section className="border-b border-[#e28b85]/10 bg-[#070405] px-5 py-4 sm:px-8">
        <div className="mx-auto max-w-[1500px]">
          <GridExchangeField initialIntent={activeIntent} initialQuery={safeQuery} />
        </div>
      </section>

      <GridLiveMap
        activeContext={{ intent: activeIntent, query: safeQuery }}
        locations={visibleLocations}
        providers={mapProviders}
        resources={mapResources}
      />
    </main>
  );
}

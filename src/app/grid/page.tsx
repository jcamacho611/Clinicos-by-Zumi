import Link from "next/link";
import { BriefcaseBusiness, Building2, GraduationCap, HeartHandshake, Network, PackageSearch, Radar, Stethoscope, Users, Wrench } from "lucide-react";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";
import { GridExchangeField } from "@/components/grid/grid-exchange-field";
import { GridLiveMap } from "@/components/grid/grid-live-map";
import { PublicPlatformShell } from "@/components/public/public-platform-shell";
import { gridPublicEntryContext } from "@/lib/grid/public-entry";
import { inferGridIntent, matchesGridSearchTerms, type GridIntentKind } from "@/lib/grid/intent-rules";
import { listPublicGridResources } from "@/lib/grid/resource-repository";
import { listMarketplaceListings, listMarketplaceLocations } from "@/lib/repositories/grid-marketplace-repository";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Klinikos Grid — Healthcare capacity, work and resources",
  description: "Search the live Klinikos Grid across healthcare people, work, spaces, equipment, services, organizations, education, and capacity from one map-led marketplace.",
};

const lanes = [
  ["work", BriefcaseBusiness, "Work"],
  ["provider", Users, "Providers"],
  ["space", Building2, "Space"],
  ["product", PackageSearch, "Products"],
  ["equipment", Wrench, "Equipment"],
  ["service", Radar, "Services"],
  ["network", Network, "Network"],
  ["education", GraduationCap, "Education"],
  ["organization", Stethoscope, "Organizations"],
  ["referral", HeartHandshake, "Referrals"],
] as const;

const validIntents = new Set<GridIntentKind>(["all", ...lanes.map(([key]) => key as GridIntentKind)]);

const intentResourceTypes: Record<string, string[]> = {
  all: ["space", "product", "equipment", "service", "organization_capacity", "education", "referral"],
  space: ["space"],
  product: ["product"],
  equipment: ["equipment"],
  service: ["service"],
  network: ["organization_capacity", "referral"],
  education: ["education"],
  organization: ["organization_capacity"],
  referral: ["referral"],
};

type GridSearchParams = {
  from?: string | string[];
  intent?: string | string[];
  q?: string | string[];
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function safeIntent(value: string | undefined): GridIntentKind {
  return value && validIntents.has(value as GridIntentKind) ? value as GridIntentKind : "all";
}

export default async function GridPage({ searchParams }: { searchParams: Promise<GridSearchParams> }) {
  const params = await searchParams;
  const from = first(params.from);
  const requestedIntent = first(params.intent);
  const entryContext = gridPublicEntryContext(from, requestedIntent);
  const activeIntent = safeIntent(requestedIntent ?? entryContext?.intent);
  const safeQuery = (first(params.q) ?? entryContext?.initialQuery ?? "").trim().slice(0, 240);
  const interpretation = inferGridIntent(safeQuery, activeIntent);
  const searchTerms = interpretation.searchTerms;
  const temporalWeekdays = interpretation.temporal.weekdays;

  const [listings, locations, resources] = await Promise.all([
    listMarketplaceListings(),
    listMarketplaceLocations(),
    listPublicGridResources(),
  ]);

  const allowedResourceTypes = intentResourceTypes[activeIntent] ?? intentResourceTypes.all;
  const laneResources = resources.filter((resource) => allowedResourceTypes.includes(resource.resourceType));
  const laneListings = ["all", "work", "provider"].includes(activeIntent) ? listings : [];
  const matchingResources = laneResources.filter((resource) => matchesGridSearchTerms([
    resource.title,
    resource.description,
    resource.subtype,
    resource.city,
    resource.state,
  ], searchTerms));
  const matchingListings = laneListings.filter((listing) => matchesGridSearchTerms([
    listing.serviceName,
    listing.description,
    listing.category,
    listing.provider.displayName,
    listing.provider.providerType,
    listing.provider.specialty,
    ...listing.serviceAreas,
    ...listing.states,
  ], searchTerms));
  const visibleLocations = locations.filter((location) => ["all", "space", "organization"].includes(activeIntent)
    && matchesGridSearchTerms([location.name, location.city, location.state, location.locationType, ...location.roomTypes], searchTerms));
  const mapListings = temporalWeekdays.length
    ? matchingListings.filter((listing) => temporalWeekdays.some((day) => listing.availableWeekdays.includes(day)))
    : matchingListings;
  const mapProviders = mapListings.map((listing) => ({
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

  const laneClass = (selected: boolean) => selected
    ? "border-[#e6817b] bg-[#e6817b] text-[#1a080a]"
    : "border-[#e28b85]/16 bg-[#100708]/76 text-[#aa918d] hover:border-[#e6817b]/36 hover:text-[#fff8f6]";

  return (
    <PublicPlatformShell>
      <main className="min-h-[100svh] bg-[#050303] text-[#f8efed]" data-klinikos-ds data-grid-marketplace>
        <header className="border-b border-[#e28b85]/12 bg-[#050303]/95 backdrop-blur-2xl">
          <div className="mx-auto flex min-h-[72px] max-w-[1600px] items-center gap-4 px-4 sm:px-7">
            <KlinikosWordmark href="/" framed inverse markClassName="h-10 w-10" textClassName="h-[20px] w-[176px]" className="gap-3" />
            <span className="hidden text-[11px] font-semibold uppercase tracking-[.18em] text-[#e6817b] md:block">Grid</span>
            <Link className="ml-auto hidden min-h-11 content-center text-xs font-semibold text-[#a68e8a] hover:text-[#fff8f6] sm:block" href="/grid/join">List something</Link>
            <Link className="inline-flex min-h-11 items-center rounded-full border border-[#e6817b]/22 bg-[#16090c] px-4 text-xs font-semibold text-[#f4ddda] hover:border-[#e6817b]/48" href="/login">Sign in</Link>
          </div>
        </header>

        <section className="border-b border-[#e28b85]/12 bg-[radial-gradient(circle_at_50%_-30%,rgba(158,40,48,.2),transparent_52%)]">
          <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-7 sm:py-6">
            {entryContext ? (
              <div className="mb-3 flex max-w-4xl items-center gap-2 text-[11px] leading-5 text-[#c6aaa6]" aria-label="Continue from Zumi">
                <span className="font-semibold uppercase tracking-[.16em] text-[#e6817b]">Zumi</span>
                <span>{entryContext.title}</span>
              </div>
            ) : null}

            <GridExchangeField initialIntent={activeIntent} initialQuery={safeQuery} />

            <nav aria-label="Grid marketplace filters" className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <Link className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-xs font-semibold ${laneClass(activeIntent === "all")}`} href="/grid">Everything</Link>
              {lanes.map(([key, Icon, label]) => (
                <Link className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-xs font-semibold ${laneClass(activeIntent === key)}`} href={`/grid?intent=${key}`} key={key}>
                  <Icon className="size-3.5" aria-hidden="true" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </section>

        <GridLiveMap locations={visibleLocations} providers={mapProviders} resources={mapResources} />

        <footer className="border-t border-[#e28b85]/12 bg-[#080405]">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-5 text-[11px] leading-5 text-[#8f7773] sm:px-7">
            <span>Only reviewed public inventory is shown. Regulated activity still requires the applicable verification, credential, eligibility, consent, and authority gates.</span>
            <Link className="ml-auto min-h-11 content-center font-semibold text-[#bfa5a1] hover:text-[#fff8f6]" href="/legal/grid">Grid terms</Link>
            <Link className="min-h-11 content-center font-semibold text-[#bfa5a1] hover:text-[#fff8f6]" href="/legal/privacy">Privacy</Link>
          </div>
        </footer>
      </main>
    </PublicPlatformShell>
  );
}

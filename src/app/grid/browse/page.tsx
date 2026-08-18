import Link from "next/link";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Building2, GraduationCap, HeartHandshake, Network, PackageSearch, Radar, ShieldCheck, Stethoscope, Users, Wrench } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { GridLiveMap } from "@/components/grid/grid-live-map";
import { GridExchangeField } from "@/components/grid/grid-exchange-field";
import { MarketplaceBrowser } from "@/components/grid/marketplace-browser";
import { UniversalResourceBrowser } from "@/components/grid/universal-resource-browser";
import { LISTING_NOT_VERIFICATION_NOTICE, MARKETPLACE_SYNTHETIC_NOTICE, marketplaceSurfaces } from "@/lib/design/marketplace-system";
import { listPublicGridResources } from "@/lib/grid/resource-repository";
import { inferGridIntent, matchesGridSearchTerms, type GridIntentKind } from "@/lib/grid/intent-rules";
import { listMarketplaceListings, listMarketplaceLocations } from "@/lib/repositories/grid-marketplace-repository";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Explore Klinikos Grid",
  description: "Browse healthcare work, providers, spaces, products, equipment, services, organizations, education, and capacity across the Klinikos Grid.",
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
  ["referral", HeartHandshake, "Referral access"],
] as const;

const laneCopy: Record<string, { eyebrow: string; title: string; body: string; note?: string }> = {
  all: { eyebrow: "Explore Grid", title: "Start with the map. Then narrow the exchange around what you need.", body: "Grid is the exchange layer for healthcare people, work, spaces, products, equipment, services, organizations, education, and capacity. Public inventory appears only after it is reviewed and published." },
  work: { eyebrow: "Find work", title: "See opportunities that match how and where you want to work.", body: "Grid is expanding around demand, availability, and work opportunities while preserving credential and jurisdiction gates for regulated roles.", note: "Direct shift and job-opportunity inventory remains on the clinician/provider demand path." },
  provider: { eyebrow: "Find a provider", title: "Find available healthcare professionals and provider capacity.", body: "Browse provider-backed services, availability, settings, and review state. Regulated work remains gated by the applicable credential and malpractice review rules." },
  space: { eyebrow: "Find space", title: "Find rooms, chairs, clinics, and available treatment capacity.", body: "Reviewed healthcare-space resources can now be published as universal Grid capacity alongside marketplace-visible clinic locations." },
  product: { eyebrow: "Find products & supplies", title: "Find permitted healthcare products, supplies, and seller inventory.", body: "General supply inventory can be reviewed and published through its own policy class. Restricted or regulated products remain blocked from generic marketplace transactions." },
  equipment: { eyebrow: "Find equipment", title: "Find rentable equipment and approved operational capacity.", body: "Reviewed equipment owners can publish capacity, permitted use, rates, restrictions, and real availability windows without forcing the listing into a provider workflow." },
  service: { eyebrow: "Find a service", title: "Find healthcare business and operational services through Grid.", body: "Business services use their own policy class so billing, consulting, IT, recruiting, credentialing, and other non-clinical work are not forced through clinical credential rules." },
  network: { eyebrow: "Find network capacity", title: "Connect with partner organizations and available healthcare capacity.", body: "Klinikos layers reviewed organization and referral capacity on top of governed partner relationships without exposing sensitive clinical data." },
  education: { eyebrow: "Find education access", title: "Find training, preceptors, placements, and education capacity.", body: "Reviewed education capacity can be published through the same Grid exchange while retaining its own availability and policy requirements." },
  organization: { eyebrow: "Find an organization", title: "Find clinics, facilities, labs, imaging centers, specialty partners, and other healthcare organizations.", body: "Organization discovery is driven by reviewed marketplace capacity and partner information rather than generic business-directory scraping." },
  referral: { eyebrow: "Find referral access", title: "Find permitted referral, consultation, diagnostic, and partner capacity.", body: "Referral resources remain non-public by default and governed by consent, sharing agreements, purpose, and minimum-necessary disclosure where clinical data is involved." },
};

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

export default async function GridBrowsePage({ searchParams }: { searchParams: Promise<{ intent?: string; q?: string }> }) {
  const { intent, q } = await searchParams;
  const activeIntent = intent && laneCopy[intent] ? intent : "all";
  const copy = laneCopy[activeIntent];
  const [listings, locations, resources] = await Promise.all([
    listMarketplaceListings(),
    listMarketplaceLocations(),
    listPublicGridResources(),
  ]);
  const safeQuery = q?.trim().slice(0, 240) ?? "";
  const interpretation = inferGridIntent(safeQuery, activeIntent as GridIntentKind);
  const searchTerms = interpretation.searchTerms;
  const temporalWeekdays = interpretation.temporal.weekdays;
  const allowedResourceTypes = intentResourceTypes[activeIntent] ?? intentResourceTypes.all;
  const laneResources = resources.filter((resource) => allowedResourceTypes.includes(resource.resourceType));
  const laneListings = ["all", "work", "provider"].includes(activeIntent) ? listings : [];
  const matchingResources = laneResources.filter((resource) => matchesGridSearchTerms([resource.title, resource.description, resource.subtype, resource.city, resource.state], searchTerms));
  const matchingListings = laneListings.filter((listing) => matchesGridSearchTerms([listing.serviceName, listing.description, listing.category, listing.provider.displayName, listing.provider.providerType, listing.provider.specialty, ...listing.serviceAreas, ...listing.states], searchTerms));
  const visibleLocations = locations.filter((location) => ["all", "space", "organization"].includes(activeIntent) && matchesGridSearchTerms([location.name, location.city, location.state, location.locationType, ...location.roomTypes], searchTerms));
  const mapListings = temporalWeekdays.length
    ? matchingListings.filter((listing) => temporalWeekdays.some((day) => listing.availableWeekdays.includes(day)))
    : matchingListings;
  const mapProviders = mapListings.map((listing) => ({ id: listing.id, serviceName: listing.serviceName, providerName: listing.provider.displayName, providerType: listing.provider.providerType, serviceAreas: listing.serviceAreas, states: listing.states, onCallNow: listing.provider.onCallNow }));
  const mapResources = matchingResources.map((resource) => ({ id: resource.id, title: resource.title, resourceType: resource.resourceType, city: resource.city, state: resource.state, latitude: resource.latitude, longitude: resource.longitude }));

  return (
    <main className={marketplaceSurfaces.page}>
      <header className="border-b border-[#e6e9ee] bg-white"><div className="mx-auto flex h-20 max-w-[1500px] items-center gap-4 px-5 sm:px-8"><Link className="flex items-center gap-3" href="/grid"><BrandMark /><span><span className="block text-sm font-extrabold tracking-[-.03em]">Klinikos Grid</span><span className={marketplaceSurfaces.eyebrow}>Universal healthcare exchange</span></span></Link><Link className="ml-auto hidden text-xs font-bold text-[#5b6675] hover:text-[#0b1220] sm:block" href="/grid/join">I have something</Link><Link className="ml-4 flex min-h-[44px] items-center bg-[#0b1220] px-4 text-xs font-bold text-white hover:bg-[#174ea6]" href="/login">Sign in</Link></div></header>

      <section className="border-b border-[#e6e9ee] bg-white"><div className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8 lg:py-14"><GridExchangeField initialIntent={activeIntent as GridIntentKind} initialQuery={safeQuery} /><div className="mt-7 flex flex-wrap gap-2"><Link className={`border px-3 py-2 text-[11px] font-extrabold ${activeIntent === "all" ? "border-[#174ea6] bg-[#174ea6] text-white" : "border-[#dfe3e8] text-[#5b6675]"}`} href="/grid/browse">Everything</Link>{lanes.map(([key, Icon, laneLabel]) => <Link className={`inline-flex items-center gap-1.5 border px-3 py-2 text-[11px] font-extrabold ${activeIntent === key ? "border-[#174ea6] bg-[#174ea6] text-white" : "border-[#dfe3e8] text-[#5b6675]"}`} href={`/grid/browse?intent=${key}`} key={key}><Icon className="size-3.5" />{laneLabel}</Link>)}</div><div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end"><div><p className={marketplaceSurfaces.eyebrow}>{copy.eyebrow}</p><h1 className={`mt-4 max-w-4xl text-4xl sm:text-5xl lg:text-6xl ${marketplaceSurfaces.headline}`}>{copy.title}</h1><p className="mt-5 max-w-3xl text-sm leading-7 text-[#5b6675]">{copy.body}</p>{copy.note && <p className="mt-4 max-w-3xl border-l-2 border-[#d7a62a] pl-4 text-[12px] leading-5 text-[#6f6240]">{copy.note}</p>}</div><div className="flex flex-wrap gap-3 lg:justify-end"><Link className="inline-flex min-h-[44px] items-center gap-2 bg-[#174ea6] px-5 text-xs font-bold text-white hover:bg-[#0f3f8f]" href="/grid">I have something <ArrowRight className="size-4" /></Link><Link className="inline-flex min-h-[44px] items-center border border-[#d7dce3] px-5 text-xs font-bold text-[#0b1220] hover:border-[#aeb7c3]" href="/grid">Change goal</Link></div></div><p className="mt-6 flex max-w-4xl gap-2.5 border border-[#e6e9ee] bg-[#fbfbfc] px-4 py-3 text-[12px] leading-5 text-[#5b6675]"><ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#9a7a1f]" /><span>{LISTING_NOT_VERIFICATION_NOTICE} {MARKETPLACE_SYNTHETIC_NOTICE}</span></p></div></section>

      <GridLiveMap locations={visibleLocations} providers={mapProviders} resources={mapResources} />
      <UniversalResourceBrowser resources={matchingResources} intent={activeIntent} />
      {["all", "work", "provider"].includes(activeIntent) && <MarketplaceBrowser initialQuery={searchTerms.join(" ")} initialWeekdays={temporalWeekdays} listings={laneListings} />}

      <footer className="border-t border-[#e6e9ee] bg-white"><div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8"><Link className="inline-flex items-center gap-2 text-xs font-bold text-[#5b6675] hover:text-[#0b1220]" href="/grid"><ArrowLeft aria-hidden="true" className="size-4" /> Back to Grid</Link><p className="mt-4 max-w-4xl text-[11px] leading-6 text-[#5b6675]">Grid does not employ listed participants or direct clinical care. Regulated opportunities require the applicable review and eligibility gates. A request starts a governed connection workflow and does not itself guarantee availability, authorize treatment, or prove that a transaction has settled.</p><div className="mt-5 flex flex-wrap gap-5 text-[11px] font-bold"><Link className="text-[#5b6675] hover:text-[#0b1220]" href="/legal/grid">Grid marketplace terms</Link><Link className="text-[#5b6675] hover:text-[#0b1220]" href="/legal/privacy">Privacy notice</Link></div></div></footer>
    </main>
  );
}

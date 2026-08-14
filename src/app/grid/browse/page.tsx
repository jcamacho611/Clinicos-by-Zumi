import Link from "next/link";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Building2, GraduationCap, HeartHandshake, Network, PackageSearch, Radar, ShieldCheck, Stethoscope, Users, Wrench } from "lucide-react";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";
import { GridLiveMap } from "@/components/grid/grid-live-map";
import { GridExchangeField } from "@/components/grid/grid-exchange-field";
import { MarketplaceBrowser } from "@/components/grid/marketplace-browser";
import { UniversalResourceBrowser } from "@/components/grid/universal-resource-browser";
import { LISTING_NOT_VERIFICATION_NOTICE, MARKETPLACE_SYNTHETIC_NOTICE } from "@/lib/design/marketplace-system";
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
  const allowedResourceTypes = intentResourceTypes[activeIntent] ?? intentResourceTypes.all;
  const laneResources = resources.filter((resource) => allowedResourceTypes.includes(resource.resourceType));
  const laneListings = ["all", "work", "provider"].includes(activeIntent) ? listings : [];
  const matchingResources = laneResources.filter((resource) => matchesGridSearchTerms([resource.title, resource.description, resource.subtype, resource.city, resource.state], searchTerms));
  const matchingListings = laneListings.filter((listing) => matchesGridSearchTerms([listing.serviceName, listing.description, listing.category, listing.provider.displayName, listing.provider.providerType, listing.provider.specialty, ...listing.serviceAreas, ...listing.states], searchTerms));
  const visibleLocations = locations.filter((location) => ["all", "space", "organization"].includes(activeIntent) && matchesGridSearchTerms([location.name, location.city, location.state, location.locationType, ...location.roomTypes], searchTerms));
  const mapProviders = matchingListings.map((listing) => ({ id: listing.id, serviceName: listing.serviceName, providerName: listing.provider.displayName, providerType: listing.provider.providerType, serviceAreas: listing.serviceAreas, states: listing.states, onCallNow: listing.provider.onCallNow }));
  const mapResources = matchingResources.map((resource) => ({ id: resource.id, title: resource.title, resourceType: resource.resourceType, city: resource.city, state: resource.state, latitude: resource.latitude, longitude: resource.longitude }));

  return (
    <main className="min-h-screen bg-[#050303] text-[#f8efed]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(139,35,42,.22),transparent_34%),radial-gradient(circle_at_88%_74%,rgba(230,129,123,.035),transparent_26%)]" />
      <header className="relative z-20 border-b border-[#e28b85]/10 bg-[#050303]/88 backdrop-blur-2xl"><div className="mx-auto flex h-20 max-w-[1500px] items-center gap-4 px-5 sm:px-8"><KlinikosWordmark href="/" framed inverse markClassName="h-7 w-7" textClassName="h-[21px] w-[190px]" className="gap-3" /><span className="hidden text-[9px] font-semibold uppercase tracking-[.18em] text-[#e6817b] md:block">Grid</span><Link className="ml-auto hidden text-xs font-semibold text-[#9f8985] hover:text-[#f8efed] sm:block" href="/grid/pricing">Pricing</Link><Link className="text-xs font-semibold text-[#9f8985] hover:text-[#f8efed]" href="/grid/browse">Browse everything</Link><Link className="ml-3 inline-flex min-h-[44px] items-center rounded-full border border-[#efaaa1]/18 bg-[#e6817b] px-5 text-xs font-semibold text-[#19090b] transition hover:bg-[#efaaa1]" href="/login">Sign in</Link></div></header>

      <section className="relative z-10 border-b border-[#e28b85]/10"><div className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8 lg:py-14"><GridExchangeField initialIntent={activeIntent as GridIntentKind} initialQuery={safeQuery} /><div className="mt-7 flex flex-wrap gap-2"><Link className={`rounded-full border px-3 py-2 text-[11px] font-semibold ${activeIntent === "all" ? "border-[#e6817b] bg-[#e6817b] text-[#19090b]" : "border-[#e28b85]/14 text-[#9f8985] hover:text-[#f8efed]"}`} href="/grid/browse">Everything</Link>{lanes.map(([key, Icon, laneLabel]) => <Link className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[11px] font-semibold ${activeIntent === key ? "border-[#e6817b] bg-[#e6817b] text-[#19090b]" : "border-[#e28b85]/14 text-[#9f8985] hover:text-[#f8efed]"}`} href={`/grid/browse?intent=${key}`} key={key}><Icon className="size-3.5" />{laneLabel}</Link>)}</div><div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end"><div><p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#e6817b]">{copy.eyebrow}</p><h1 className="mt-4 max-w-4xl text-balance text-4xl font-light leading-[.96] tracking-[-.055em] text-[#f8efed] sm:text-5xl lg:text-6xl">{copy.title}</h1><p className="mt-5 max-w-3xl text-sm leading-7 text-[#a8918d]">{copy.body}</p>{copy.note && <p className="mt-4 max-w-3xl border-l border-[#e6817b]/35 pl-4 text-[12px] leading-5 text-[#b99a95]">{copy.note}</p>}</div><div className="flex flex-wrap gap-3 lg:justify-end"><Link className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#e6817b] px-5 text-xs font-semibold text-[#19090b] hover:bg-[#efaaa1]" href="/grid">I have something <ArrowRight className="size-4" /></Link><Link className="inline-flex min-h-[44px] items-center rounded-full border border-[#e28b85]/16 px-5 text-xs font-semibold text-[#f8efed] hover:border-[#e6817b]/35" href="/grid">Change goal</Link></div></div><p className="mt-6 flex max-w-4xl gap-2.5 rounded-2xl border border-[#e28b85]/12 bg-[#100708]/62 px-4 py-3 text-[12px] leading-5 text-[#9f8985]"><ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#e6817b]" /><span>{LISTING_NOT_VERIFICATION_NOTICE} {MARKETPLACE_SYNTHETIC_NOTICE}</span></p></div></section>

      <GridLiveMap locations={visibleLocations} providers={mapProviders} resources={mapResources} />
      <UniversalResourceBrowser resources={matchingResources} intent={activeIntent} />
      {["all", "work", "provider"].includes(activeIntent) && <MarketplaceBrowser initialQuery={searchTerms.join(" ")} listings={laneListings} />}

      <footer className="relative z-10 border-t border-[#e28b85]/10 bg-[#050303]"><div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8"><Link className="inline-flex items-center gap-2 text-xs font-semibold text-[#9f8985] hover:text-[#f8efed]" href="/grid"><ArrowLeft aria-hidden="true" className="size-4" /> Back to Grid</Link><p className="mt-4 max-w-4xl text-[11px] leading-6 text-[#806965]">Grid does not employ listed participants or direct clinical care. Regulated opportunities require the applicable review and eligibility gates. A request starts a governed connection workflow and does not itself guarantee availability, authorize treatment, or prove that a transaction has settled.</p><div className="mt-5 flex flex-wrap gap-5 text-[11px] font-semibold"><Link className="text-[#9f8985] hover:text-[#f8efed]" href="/legal/grid">Grid marketplace terms</Link><Link className="text-[#9f8985] hover:text-[#f8efed]" href="/legal/privacy">Privacy notice</Link></div></div></footer>
    </main>
  );
}

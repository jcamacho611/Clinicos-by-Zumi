import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Building2, GraduationCap, HeartHandshake, Network, PackageSearch, Radar, ShieldCheck, Stethoscope, Users, Wrench } from "lucide-react";
import { GridLiveMap } from "@/components/grid/grid-live-map";
import { GridExchangeField } from "@/components/grid/grid-exchange-field";
import { MarketplaceBrowser } from "@/components/grid/marketplace-browser";
import { PublicExperienceShell } from "@/components/marketing/public-experience-shell";
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
  all: { eyebrow: "Explore Grid", title: "Start with the map. Narrow the exchange around what you need.", body: "Grid is the exchange layer for healthcare people, work, spaces, products, equipment, services, organizations, education, and capacity. Public inventory appears only after it is reviewed and published." },
  work: { eyebrow: "Find work", title: "See opportunities that match how and where you want to work.", body: "Grid is expanding around demand, availability, and work opportunities while preserving credential and jurisdiction gates for regulated roles.", note: "Direct shift and job-opportunity inventory remains on the clinician/provider demand path." },
  provider: { eyebrow: "Find a provider", title: "Find available healthcare professionals and provider capacity.", body: "Browse provider-backed services, availability, settings, and review state. Regulated work remains gated by the applicable credential and malpractice review rules." },
  space: { eyebrow: "Find space", title: "Find rooms, chairs, clinics, and available treatment capacity.", body: "Reviewed healthcare-space resources can be published as universal Grid capacity alongside marketplace-visible clinic locations." },
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

  const laneClass = (selected: boolean) => selected
    ? "border-[var(--k-accent)] bg-[var(--k-text)] text-[var(--k-work-bg)]"
    : "border-[var(--k-line)] bg-[var(--k-public-surface)] text-[var(--k-muted)] hover:text-[var(--k-text)]";

  return (
    <PublicExperienceShell contextLabel="Grid discovery">
      <main className={marketplaceSurfaces.browsePage}>
        <section className="border-b border-[var(--k-line)] bg-[var(--k-public-surface)]">
        <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:py-9">
          <GridExchangeField initialIntent={activeIntent as GridIntentKind} initialQuery={safeQuery} />
          <nav aria-label="Grid discovery lanes" className="mt-5 flex flex-wrap gap-2">
            <Link className={`min-h-11 rounded-full border px-3 py-2 text-xs font-extrabold ${laneClass(activeIntent === "all")}`} href="/grid/browse">Everything</Link>
            {lanes.map(([key, Icon, laneLabel]) => <Link className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-extrabold ${laneClass(activeIntent === key)}`} href={`/grid/browse?intent=${key}`} key={key}><Icon className="size-3.5" />{laneLabel}</Link>)}
          </nav>

          <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-4xl">
              <p className={marketplaceSurfaces.eyebrow}>{copy.eyebrow}</p>
              <h1 className={`mt-3 max-w-4xl text-3xl sm:text-4xl ${marketplaceSurfaces.headline}`}>{copy.title}</h1>
              <p className="mt-3 max-w-3xl text-[13px] leading-6 text-[var(--k-muted)]">{copy.body}</p>
              {copy.note && <p className="mt-3 max-w-3xl border-l-2 border-[var(--k-premium)] pl-4 text-xs leading-5 text-[var(--k-muted)]">{copy.note}</p>}
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Link className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--k-accent)] px-5 text-xs font-semibold text-white" href="/grid">I have something <ArrowRight className="size-4" /></Link>
              <Link className="inline-flex min-h-11 items-center rounded-full border border-[var(--k-line)] bg-[var(--k-public-surface)] px-5 text-xs font-semibold text-[var(--k-text)]" href="/grid">Change goal</Link>
            </div>
          </div>

          <aside className="mt-6 grid gap-3 border border-[var(--k-line)] bg-[var(--k-public-raised)] p-5 sm:grid-cols-[auto_1fr]" data-grid-synthetic-disclosure="true" role="note">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[var(--k-premium)]" />
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[var(--k-premium)]">Reference environment — not live supply</p>
              <p className="mt-2 max-w-5xl text-sm leading-6 text-[var(--k-muted)]">{MARKETPLACE_SYNTHETIC_NOTICE} {LISTING_NOT_VERIFICATION_NOTICE}</p>
            </div>
          </aside>
        </div>
        </section>

        <GridLiveMap locations={visibleLocations} providers={mapProviders} resources={mapResources} />
        <UniversalResourceBrowser resources={matchingResources} intent={activeIntent} />
        {["all", "work", "provider"].includes(activeIntent) && <MarketplaceBrowser initialQuery={searchTerms.join(" ")} initialWeekdays={temporalWeekdays} listings={laneListings} />}

        <section className="border-t border-[var(--k-line)] bg-[var(--k-public-surface)]" aria-label="Grid participation boundary">
          <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8">
            <p className="max-w-4xl text-xs leading-6 text-[var(--k-muted)]">Grid does not employ listed participants or direct clinical care. Regulated opportunities require the applicable review and eligibility gates. A request starts a governed connection workflow and does not itself guarantee availability, authorize treatment, or prove that a transaction has settled.</p>
            <div className="mt-4 flex flex-wrap gap-5 text-xs font-semibold"><Link className="text-[var(--k-muted)] hover:text-[var(--k-text)]" href="/legal/grid">Grid marketplace terms</Link><Link className="text-[var(--k-muted)] hover:text-[var(--k-text)]" href="/legal/privacy">Privacy notice</Link></div>
          </div>
        </section>
      </main>
    </PublicExperienceShell>
  );
}

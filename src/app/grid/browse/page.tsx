import Link from "next/link";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Building2, GraduationCap, Network, Radar, ShieldCheck, Users } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { MarketplaceBrowser } from "@/components/grid/marketplace-browser";
import { LISTING_NOT_VERIFICATION_NOTICE, MARKETPLACE_SYNTHETIC_NOTICE, marketplaceSurfaces } from "@/lib/design/marketplace-system";
import { listMarketplaceListings } from "@/lib/repositories/grid-marketplace-repository";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Explore Klinikos Grid",
  description:
    "Browse healthcare work, providers, space, services, and available capacity across the Klinikos Grid. Availability and review state are shown wherever the current data supports them.",
};

const lanes = [
  ["work", BriefcaseBusiness, "Work", "Per-diem, PRN, contract, coverage, and project opportunities."],
  ["provider", Users, "Providers", "Independent healthcare professionals and reviewed provider profiles."],
  ["space", Building2, "Space", "Rooms, chairs, clinics, and partner locations with available capacity."],
  ["service", Radar, "Services", "Healthcare business, operational, and professional services."],
  ["network", Network, "Network", "Partner organizations, handoffs, referrals, and shared capacity."],
  ["education", GraduationCap, "Education", "Preceptors, placements, training, and learning opportunities as this lane expands."],
] as const;

const laneCopy: Record<string, { eyebrow: string; title: string; body: string; note?: string }> = {
  all: {
    eyebrow: "Explore Grid",
    title: "Find work, providers, space, services, and available capacity.",
    body: "Grid is the network layer of Klinikos. Browse what is currently represented in the marketplace, then use the governed request workflow to connect with the relevant participant.",
  },
  work: {
    eyebrow: "Find work",
    title: "See opportunities that match how and where you want to work.",
    body: "The current public inventory is still provider-service centered, but Grid is being expanded around demand, availability, and work opportunities. Use the live marketplace below to discover active provider/service supply while the direct work feed comes online.",
    note: "Direct shift and job-opportunity inventory is not yet exposed as a separate public feed.",
  },
  provider: {
    eyebrow: "Find a provider",
    title: "Find available healthcare professionals and provider capacity.",
    body: "Browse provider-backed services, availability, settings, and review state. Regulated work remains gated by the applicable credential and malpractice review rules.",
  },
  space: {
    eyebrow: "Find space",
    title: "Find rooms, chairs, clinics, and available treatment capacity.",
    body: "Current public listings can include clinic, chair-rental, mobile, and at-home settings. Dedicated location-first inventory is being separated from provider-backed service listings as Grid expands.",
    note: "Location-first inventory is partially represented through listing settings today.",
  },
  service: {
    eyebrow: "Find a service",
    title: "Find healthcare and operational services through Grid.",
    body: "Browse the services currently published in Grid. Business-service categories will expand without forcing clinical credential rules onto non-clinical work.",
  },
  network: {
    eyebrow: "Find network capacity",
    title: "Connect with partner organizations and available healthcare capacity.",
    body: "Klinikos already has governed partner relationships and handoff workflows. Public network-capacity discovery is being layered into Grid without exposing sensitive clinical data.",
    note: "Partner-network inventory is not yet exposed as a full public marketplace feed.",
  },
  education: {
    eyebrow: "Find education access",
    title: "Find training, preceptors, placements, and education capacity.",
    body: "Klinikos EDU exists as a separate foundation. Grid will expose eligible education supply and demand through the same matching engine rather than creating a separate marketplace.",
    note: "Education inventory is not yet exposed in this public browser.",
  },
};

export default async function GridBrowsePage({ searchParams }: { searchParams: Promise<{ intent?: string }> }) {
  const { intent } = await searchParams;
  const activeIntent = intent && laneCopy[intent] ? intent : "all";
  const copy = laneCopy[activeIntent];
  const listings = await listMarketplaceListings();

  return (
    <main className={marketplaceSurfaces.page}>
      <header className="border-b border-[#e6e9ee] bg-white">
        <div className="mx-auto flex h-20 max-w-[1500px] items-center gap-4 px-5 sm:px-8">
          <Link className="flex items-center gap-3" href="/grid">
            <BrandMark />
            <span>
              <span className="block text-sm font-extrabold tracking-[-.03em]">Klinikos Grid</span>
              <span className={marketplaceSurfaces.eyebrow}>Healthcare opportunity network</span>
            </span>
          </Link>
          <Link className="ml-auto hidden text-xs font-bold text-[#5b6675] hover:text-[#0b1220] sm:block" href="/grid/join">I have something</Link>
          <Link className="ml-4 flex min-h-[44px] items-center bg-[#0b1220] px-4 text-xs font-bold text-white hover:bg-[#174ea6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174ea6]" href="/login">Sign in</Link>
        </div>
      </header>

      <section className="border-b border-[#e6e9ee] bg-white">
        <div className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8 lg:py-14">
          <div className="flex flex-wrap gap-2">
            <Link className={`border px-3 py-2 text-[11px] font-extrabold ${activeIntent === "all" ? "border-[#174ea6] bg-[#174ea6] text-white" : "border-[#dfe3e8] text-[#5b6675]"}`} href="/grid/browse">Everything</Link>
            {lanes.map(([key, Icon, label]) => (
              <Link className={`inline-flex items-center gap-1.5 border px-3 py-2 text-[11px] font-extrabold ${activeIntent === key ? "border-[#174ea6] bg-[#174ea6] text-white" : "border-[#dfe3e8] text-[#5b6675]"}`} href={`/grid/browse?intent=${key}`} key={key}><Icon className="size-3.5" />{label}</Link>
            ))}
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <p className={marketplaceSurfaces.eyebrow}>{copy.eyebrow}</p>
              <h1 className={`mt-4 max-w-4xl text-4xl sm:text-5xl lg:text-6xl ${marketplaceSurfaces.headline}`}>{copy.title}</h1>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-[#5b6675]">{copy.body}</p>
              {copy.note && <p className="mt-4 max-w-3xl border-l-2 border-[#d7a62a] pl-4 text-[12px] leading-5 text-[#6f6240]">{copy.note}</p>}
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end"><Link className="inline-flex min-h-[44px] items-center gap-2 bg-[#174ea6] px-5 text-xs font-bold text-white hover:bg-[#0f3f8f]" href="/grid/join">I have something <ArrowRight className="size-4" /></Link><Link className="inline-flex min-h-[44px] items-center border border-[#d7dce3] px-5 text-xs font-bold text-[#0b1220] hover:border-[#aeb7c3]" href="/grid">Change goal</Link></div>
          </div>

          <p className="mt-6 flex max-w-4xl gap-2.5 border border-[#e6e9ee] bg-[#fbfbfc] px-4 py-3 text-[12px] leading-5 text-[#5b6675]"><ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#9a7a1f]" /><span>{LISTING_NOT_VERIFICATION_NOTICE} {MARKETPLACE_SYNTHETIC_NOTICE}</span></p>
        </div>
      </section>

      <MarketplaceBrowser listings={listings} />

      <footer className="border-t border-[#e6e9ee] bg-white"><div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8"><Link className="inline-flex items-center gap-2 text-xs font-bold text-[#5b6675] hover:text-[#0b1220]" href="/grid"><ArrowLeft aria-hidden="true" className="size-4" /> Back to Grid</Link><p className="mt-4 max-w-4xl text-[11px] leading-6 text-[#5b6675]">Grid does not employ listed participants or direct clinical care. Regulated opportunities require the applicable review and eligibility gates. A request starts a governed connection workflow and does not itself guarantee availability, authorize treatment, or prove that a transaction has settled.</p><div className="mt-5 flex flex-wrap gap-5 text-[11px] font-bold"><Link className="text-[#5b6675] hover:text-[#0b1220]" href="/legal/grid">Grid marketplace terms</Link><Link className="text-[#5b6675] hover:text-[#0b1220]" href="/legal/privacy">Privacy notice</Link></div></div></footer>
    </main>
  );
}

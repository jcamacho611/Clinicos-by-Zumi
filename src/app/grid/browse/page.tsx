import Link from "next/link";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Building2, Network, Radar, ShieldCheck } from "lucide-react";
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

const categories = [
  [BriefcaseBusiness, "Work", "Per-diem, PRN, contract, coverage, and project opportunities."],
  [Network, "Providers", "Independent healthcare professionals and reviewed provider profiles."],
  [Building2, "Space", "Rooms, chairs, clinics, and partner locations with available capacity."],
  [Radar, "Services", "Healthcare business, operational, and professional services."],
] as const;

export default async function GridBrowsePage() {
  const listings = await listMarketplaceListings();

  return (
    <main className={marketplaceSurfaces.page}>
      <header className="border-b border-[#e6e9ee] bg-white">
        <div className="mx-auto flex h-20 max-w-[1500px] items-center gap-4 px-5 sm:px-8">
          <Link className="flex items-center gap-3" href="/">
            <BrandMark />
            <span>
              <span className="block text-sm font-extrabold tracking-[-.03em]">Klinikos Grid</span>
              <span className={marketplaceSurfaces.eyebrow}>Healthcare opportunity network</span>
            </span>
          </Link>
          <Link className="ml-auto hidden text-xs font-bold text-[#5b6675] hover:text-[#0b1220] sm:block" href="/grid/join">
            I have something
          </Link>
          <Link className="ml-4 flex min-h-[44px] items-center bg-[#0b1220] px-4 text-xs font-bold text-white hover:bg-[#174ea6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174ea6]" href="/login">
            Sign in
          </Link>
        </div>
      </header>

      <section className="border-b border-[#e6e9ee] bg-white">
        <div className="mx-auto max-w-[1500px] px-5 py-12 sm:px-8 lg:py-16">
          <p className={marketplaceSurfaces.eyebrow}>I need something</p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <h1 className={`max-w-4xl text-4xl sm:text-5xl lg:text-6xl ${marketplaceSurfaces.headline}`}>Find work, providers, space, services, and available capacity.</h1>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-[#5b6675]">Grid is the network layer of Klinikos. Browse what is currently represented in the marketplace, then use the governed request workflow to connect with the relevant participant. The engine is expanding beyond provider listings into universal healthcare demand and supply.</p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end"><Link className="inline-flex min-h-[44px] items-center gap-2 bg-[#174ea6] px-5 text-xs font-bold text-white hover:bg-[#0f3f8f]" href="/grid/join">I have something <ArrowRight className="size-4" /></Link><Link className="inline-flex min-h-[44px] items-center border border-[#d7dce3] px-5 text-xs font-bold text-[#0b1220] hover:border-[#aeb7c3]" href="/">Back to Klinikos</Link></div>
          </div>

          <div className="mt-10 grid gap-px overflow-hidden border border-[#e6e9ee] bg-[#e6e9ee] sm:grid-cols-2 lg:grid-cols-4">
            {categories.map(([Icon, title, body]) => <div className="bg-white p-5 sm:p-6" key={title}><Icon className="size-5 text-[#174ea6]" /><h2 className="mt-5 text-sm font-extrabold text-[#0b1220]">{title}</h2><p className="mt-2 text-[12px] leading-5 text-[#5b6675]">{body}</p></div>)}
          </div>

          <p className="mt-6 flex max-w-4xl gap-2.5 border border-[#e6e9ee] bg-[#fbfbfc] px-4 py-3 text-[12px] leading-5 text-[#5b6675]">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#9a7a1f]" />
            <span>{LISTING_NOT_VERIFICATION_NOTICE} {MARKETPLACE_SYNTHETIC_NOTICE}</span>
          </p>
        </div>
      </section>

      <MarketplaceBrowser listings={listings} />

      <footer className="border-t border-[#e6e9ee] bg-white">
        <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8">
          <Link className="inline-flex items-center gap-2 text-xs font-bold text-[#5b6675] hover:text-[#0b1220]" href="/"><ArrowLeft aria-hidden="true" className="size-4" /> Back to Klinikos</Link>
          <p className="mt-4 max-w-4xl text-[11px] leading-6 text-[#5b6675]">Grid does not employ listed participants or direct clinical care. Regulated opportunities require the applicable review and eligibility gates. A request starts a governed connection workflow and does not itself guarantee availability, authorize treatment, or prove that a transaction has settled.</p>
          <div className="mt-5 flex flex-wrap gap-5 text-[11px] font-bold"><Link className="text-[#5b6675] hover:text-[#0b1220]" href="/legal/grid">Grid marketplace terms</Link><Link className="text-[#5b6675] hover:text-[#0b1220]" href="/legal/privacy">Privacy notice</Link></div>
        </div>
      </footer>
    </main>
  );
}

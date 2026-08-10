import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { MarketplaceBrowser } from "@/components/grid/marketplace-browser";
import { LISTING_NOT_VERIFICATION_NOTICE, MARKETPLACE_SYNTHETIC_NOTICE, marketplaceSurfaces } from "@/lib/design/marketplace-system";
import { listMarketplaceListings } from "@/lib/repositories/grid-marketplace-repository";

/**
 * Public GRID marketplace discovery.
 *
 * Browsing is open; requesting requires an account. The listing set is fetched once
 * on the server and filtered instantly on the client, which is what makes the
 * surface feel immediate rather than transactional.
 */

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Find a provider — Klinikos GRID",
  description:
    "Browse independent clinicians, chair rentals, and partner locations on the Klinikos GRID marketplace. Verification state is shown on every listing.",
};

export default async function GridBrowsePage() {
  const listings = await listMarketplaceListings();

  return (
    <main className={marketplaceSurfaces.page}>
      <header className="border-b border-[#e6e9ee] bg-white">
        <div className="mx-auto flex h-20 max-w-[1500px] items-center gap-4 px-5 sm:px-8">
          <Link className="flex items-center gap-3" href="/">
            <BrandMark />
            <span>
              <span className="block text-sm font-extrabold tracking-[-.03em]">Klinikos GRID</span>
              <span className={marketplaceSurfaces.eyebrow}>Provider marketplace</span>
            </span>
          </Link>
          <Link className="ml-auto hidden text-xs font-bold text-[#5b6675] hover:text-[#0b1220] sm:block" href="/grid/join">
            List your services
          </Link>
          <Link
            className="ml-4 flex min-h-[44px] items-center bg-[#0b1220] px-4 text-xs font-bold text-white hover:bg-[#174ea6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174ea6]"
            href="/login"
          >
            Sign in to request
          </Link>
        </div>
      </header>

      <section className="border-b border-[#e6e9ee] bg-white">
        <div className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8">
          <h1 className={`max-w-3xl text-4xl sm:text-5xl ${marketplaceSurfaces.headline}`}>
            Find the clinician, chair, or room you need.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5b6675]">
            Independent nurses, injectors, and location partners across the Klinikos network. Every listing shows its credential review
            state, so you always know what has been verified and what has not.
          </p>
          <p className="mt-5 flex max-w-3xl gap-2.5 border border-[#e6e9ee] bg-[#fbfbfc] px-4 py-3 text-[12px] leading-5 text-[#5b6675]">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#9a7a1f]" />
            <span>{LISTING_NOT_VERIFICATION_NOTICE} {MARKETPLACE_SYNTHETIC_NOTICE}</span>
          </p>
        </div>
      </section>

      <MarketplaceBrowser listings={listings} />

      <footer className="border-t border-[#e6e9ee] bg-white">
        <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8">
          <Link className="inline-flex items-center gap-2 text-xs font-bold text-[#5b6675] hover:text-[#0b1220]" href="/">
            <ArrowLeft aria-hidden="true" className="size-4" /> Back to Klinikos
          </Link>
          <p className="mt-4 max-w-4xl text-[11px] leading-6 text-[#5b6675]">
            Klinikos does not employ the clinicians listed here and does not direct clinical care. Requesting a provider starts a
            governed booking workflow that a human confirms; it does not book an appointment, authorize treatment, or guarantee
            availability. Payment, insurance, and scope of practice are settled between the parties under the GRID marketplace terms.
          </p>
          <div className="mt-5 flex flex-wrap gap-5 text-[11px] font-bold">
            <Link className="text-[#5b6675] hover:text-[#0b1220]" href="/legal/grid">GRID marketplace terms</Link>
            <Link className="text-[#5b6675] hover:text-[#0b1220]" href="/legal/privacy">Privacy notice</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

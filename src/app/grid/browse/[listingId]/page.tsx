import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, Clock, MapPin, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { LISTING_NOT_VERIFICATION_NOTICE, MARKETPLACE_SYNTHETIC_NOTICE, marketplaceSurfaces } from "@/lib/design/marketplace-system";
import { availabilitySummary, canReceiveRequests, formatPriceRange, presentVerification, settingLabel, weekdayLabels } from "@/lib/grid/marketplace-rules";
import { getMarketplaceListing } from "@/lib/repositories/grid-marketplace-repository";
import { getClinicSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const toneClass = {
  verified: "border-[#0f766e]/30 bg-[#0f766e]/[.07] text-[#0f766e]",
  pending: "border-[#b45309]/30 bg-[#b45309]/[.07] text-[#b45309]",
} as const;

export default async function GridListingPage({ params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params;
  const [listing, session] = await Promise.all([getMarketplaceListing(listingId), getClinicSession()]);
  if (!listing) notFound();

  const verification = presentVerification(listing.provider);
  const bookable = canReceiveRequests(listing.provider);
  const requestPath = `/grid/needs/new?kind=provider&listingId=${encodeURIComponent(listing.id)}`;

  return (
    <main className={marketplaceSurfaces.page}>
      <header className="border-b border-[#e6e9ee] bg-white">
        <div className="mx-auto flex h-20 max-w-[1500px] items-center gap-4 px-5 sm:px-8">
          <Link className="flex items-center gap-3" href="/grid/browse"><BrandMark /><span><span className="block text-sm font-extrabold tracking-[-.03em]">Klinikos GRID</span><span className={marketplaceSurfaces.eyebrow}>Provider marketplace</span></span></Link>
          <Link className="ml-auto inline-flex items-center gap-2 text-xs font-bold text-[#5b6675] hover:text-[#0b1220]" href="/grid/browse"><ArrowLeft aria-hidden="true" className="size-4" /> All listings</Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_360px] lg:items-start">
        <article>
          <p className={marketplaceSurfaces.eyebrow}>{listing.category}</p>
          <h1 className={`mt-3 text-4xl sm:text-5xl ${marketplaceSurfaces.headline}`}>{listing.serviceName}</h1>
          <p className="mt-4 text-base font-semibold text-[#5b6675]">{listing.provider.displayName} · {listing.provider.providerType}{listing.provider.specialty ? ` · ${listing.provider.specialty}` : ""}</p>
          <p className={`mt-5 inline-flex items-center gap-2 border px-3 py-1.5 text-[12px] font-bold ${toneClass[verification.tone]}`}><BadgeCheck aria-hidden="true" className="size-4" />{verification.label}</p>
          <p className="mt-3 max-w-2xl text-[13px] leading-6 text-[#5b6675]">{verification.detail}</p>

          <h2 className="mt-10 text-lg font-extrabold tracking-[-.03em]">About this service</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5b6675]">{listing.description}</p>

          <h2 className="mt-10 text-lg font-extrabold tracking-[-.03em]">Where it can happen</h2>
          <ul className="mt-3 flex flex-wrap gap-2">{listing.settings.map((setting) => <li className={`${marketplaceSurfaces.card} px-3 py-2 text-[13px] font-semibold`} key={setting}>{settingLabel(setting)}</li>)}</ul>
          {listing.provider.travelRadiusMiles > 0 && <p className="mt-3 flex items-center gap-2 text-[13px] text-[#5b6675]"><MapPin aria-hidden="true" className="size-4" />Travels up to {listing.provider.travelRadiusMiles} miles{listing.serviceAreas.length ? ` · ${listing.serviceAreas.join(", ")}` : ""}</p>}

          <h2 className="mt-10 text-lg font-extrabold tracking-[-.03em]">Availability</h2>
          <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#0b1220]"><Clock aria-hidden="true" className="size-4 text-[#5b6675]" /> {availabilitySummary(listing)}</p>
          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Published availability by weekday">{weekdayLabels.map((label, weekday) => { const open = listing.availableWeekdays.includes(weekday); return <li className={`min-w-[52px] border px-3 py-2 text-center text-[12px] font-bold ${open ? "border-[#174ea6] bg-[#174ea6]/[.06] text-[#0b1220]" : "border-[#e6e9ee] bg-white text-[#cdd3dc]"}`} key={label}>{label}<span className="sr-only">{open ? " available" : " unavailable"}</span></li>; })}</ul>

          {(listing.requiresConsent || listing.requiresMedicalReview || listing.requiresDeposit) && <><h2 className="mt-10 text-lg font-extrabold tracking-[-.03em]">Before this can be confirmed</h2><ul className="mt-3 grid max-w-2xl gap-2">{listing.requiresMedicalReview && <li className="text-[13px] leading-6 text-[#5b6675]">· A clinician must review suitability before this service proceeds.</li>}{listing.requiresConsent && <li className="text-[13px] leading-6 text-[#5b6675]">· Written consent is required and is captured outside this marketplace.</li>}{listing.requiresDeposit && <li className="text-[13px] leading-6 text-[#5b6675]">· A deposit is recorded manually; Klinikos does not process it here.</li>}</ul></>}
        </article>

        <aside className="lg:sticky lg:top-6"><div className={`${marketplaceSurfaces.card} p-6`}>
          <p className="text-2xl font-extrabold tracking-[-.04em]">{formatPriceRange(listing.priceLowCents, listing.priceHighCents)}</p>
          <p className="mt-1 text-[12px] text-[#5b6675]">Provider-set range. Final price is agreed between the parties.</p>
          {bookable ? <Link className="mt-6 flex min-h-[48px] w-full items-center justify-center bg-[#0b1220] px-4 text-sm font-bold text-white hover:bg-[#174ea6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174ea6]" href={session ? requestPath : `/login?returnTo=${encodeURIComponent(requestPath)}`}>{session ? "Create provider request" : "Sign in to request"}</Link> : <p className="mt-6 border border-[#b45309]/30 bg-[#b45309]/[.07] px-4 py-3 text-[12px] leading-5 text-[#b45309]">This provider cannot accept requests until Klinikos credential review is complete.</p>}
          <p className="mt-4 text-[12px] leading-5 text-[#5b6675]">This opens the governed provider-need workflow. It does not select or reserve this listing, book an appointment, authorize treatment, or guarantee availability.</p>
          <p className="mt-5 flex gap-2.5 border-t border-[#e6e9ee] pt-4 text-[11px] leading-5 text-[#5b6675]"><ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#9a7a1f]" /><span>{LISTING_NOT_VERIFICATION_NOTICE} {MARKETPLACE_SYNTHETIC_NOTICE}</span></p>
        </div></aside>
      </div>
    </main>
  );
}

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { PricingCatalog } from "@/components/commerce/pricing-catalog";
import { accessProductCatalogView } from "@/lib/commerce/access-product-catalog";

/**
 * Public marketplace pricing.
 *
 * Prices are rendered from the same server catalog the purchase API charges from,
 * so the page cannot advertise a price the server would not honour.
 */

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Klinikos pricing",
  description: "One-time review and onboarding fees for Klinikos clinics, contractors, location owners, and sellers.",
};

export default function PricingPage() {
  const products = accessProductCatalogView(process.env as Record<string, string | undefined>);

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <header className="border-b border-slate-200 bg-[#07151c] text-white">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div>
              <p className="text-sm font-extrabold">Klinikos</p>
              <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#e6c55b]">Pricing</p>
            </div>
          </div>
          <h1 className="mt-10 max-w-3xl text-4xl font-extrabold leading-[1.02] tracking-[-.06em] sm:text-5xl">
            Review and onboarding fees.
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-300">
            Each fee below buys a defined piece of work: a review, a session, or an implementation package. None of them buys approval.
            Credential verification, facility authority, listing publication, and clinical scope all remain human decisions that a payment
            does not settle.
          </p>
          <div className="mt-8 flex gap-3 border-t border-white/15 pt-6 text-[11px] leading-6 text-slate-300">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#e6c55b]" />
            <span>
              This environment is an engineering foundation using synthetic data only. It is not a certified EHR, a HIPAA-compliant
              deployment, or a production clinical system.
            </span>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <PricingCatalog products={products} />

        <div className="mt-12 flex flex-wrap gap-5 border-t border-slate-200 pt-6 text-[11px] font-bold">
          <Link className="text-slate-700 hover:text-slate-950" href="/entry">Recurring access passes</Link>
          <Link className="text-slate-700 hover:text-slate-950" href="/payments/verify">Already paid? Submit your reference</Link>
          <Link className="text-slate-700 hover:text-slate-950" href="/legal/grid">GRID marketplace terms</Link>
          <Link className="text-slate-700 hover:text-slate-950" href="/legal/privacy">Privacy notice</Link>
        </div>
      </section>
    </main>
  );
}

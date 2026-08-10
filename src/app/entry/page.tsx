import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { AccessPassCheckout } from "@/components/commerce/access-pass-checkout";
import { accessCatalogView } from "@/lib/commerce/whop-client";

/**
 * Whop-first paid portal entry.
 *
 * The catalog and its purchasable state are resolved on the server so the page can
 * never offer a pass that has no configured Whop plan behind it.
 */

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Klinikos access passes",
  description: "Purchase Klinikos evaluation, clinic, or GRID marketplace access.",
};

export default function EntryPage() {
  const catalog = accessCatalogView();

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <header className="border-b border-slate-200 bg-[#07151c] text-white">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div>
              <p className="text-sm font-extrabold">Klinikos</p>
              <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#e6c55b]">Paid access</p>
            </div>
          </div>
          <h1 className="mt-10 max-w-3xl text-4xl font-extrabold leading-[1.02] tracking-[-.06em] sm:text-5xl">
            Choose how you enter Klinikos.
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-300">
            Access passes are sold and billed through Whop. Each pass unlocks a defined set of Klinikos capabilities and nothing beyond
            them. Credentialing, facility authority, and clinical scope remain separate human-reviewed gates that payment does not satisfy.
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
        <AccessPassCheckout adapterConfigured={catalog.adapter.configured} passes={catalog.tiers} />

        {!catalog.adapter.configured && catalog.adapter.missing.length > 0 && (
          <p className="mt-10 border-t border-slate-200 pt-6 text-[11px] leading-5 text-slate-500">
            Deployment configuration still required: {catalog.adapter.missing.join(", ")}.
          </p>
        )}

        <div className="mt-10 flex flex-wrap gap-5 border-t border-slate-200 pt-6 text-[11px] font-bold">
          <Link className="text-slate-700 hover:text-slate-950" href="/legal/grid">GRID marketplace terms</Link>
          <Link className="text-slate-700 hover:text-slate-950" href="/legal/access-terms">Access terms</Link>
          <Link className="text-slate-700 hover:text-slate-950" href="/legal/privacy">Privacy notice</Link>
          <Link className="text-slate-700 hover:text-slate-950" href="/access">Verify a work email</Link>
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ScrollText } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";

export const metadata: Metadata = {
  title: "GRID marketplace terms — Klinikos",
  description: "The status of the Klinikos GRID marketplace agreement and what governs GRID participation today.",
};

/**
 * The GRID marketplace terms page.
 *
 * `/entry` has linked here since the paid entry surface shipped, and until now the link
 * returned a 404 — a buyer clicking through to review mandatory terms immediately
 * before paying found nothing there.
 *
 * This page does not invent an agreement. Drafting marketplace terms is counsel's work,
 * not a code change, and a fabricated agreement on a legal route would be worse than the
 * 404 it replaced. What it does instead is state the position accurately: the separate
 * GRID agreement contemplated by clause 8 of the access terms has not been published, so
 * a buyer can see exactly what does and does not govern them today.
 */
export default function GridMarketplaceTermsPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-5xl items-center px-5 sm:px-8">
          <Link className="flex items-center gap-3" href="/">
            <BrandMark />
            <div>
              <p className="text-sm font-extrabold">Klinikos</p>
              <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#9a7a1f]">Legal</p>
            </div>
          </Link>
          <Link className="ml-auto flex items-center gap-2 text-xs font-bold text-slate-600" href="/entry">
            <ArrowLeft className="size-4" /> Paid entry
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-4xl px-5 py-14 sm:px-8">
        <ScrollText className="size-9 text-[#9a7a1f]" />
        <p className="mt-6 text-[11px] font-extrabold uppercase tracking-[.2em] text-[#9a7a1f]">Not yet published</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-[-.05em] sm:text-5xl">
          The GRID marketplace agreement has not been published.
        </h1>
        <p className="mt-6 text-sm leading-7 text-slate-600">
          Clause 8 of the Klinikos access terms says that GRID participation, contractor relationships and paid
          services may require separate agreements. Those separate GRID agreements are still with counsel. This page
          exists so that you can see that plainly rather than assume terms exist that do not.
        </p>

        <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
          <section className="py-7">
            <h2 className="text-lg font-extrabold tracking-[-.025em]">What governs GRID access today</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              The{" "}
              <Link className="font-bold underline decoration-slate-300 underline-offset-2" href="/legal/access-terms">
                Access, Confidentiality &amp; Intellectual Property Terms
              </Link>{" "}
              and the{" "}
              <Link className="font-bold underline decoration-slate-300 underline-offset-2" href="/legal/privacy">
                privacy notice
              </Link>{" "}
              apply to everyone with Klinikos access, including GRID participants. Nothing on this page removes or
              varies them.
            </p>
          </section>

          <section className="py-7">
            <h2 className="text-lg font-extrabold tracking-[-.025em]">What is not yet covered</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Marketplace participation terms, contractor engagement terms, facility and capacity listing terms,
              payout and platform-fee terms, cancellation and dispute handling, insurance and malpractice
              requirements, and the allocation of responsibility between participants in a GRID transaction. None of
              these are settled, and none should be assumed.
            </p>
          </section>

          <section className="py-7">
            <h2 className="text-lg font-extrabold tracking-[-.025em]">What this means before you buy</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              A GRID pass grants software access. It is not a contracted commercial marketplace relationship, and it
              does not establish an employment, contractor, agency or facility arrangement between you, Klinikos, or
              any other participant. Credential review remains a human decision and no purchase completes it.
            </p>
          </section>

          <section className="py-7">
            <h2 className="text-lg font-extrabold tracking-[-.025em]">When this changes</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              When the GRID agreements are published, this page is replaced by them and existing participants are
              asked to accept the published version before continuing. Acceptance is recorded against a version and a
              date, as it is for the access terms.
            </p>
          </section>
        </div>

        <p className="mt-8 text-xs leading-6 text-slate-500">
          This page is a statement of current status, not a commercial agreement, and it is not legal advice. If you
          need the marketplace terms before proceeding, contact Klinikos rather than treating their absence as
          permission.
        </p>
      </article>
    </main>
  );
}

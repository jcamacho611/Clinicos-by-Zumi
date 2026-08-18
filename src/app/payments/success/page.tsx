import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock3, ShieldCheck } from "lucide-react";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";

export const metadata: Metadata = {
  title: "Payment return | Klinikos",
  description: "Klinikos is waiting for verified server-side payment evidence.",
  robots: { index: false, follow: false },
};

export default function PaymentReturnPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070304] px-5 py-8 text-[#fff9f7] sm:px-8 sm:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(161,74,70,.16),transparent_34%),radial-gradient(circle_at_78%_78%,rgba(111,49,49,.1),transparent_30%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col">
        <header className="flex items-center justify-between gap-4">
          <KlinikosWordmark href="/" framed inverse markClassName="h-10 w-10" textClassName="h-[19px] w-[170px]" className="gap-3" />
          <span className="rounded-full border border-[#efaaa1]/20 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[.16em] text-[#efaaa1]/70">Server verification</span>
        </header>

        <section className="my-auto grid gap-8 py-16 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
          <div>
            <p className="text-[12px] font-black uppercase tracking-[.28em] text-[#efaaa1]">Return received</p>
            <h1 className="mt-5 max-w-3xl text-5xl font-light leading-[.96] tracking-[-.065em] sm:text-6xl lg:text-7xl">
              We’re confirming this with the payment provider.
            </h1>
            <p className="mt-7 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">
              You do not need to submit anything again. Klinikos recognizes payment only after the processor sends valid signed server evidence. This browser return—whether checkout completed or was canceled—never marks an engagement paid.
            </p>
          </div>

          <aside className="rounded-[1.75rem] border border-[#efaaa1]/18 bg-[#16090b]/70 p-6 shadow-[0_28px_90px_rgba(88,30,30,.2)] sm:p-8">
            <div className="flex size-11 items-center justify-center rounded-full border border-[#efaaa1]/20 bg-[#efaaa1]/[.07]">
              <Clock3 className="size-5 text-[#efaaa1]" aria-hidden="true" />
            </div>
            <h2 className="mt-6 text-xl font-semibold tracking-[-.035em]">What happens next</h2>
            <p className="mt-3 text-xs leading-6 text-white/50">
              Signed payment evidence is matched to the server-owned product, amount, currency, organization, Checkout Session, and live environment. If any fact does not match, it stays unconfirmed for review.
            </p>
            <div className="mt-6 flex items-start gap-3 border-t border-white/10 pt-5 text-[11px] leading-5 text-white/45">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#efaaa1]" aria-hidden="true" />
              Payment does not bypass identity, privacy, eligibility, authorization, clinical, or human-review controls. The Clinic Operating Analysis does not activate production software.
            </div>
          </aside>
        </section>

        <footer className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] leading-5 text-white/35">Your saved request remains available for authorized follow-up. Do not create a second reservation for the same purchase.</p>
          <div className="flex flex-wrap gap-2">
            <Link className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 px-5 text-xs font-extrabold text-white/70 hover:bg-white/[.04]" href="/">Return home</Link>
            <Link className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#b66d69] px-5 text-xs font-extrabold text-[#170708] hover:bg-[#ca807a]" href="/pricing">See what comes after the analysis <ArrowRight className="size-4" aria-hidden="true" /></Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

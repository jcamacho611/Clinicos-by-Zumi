import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";
import { UniversalEntryRouter } from "@/components/auth/universal-entry-router";
import { requireAccountSession } from "@/lib/auth/account-session";

export default async function MemberHomePage() {
  const session = await requireAccountSession();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050303] text-[#f8efed]">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0" style={{ background: "radial-gradient(circle at 18% 8%, rgba(124,42,49,.28), transparent 34%), linear-gradient(180deg,#050303 0%,#0b0506 100%)" }} />

      <header className="relative z-20 border-b border-[#4f292d] bg-[#080405]">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center gap-4 px-5 sm:px-8">
          <KlinikosWordmark href="/member" inverse markClassName="h-8 w-8" textClassName="h-[18px] w-[160px]" />
          <span className="ml-auto hidden max-w-[260px] truncate text-[11px] font-semibold text-[#a9918d] sm:block">{session.email}</span>
          {session.kind === "clinic" ? <Link className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#e6817b] px-4 text-[11px] font-bold text-[#1a090a]" href="/dashboard">Clinic workspace <ArrowRight className="size-3.5" aria-hidden="true" /></Link> : null}
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-5xl px-5 py-12 sm:px-8 lg:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-[#e6817b]">Welcome, {session.name}</p>
          <h1 className="mt-5 text-balance text-[clamp(2.8rem,6vw,5.2rem)] font-extralight leading-[.98] tracking-[-.06em] text-[#fff8f6]">What brings you to Klinikos?</h1>
          <p className="mt-6 text-sm leading-7 text-[#c7afab]">Your identity persists. Your context can change. Tell Zumi what you are trying to accomplish and Klinikos will reveal the smallest useful path instead of making you choose a permanent product or persona.</p>
        </div>

        <div className="mx-auto mt-10 max-w-4xl">
          <UniversalEntryRouter />
        </div>

        <div className="mx-auto mt-8 flex max-w-4xl gap-3 border border-[#4f292d] bg-[#0b0507] p-4 text-[10px] leading-5 text-[#9f8884]">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#e99089]" aria-hidden="true" />
          <p>Your account proves only that you can authenticate to this person-level identity. Klinikos still verifies organization relationships, credentials, professional authority, patient access, payments, Grid eligibility and other consequential claims separately.</p>
        </div>
      </section>
    </main>
  );
}

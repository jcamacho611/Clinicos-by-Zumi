import type { Metadata } from "next";
import Link from "next/link";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";
import { UniversalEntryRouter } from "@/components/auth/universal-entry-router";

export const metadata: Metadata = {
  title: "Start with Klinikos",
  description: "Tell Klinikos what needs to happen and continue into the right governed experience.",
};

const safeIntentKeys = new Set(["clinic", "grid", "edu", "care", "staffing", "referrals", "revenue", "billing"]);

export default async function UniversalEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const { intent } = await searchParams;
  const initialIntentKey = intent && safeIntentKeys.has(intent) ? intent : null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050303] text-[#f8efed]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 18% 12%, rgba(124,42,49,.30), transparent 34%), radial-gradient(circle at 86% 78%, rgba(111,48,51,.18), transparent 34%), linear-gradient(180deg, #050303 0%, #0b0506 100%)",
        }}
      />

      <header className="relative z-20 border-b border-[#d9918a]/15">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center gap-4 px-5 sm:px-8">
          <KlinikosWordmark
            href="/"
            inverse
            markClassName="h-8 w-8"
            textClassName="h-[18px] w-[160px]"
          />
          <nav className="ml-auto flex items-center gap-2" aria-label="Account options">
            <Link
              className="inline-flex min-h-11 items-center rounded-full border border-[#d9918a]/25 px-4 text-xs font-semibold text-[#ead9d5] transition hover:border-[#efaaa1]/55 hover:bg-[#8f3e45]/10"
              href="/portal/login"
            >
              Patient access
            </Link>
            <Link
              className="inline-flex min-h-11 items-center rounded-full bg-[#e6817b] px-4 text-xs font-extrabold text-[#1a090a] transition hover:bg-[#efaaa1]"
              href="/login"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[.78fr_1.22fr] lg:items-center lg:py-16">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[.28em] text-[#e88f88]">One Klinikos</p>
          <h1 className="mt-5 text-balance text-[clamp(2.75rem,6vw,5.8rem)] font-extralight leading-[.94] tracking-[-.055em] text-[#fff8f6]">
            Start with the outcome, not the product menu.
          </h1>
          <p className="mt-7 max-w-lg text-sm leading-7 text-[#d7c0bc] sm:text-base">
            Tell Klinikos what needs to happen. Zumi will help route you toward the next useful experience, while identity, payment, credentials, organization authority, and clinical access remain separate server-controlled gates.
          </p>

          <div className="mt-9 space-y-4 border-t border-[#d9918a]/15 pt-7 text-[12px] leading-6 text-[#bca39f]">
            <p className="flex gap-3"><ShieldCheck className="mt-1 size-4 shrink-0 text-[#e88f88]" aria-hidden="true" /> Public onboarding is for non-sensitive intent and setup context. Do not enter patient names, diagnoses, records, or PHI.</p>
            <p className="flex gap-3"><LockKeyhole className="mt-1 size-4 shrink-0 text-[#e88f88]" aria-hidden="true" /> Saying you represent a clinic, school, employer, or profession does not verify that authority. Klinikos asks for proof only when the action requires it.</p>
          </div>
        </div>

        <UniversalEntryRouter initialIntentKey={initialIntentKey} />
      </section>
    </main>
  );
}

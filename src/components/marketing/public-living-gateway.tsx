"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, GraduationCap, HeartPulse, Search, Sparkles, Stethoscope } from "lucide-react";
import { resolveIntentDeterministically } from "@/lib/orchestration/intent-engine";

const doorwayActions = [
  { key: "care", label: "RUN A CLINIC", description: "Operate care, staff work, follow-up, and revenue", href: "/start", icon: Stethoscope },
  { key: "work", label: "EXPLORE GRID", description: "Find or offer healthcare work, space, services, and capacity", href: "/grid", icon: BriefcaseBusiness },
  { key: "learn", label: "LEARN", description: "Build skills, practice, and explore Klinikos EDU", href: "/edu", icon: GraduationCap },
  { key: "patient", label: "GET CARE", description: "Open the patient-facing care experience", href: "/portal", icon: HeartPulse },
] as const;

const pathDestinations: Record<string, { href: string; action: string }> = {
  "find-extra-work": { href: "/grid", action: "Explore matching Grid opportunities" },
  "become-grid-ready": { href: "/edu", action: "Start learning & readiness" },
  "fill-staffing-need": { href: "/start", action: "Continue with clinic operations" },
  "fix-referral-leakage": { href: "/start", action: "Continue with clinic operations" },
};

export function PublicLivingGateway() {
  const [intent, setIntent] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const result = useMemo(() => submitted ? resolveIntentDeterministically(intent) : null, [intent, submitted]);
  const pathId = result?.candidatePathIds[0] ?? null;
  const destination = pathId ? pathDestinations[pathId] : null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <section className="relative isolate min-h-[88vh] overflow-hidden bg-[#05090f] px-5 py-28 text-white sm:px-8 lg:px-12 lg:py-40" aria-labelledby="public-living-title">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(22,119,168,.16),transparent_34%),linear-gradient(180deg,#05090f_0%,#07111d_100%)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.24em] text-cyan-200/80"><Sparkles className="size-3.5" /> Klinikos</div>
        <h1 className="mt-10 max-w-4xl text-balance text-5xl font-semibold tracking-[-.06em] sm:text-6xl lg:text-7xl" id="public-living-title">What needs to happen?</h1>
        <p className="mt-7 max-w-2xl text-base leading-8 text-white/58 sm:text-lg">Start with the outcome. Klinikos brings the right clinic, Grid, learning, or care experience forward without making you understand everything underneath it.</p>

        <form className="mt-12 w-full max-w-3xl" onSubmit={submit}>
          <label className="sr-only" htmlFor="public-klinikos-intent">Tell Klinikos what you need</label>
          <div className="flex items-center gap-3 rounded-2xl border border-white/14 bg-white/[.055] p-2.5 backdrop-blur-xl focus-within:border-cyan-300/45 focus-within:ring-4 focus-within:ring-cyan-300/8">
            <Search className="ml-2 size-5 shrink-0 text-white/35" />
            <input
              className="min-w-0 flex-1 bg-transparent px-1 py-3 text-sm font-semibold text-white outline-none placeholder:text-white/32 sm:text-base"
              id="public-klinikos-intent"
              onChange={(event) => { setIntent(event.target.value); setSubmitted(false); }}
              placeholder="I need a treatment room Saturday..."
              value={intent}
            />
            <button className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#07111d] transition hover:bg-cyan-100" type="submit" aria-label="Find the right Klinikos starting point">
              <ArrowRight className="size-4" />
            </button>
          </div>
        </form>

        {result ? (
          <div className="mt-8 w-full max-w-3xl text-left" aria-live="polite">
            {destination ? (
              <div className="border-y border-cyan-300/20 py-6 sm:py-7">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-cyan-200/75">Klinikos found a starting point</p>
                    <p className="mt-2 text-lg font-semibold text-white">{result.outcome}</p>
                    <p className="mt-2 text-sm leading-6 text-white/50">Continue into the relevant experience. Sign-in, permissions, credentials, payment, and regulated actions are checked separately when they are actually required.</p>
                  </div>
                  <Link className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[#07111d]" href={destination.href}>{destination.action} <ArrowRight className="size-4" /></Link>
                </div>
              </div>
            ) : (
              <div className="border-y border-white/12 py-6 text-sm leading-6 text-white/60">
                <p className="font-semibold text-white">Klinikos needs one more piece of context.</p>
                <p className="mt-1">{result.clarificationQuestions[0] ?? "Choose the closest doorway below and continue."}</p>
              </div>
            )}
          </div>
        ) : null}

        <div className="mt-20 grid w-full max-w-5xl gap-x-10 gap-y-12 text-left sm:grid-cols-2 lg:grid-cols-4">
          {doorwayActions.map(({ key, label, description, href, icon: Icon }) => (
            <Link className="group border-t border-white/12 pt-6" href={href} key={key}>
              <span className="flex items-start gap-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[.03] text-cyan-100"><Icon className="size-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-extrabold tracking-[.16em] text-white">{label}</span>
                  <span className="mt-2 block text-xs leading-5 text-white/45">{description}</span>
                </span>
                <ArrowRight className="mt-1 size-3.5 text-white/25 transition group-hover:translate-x-1 group-hover:text-cyan-200" />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-20 flex flex-wrap justify-center gap-x-7 gap-y-4 border-t border-white/10 pt-8 text-xs font-semibold text-white/45">
          <Link className="hover:text-white" href="/access">Get verified free access</Link>
          <Link className="hover:text-white" href="/login">Sign in</Link>
          <a className="hover:text-white" href="#klinikos-story">See how Klinikos works</a>
          <Link className="hover:text-white" href="/about">About</Link>
        </div>
      </div>
    </section>
  );
}

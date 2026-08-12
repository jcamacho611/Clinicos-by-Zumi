"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, GraduationCap, HeartPulse, Search, Stethoscope } from "lucide-react";
import { resolveIntentDeterministically } from "@/lib/orchestration/intent-engine";

const doorwayActions = [
  { key: "care", label: "Run a clinic", description: "Operate care, staff work, follow-up, referrals, results, and revenue continuity.", href: "/start", icon: Stethoscope },
  { key: "work", label: "Explore Grid", description: "Find or offer healthcare work, space, services, equipment, education, and capacity.", href: "/grid", icon: BriefcaseBusiness },
  { key: "learn", label: "Klinikos EDU", description: "Learn through courses and scenarios, build readiness, and move toward opportunity.", href: "/edu", icon: GraduationCap },
  { key: "patient", label: "Get care", description: "Open the patient-facing experience for appointments, forms, messages, and next steps.", href: "/portal", icon: HeartPulse },
] as const;

const pathDestinations: Record<string, { href: string; action: string }> = {
  "find-extra-work": { href: "/grid", action: "Explore Grid" },
  "become-grid-ready": { href: "/edu", action: "Open EDU" },
  "fill-staffing-need": { href: "/grid", action: "Find capacity" },
  "fix-referral-leakage": { href: "/start", action: "Map the clinic workflow" },
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
    <section className="k-hero relative isolate min-h-[94svh] overflow-hidden" aria-labelledby="public-living-title">
      <div className="mx-auto flex min-h-[94svh] max-w-[1500px] flex-col px-5 sm:px-8 lg:px-12">
        <header className="flex min-h-24 items-center border-b k-rule">
          <Link href="/" className="text-sm font-extrabold tracking-[.18em]">KLINIKOS</Link>
          <nav className="k-muted ml-auto hidden items-center gap-7 text-xs font-semibold md:flex" aria-label="Public navigation">
            <Link className="transition hover:text-[var(--k-text)]" href="/grid">Grid</Link>
            <Link className="transition hover:text-[var(--k-text)]" href="/edu">EDU</Link>
            <Link className="transition hover:text-[var(--k-text)]" href="/pricing">Pricing</Link>
            <Link className="transition hover:text-[var(--k-text)]" href="/about">About</Link>
          </nav>
          <Link className="k-secondary-action ml-5 min-h-10 rounded-full px-4 text-xs font-semibold" href="/login">Sign in</Link>
        </header>

        <div className="grid flex-1 gap-16 py-20 lg:grid-cols-[1.18fr_.82fr] lg:items-center lg:gap-24 lg:py-24">
          <div>
            <p className="k-kicker">Healthcare, organized around the outcome</p>
            <h1 className="mt-8 max-w-5xl text-balance text-[clamp(3.8rem,8vw,8.2rem)] font-semibold leading-[.88] tracking-[-.075em]" id="public-living-title">
              What needs<br className="hidden sm:block" /> to happen?
            </h1>
            <p className="k-muted mt-9 max-w-2xl text-base leading-8 sm:text-lg">
              Start with what you are trying to accomplish. Klinikos brings the right operating, network, learning, or care experience forward without making you learn the machinery underneath it.
            </p>

            <form className="mt-12 max-w-3xl" onSubmit={submit}>
              <label className="sr-only" htmlFor="public-klinikos-intent">Tell Klinikos what you need</label>
              <div className="k-input-shell flex items-center gap-3 rounded-2xl p-2.5">
                <Search className="ml-2 size-5 shrink-0 text-[var(--k-muted)]" />
                <input
                  className="min-w-0 flex-1 bg-transparent px-1 py-3 text-sm font-semibold outline-none sm:text-base"
                  id="public-klinikos-intent"
                  onChange={(event) => { setIntent(event.target.value); setSubmitted(false); }}
                  placeholder="I need a treatment room Saturday..."
                  value={intent}
                />
                <button className="k-primary-action size-11 shrink-0 rounded-xl" type="submit" aria-label="Find the right Klinikos starting point">
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </form>

            {result ? (
              <div className="mt-8 max-w-3xl border-y py-6 k-rule" aria-live="polite">
                {destination ? (
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="k-kicker">A good place to start</p>
                      <p className="mt-2 text-lg font-semibold">{result.outcome}</p>
                      <p className="k-muted mt-2 text-sm leading-6">Continue there. Sign-in, permissions, credentials, payment, and regulated actions are checked only when they are actually required.</p>
                    </div>
                    <Link className="k-primary-action min-h-11 shrink-0 rounded-full px-5 text-sm font-semibold" href={destination.href}>{destination.action} <ArrowRight className="size-4" /></Link>
                  </div>
                ) : (
                  <div className="text-sm leading-6">
                    <p className="font-semibold">One more detail will help.</p>
                    <p className="k-muted mt-1">{result.clarificationQuestions[0] ?? "Choose the closest starting point and continue."}</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <aside className="lg:pl-6" aria-label="Ways to enter Klinikos">
            <p className="k-kicker">Start anywhere</p>
            <div className="mt-6 divide-y divide-[var(--k-line)] border-y border-[var(--k-line)]">
              {doorwayActions.map(({ key, label, description, href, icon: Icon }) => (
                <Link className="group flex items-start gap-5 py-7" href={href} key={key}>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--k-accent)_10%,transparent)] text-[var(--k-accent)]"><Icon className="size-[18px]" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold tracking-[-.02em]">{label}</span>
                    <span className="k-muted mt-2 block text-xs leading-6">{description}</span>
                  </span>
                  <ArrowRight className="mt-1 size-4 shrink-0 text-[var(--k-muted)] transition group-hover:translate-x-1 group-hover:text-[var(--k-accent)]" />
                </Link>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold">
              <Link className="text-[var(--k-accent)] hover:underline" href="/access">Get verified evaluation access</Link>
              <a className="k-muted hover:text-[var(--k-text)]" href="#klinikos-story">See how it works</a>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

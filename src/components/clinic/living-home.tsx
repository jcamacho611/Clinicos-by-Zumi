"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, GraduationCap, HeartPulse, Search, Sparkles, Stethoscope } from "lucide-react";
import { PathRail } from "@/components/clinic/path-rail";
import { findKlinikosPathFromIntent, getKlinikosPath } from "@/lib/paths/catalog";
import type { ClinicRole } from "@/lib/auth/rbac";

const doorwayActions = [
  { label: "RUN CARE", description: "Operate or grow a clinic", href: "/front-desk", icon: Stethoscope },
  { label: "FIND WORK", description: "Join or use the healthcare network", href: "/grid", icon: BriefcaseBusiness },
  { label: "LEARN", description: "Build skills and professional capability", href: "/edu", icon: GraduationCap },
  { label: "GET CARE", description: "Find and manage healthcare", href: "/portal", icon: HeartPulse },
] as const;

const roleResumePath: Partial<Record<ClinicRole, string>> = {
  owner: "fix-referral-leakage",
  admin: "fix-referral-leakage",
  provider: "find-extra-work",
  staff: "fix-referral-leakage",
};

export function LivingHome({ role, firstName }: { role: ClinicRole; firstName: string }) {
  const [intent, setIntent] = useState("");
  const [activePathId, setActivePathId] = useState<string | null>(roleResumePath[role] ?? null);
  const activePath = useMemo(() => activePathId ? getKlinikosPath(activePathId) : null, [activePathId]);

  function submitIntent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const match = findKlinikosPathFromIntent(intent);
    setActivePathId(match?.id ?? null);
  }

  return (
    <section className="overflow-hidden rounded-[32px] border border-[#0b1e3a]/8 bg-[radial-gradient(circle_at_top_right,rgba(22,119,168,.08),transparent_32%),linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] px-5 py-8 shadow-[0_24px_80px_rgba(11,30,58,.07)] sm:px-8 sm:py-10 lg:px-12 lg:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.22em] text-[#1677a8]"><Sparkles className="size-3.5" /> Klinikos</div>
          <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-[-.055em] text-[#0b1e3a] sm:text-5xl lg:text-6xl">{activePath ? `Good morning, ${firstName}.` : "What needs to happen?"}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#0b1e3a]/58">
            {activePath ? "Klinikos keeps your goal, progress, and next action together so you can keep moving without hunting through modules." : "Tell Klinikos the outcome you want. The interface will assemble the relevant workflow across care, Grid, learning, and operations."}
          </p>
        </div>

        <form className="mx-auto mt-8 max-w-3xl" onSubmit={submitIntent}>
          <label className="sr-only" htmlFor="klinikos-intent">What are you trying to accomplish?</label>
          <div className="flex items-center gap-3 rounded-2xl border border-[#0b1e3a]/12 bg-white p-2.5 shadow-[0_16px_45px_rgba(11,30,58,.08)] focus-within:border-[#1677a8]/45 focus-within:ring-4 focus-within:ring-[#1677a8]/8">
            <Search className="ml-2 size-5 shrink-0 text-[#0b1e3a]/32" />
            <input
              className="min-w-0 flex-1 bg-transparent px-1 py-3 text-sm font-semibold text-[#0b1e3a] outline-none placeholder:text-[#0b1e3a]/32"
              id="klinikos-intent"
              onChange={(event) => setIntent(event.target.value)}
              placeholder="I need an injector Saturday..."
              value={intent}
            />
            <button className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0b1e3a] text-white transition hover:bg-[#12315a]" type="submit" aria-label="Create a Klinikos Path">
              <ArrowRight className="size-4" />
            </button>
          </div>
          {intent && !activePath ? <p className="mt-3 text-center text-[11px] text-[#0b1e3a]/48">No guided Path matched that wording yet. Use Explore Klinikos below while more intents are added.</p> : null}
        </form>

        {activePath ? (
          <div className="mx-auto mt-10 max-w-3xl rounded-[24px] border border-[#0b1e3a]/10 bg-white/90 p-5 shadow-[0_18px_50px_rgba(11,30,58,.06)] sm:p-7">
            <div className="flex flex-col gap-4 border-b border-[#0b1e3a]/8 pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#1677a8]">Your Path</p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-[-.045em] text-[#0b1e3a]">{activePath.title}</h2>
                <p className="mt-2 max-w-xl text-xs leading-6 text-[#0b1e3a]/56">{activePath.summary}</p>
              </div>
              <Link className="inline-flex items-center gap-2 text-xs font-extrabold text-[#1677a8]" href={`/paths/${activePath.id}`}>Open Path <ArrowUpRight className="size-3.5" /></Link>
            </div>
            <div className="pt-7"><PathRail nodes={activePath.nodes} /></div>
          </div>
        ) : (
          <div className="mx-auto mt-12 grid max-w-4xl gap-x-8 gap-y-7 sm:grid-cols-2">
            {doorwayActions.map(({ label, description, href, icon: Icon }) => (
              <Link className="group flex items-start gap-4 border-t border-[#0b1e3a]/10 pt-5" href={href} key={label}>
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#edf6fb] text-[#1677a8]"><Icon className="size-4.5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-extrabold tracking-[.16em] text-[#0b1e3a]">{label}</span>
                  <span className="mt-1.5 block text-xs leading-5 text-[#0b1e3a]/50">{description}</span>
                </span>
                <ArrowUpRight className="mt-1 size-4 shrink-0 text-[#0b1e3a]/24 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#1677a8]" />
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <a className="inline-flex items-center gap-2 text-xs font-extrabold text-[#0b1e3a]/58 transition hover:text-[#1677a8]" href="#explore-klinikos">Explore Klinikos <ArrowRight className="size-3.5" /></a>
        </div>
      </div>
    </section>
  );
}

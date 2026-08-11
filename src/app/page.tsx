import Link from "next/link";
import { commandSurfaces } from "@/lib/design/command-system";
import { MarketingShell, MarketingSection } from "@/components/growth/marketing-shell";
import { IntentBeacon } from "@/components/growth/intent-beacon";
import { ZumiDemonstration } from "@/components/growth/zumi-demonstration";
import { operatingProblems } from "@/lib/growth/demonstration";
import { segmentKeys, segments } from "@/lib/growth/segments";

/**
 * The Klinikos homepage.
 *
 * One promise, then the eight places clinics actually lose work, then a scripted
 * demonstration of Zumi finding them. Marketing surface, so the sequence carries the
 * argument — but no operational Zumi is reachable from here.
 */

export const metadata = {
  title: "Klinikos by Zumi — the clinic operating system",
  description:
    "See what is happening across your clinic. Find what needs action. Recover the opportunities that normally fall through the cracks.",
};

export default function HomePage() {
  return (
    <MarketingShell>
      <IntentBeacon event="homepage_viewed" path="/" />

      <section aria-labelledby="home-heading" className="border-b border-white/10">
        <div className="mx-auto grid max-w-[1500px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:items-start lg:py-24">
          <div>
            <p className={commandSurfaces.eyebrow}>Klinikos by Zumi</p>
            <h1 className={`${commandSurfaces.headline} mt-4 text-balance text-5xl leading-[.94] sm:text-6xl lg:text-7xl`} id="home-heading">
              See what is happening across your clinic. Find what needs action.
            </h1>
            <p className="mt-8 max-w-xl text-base leading-8 text-slate-300">
              Klinikos replaces the scattered software your clinic runs on and connects the healthcare
              networks it cannot replace. Zumi reads the result and tells you what is waiting on someone —
              with the records that prove it.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link className={`${commandSurfaces.interactive} inline-flex items-center border border-[#e6c55b]/40 bg-[#e6c55b]/[.09] px-5 text-sm font-extrabold text-[#f0dda0]`} href="/pricing">
                Get Klinikos
              </Link>
              <Link className={`${commandSurfaces.interactive} inline-flex items-center border border-white/15 bg-white/[.04] px-5 text-sm font-extrabold text-slate-200`} href="/demo">
                See how it works
              </Link>
            </div>
          </div>

          <ZumiDemonstration />
        </div>
      </section>

      <MarketingSection
        eyebrow="What Klinikos attacks"
        id="home-problems"
        lead="None of these is a software problem in isolation. They are all the same problem: work that lives between systems has no owner."
        title="Eight places clinics lose work."
      >
        <ul className="mt-10 grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {operatingProblems.map((problem) => (
            <li className="bg-[#05090f] p-5" key={problem.label}>
              <p className="text-[13px] font-bold leading-6 text-white">{problem.label}</p>
              <p className="mt-2 text-[11px] uppercase tracking-[.1em] text-slate-500">{problem.surface}</p>
            </li>
          ))}
        </ul>
      </MarketingSection>

      <MarketingSection eyebrow="For your clinic" id="home-segments" title="It runs differently depending on what you do.">
        <ul className="mt-10 grid gap-px bg-white/10 lg:grid-cols-3">
          {segmentKeys.map((key) => (
            <li className="bg-[#05090f] p-6 sm:p-8" key={key}>
              <h3 className={`${commandSurfaces.headline} text-xl`}>{segments[key].name}</h3>
              <p className="mt-3 text-[13px] leading-7 text-slate-400">{segments[key].lead}</p>
              <Link className="mt-5 inline-block text-[13px] font-extrabold text-[#e6c55b] underline underline-offset-4" href={`/solutions/${key}`}>
                What it costs you today
              </Link>
            </li>
          ))}
        </ul>
      </MarketingSection>

      <MarketingSection
        eyebrow="Start here"
        id="home-audit"
        lead="Most clinics start with a paid Operational Audit: a written review of where time and revenue are going today. You keep the findings whether or not you run Klinikos."
        title="Find out what it is costing you first."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className={`${commandSurfaces.interactive} inline-flex items-center border border-[#e6c55b]/40 bg-[#e6c55b]/[.09] px-5 text-sm font-extrabold text-[#f0dda0]`} href="/operational-audit">
            See the Operational Audit
          </Link>
          <Link className={`${commandSurfaces.interactive} inline-flex items-center border border-white/15 bg-white/[.04] px-5 text-sm font-extrabold text-slate-200`} href="/contact">
            Talk to Klinikos
          </Link>
        </div>
      </MarketingSection>
    </MarketingShell>
  );
}

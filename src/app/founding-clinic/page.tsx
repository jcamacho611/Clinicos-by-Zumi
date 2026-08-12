import Link from "next/link";
import { ArrowRight, Crown, Handshake, Layers3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FoundingOfferCards } from "@/components/command/founding-offer-cards";
import { clinicSubscriptionPlanning } from "@/lib/commercial/klinikos-commercial";
import {
  MissionPhaseProgress,
  ZumiBriefingPanel,
  ZumiCommandShell,
} from "@/components/command/zumi-command-shell";

export const metadata = {
  title: "Founding Clinic Qualification — Klinikos",
  description:
    "The founding pathway evaluates operational fit before implementation. Klinikos maps the real workflow first, then scope and production gates are reviewed before launch.",
};

const pathway = [
  { icon: Layers3, title: "Evaluate", body: "Map the workflow, software burden, staffing gaps, and operating cost before anything is committed." },
  { icon: Handshake, title: "Agree", body: "Define the approved scope, ownership, production gates, integrations, and manual fallbacks in writing." },
  { icon: Crown, title: "Build", body: "Launch reviewed operating slices with priority onboarding and a clear path from demo to production readiness." },
] as const;

export default function FoundingClinicPage() {
  return (
    <ZumiCommandShell>
      <section aria-labelledby="founding-heading" className="border-b border-white/10">
        <div className="mx-auto grid max-w-[1500px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:py-24">
          <div>
            <MissionPhaseProgress current="offer" />
            <p className="mt-8 text-[11px] font-extrabold uppercase tracking-[.2em] text-[#e6c55b]">Founding Clinic Qualification</p>
            <h1 className="mt-4 max-w-4xl text-balance text-5xl font-extrabold leading-[.96] tracking-[-.065em] text-white sm:text-6xl lg:text-7xl" id="founding-heading">
              Help shape the operating layer independent clinics deserve.
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-8 text-slate-300">
              Small clinics should have big-system control without big-system cost. The founding pathway shows what Klinikos can take on,
              what still depends on external rails, and what an approved launch would actually require.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="primary">
                <Link href="/sales">Start Clinic Operating Analysis <ArrowRight aria-hidden="true" className="size-4" /></Link>
              </Button>
              <Button asChild className="border border-cyan-300/25 bg-transparent text-cyan-200 hover:text-white" size="lg" variant="secondary">
                <Link href="/grid/browse">Explore Klinikos Grid</Link>
              </Button>
            </div>
          </div>

          <ZumiBriefingPanel active>
            Founding qualification starts with your operating map, not a contract. I organize the operational picture, surface the gaps,
            and prepare the next decision for review. Keep patient names, records, diagnoses, and PHI out of this qualification flow.
          </ZumiBriefingPanel>
        </div>
      </section>

      <section aria-labelledby="pathway-heading" className="border-b border-white/10" id="pathway">
        <div className="mx-auto max-w-[1500px] px-5 py-16 sm:px-8">
          <h2 className="text-[11px] font-extrabold uppercase tracking-[.18em] text-cyan-300" id="pathway-heading">The pathway</h2>
          <ol className="mt-6 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-3">
            {pathway.map((step, index) => (
              <li className="bg-[#070d15] p-7" key={step.title}>
                <p className="text-[10px] font-extrabold tracking-[.16em] text-slate-600">0{index + 1}</p>
                <step.icon aria-hidden="true" className="mt-7 size-5 text-cyan-300" />
                <h3 className="mt-5 text-sm font-extrabold text-white">{step.title}</h3>
                <p className="mt-2 text-[12px] leading-5 text-slate-400">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-16 sm:px-8">
        <FoundingOfferCards ctaHref="/sales" />

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="border border-white/10 bg-white/[.04] p-6">
            <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#e6c55b]">Payment rail</p>
            <h2 className="mt-3 text-xl font-extrabold text-white">GoDaddy checkout is available after qualification.</h2>
            <p className="mt-3 text-[12px] leading-6 text-slate-400">Klinikos first captures the clinic, buyer, selected engagement, and expected amount. The server then creates an auditable commercial checkout intent before the official GoDaddy payment rail opens. Opening checkout is never treated as proof of payment.</p>
            <Link className="mt-5 inline-flex min-h-[44px] items-center gap-2 bg-[#e6c55b] px-5 text-xs font-extrabold text-[#071019]" href="/sales">Start qualification <ArrowRight className="size-4" /></Link>
          </div>

          <div className="border border-white/10 bg-white/[.04] p-6">
            <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-cyan-300">Ongoing software</p>
            <h2 className="mt-3 text-xl font-extrabold text-white">Subscription pricing is separate from setup.</h2>
            <p className="mt-3 text-[12px] leading-6 text-slate-400">{clinicSubscriptionPlanning.note}</p>
            <Link className="mt-5 inline-flex items-center gap-2 text-xs font-extrabold text-cyan-200" href="/pricing">View current clinic pricing <ArrowRight className="size-4" /></Link>
          </div>
        </div>

        <div className="mt-10 grid gap-5 border-t border-white/10 pt-8 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-cyan-300">Production boundary</p><h2 className="mt-3 text-2xl font-extrabold tracking-[-.04em] text-white">Clear gates, not repeated fine print.</h2></div>
          <p className="text-[12px] leading-6 text-slate-400">Qualification and founding fees do not by themselves activate production PHI, certify compliance, guarantee integrations, or authorize clinical deployment. Those decisions depend on approved scope, security controls, contracts, vendor connections, and production-readiness review. The current public qualification flow is for operational and software context only.</p>
        </div>
      </section>
    </ZumiCommandShell>
  );
}
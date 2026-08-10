import Link from "next/link";
import { ArrowRight, Crown, Handshake, Layers3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FoundingOfferCards } from "@/components/command/founding-offer-cards";
import {
  HumanReviewBanner,
  MissionPhaseProgress,
  NoPHINotice,
  ZumiBriefingPanel,
  ZumiCommandShell,
} from "@/components/command/zumi-command-shell";

/**
 * Founding Clinic Qualification, under command law.
 *
 * The previous page put a full intake form directly on the marketing surface. The
 * qualification now runs through the Zumi operating analysis, and this page states
 * the pathway and the boundary rather than collecting fields inline.
 */

export const metadata = {
  title: "Founding Clinic Qualification — Klinikos by Zumi",
  description:
    "The founding pathway evaluates operational fit before any implementation commitment. Klinikos maps the real workflow first, and a human reviews every request.",
};

const pathway = [
  { icon: Layers3, title: "Evaluate", body: "Map the real workflow and cost structure before anything is committed." },
  { icon: Handshake, title: "Agree", body: "Define scope, gates, ownership, and manual fallbacks in writing." },
  { icon: Crown, title: "Build", body: "Move through reviewed slices with preferred onboarding." },
] as const;

export default function FoundingClinicPage() {
  return (
    <ZumiCommandShell>
      <section aria-labelledby="founding-heading" className="border-b border-white/10">
        <div className="mx-auto grid max-w-[1500px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:py-24">
          <div>
            <MissionPhaseProgress current="offer" />
            <p className="mt-8 text-[11px] font-extrabold uppercase tracking-[.2em] text-[#e6c55b]">Founding Clinic Qualification</p>
            <h1
              className="mt-4 max-w-4xl text-balance text-5xl font-extrabold leading-[.96] tracking-[-.065em] text-white sm:text-6xl lg:text-7xl"
              id="founding-heading"
            >
              Help shape the operating layer independent clinics deserve.
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-8 text-slate-300">
              Small clinics should have big-system control without big-system cost. The founding pathway evaluates operational fit
              before any implementation commitment, and every step ends in a human decision.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="primary">
                <Link href="/sales">Start Clinic Operating Analysis <ArrowRight aria-hidden="true" className="size-4" /></Link>
              </Button>
              <Button asChild className="border border-white/20 bg-transparent text-slate-200 hover:text-white" size="lg" variant="secondary">
                <Link href="#pathway">See the pathway</Link>
              </Button>
            </div>
          </div>

          <ZumiBriefingPanel active>
            Founding qualification starts with your operating map, not a contract. I organise what you tell me about how the clinic
            runs, then a human reviews whether Klinikos is actually a fit. Do not enter patient names, records, diagnoses, or PHI.
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
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <NoPHINotice />
          <HumanReviewBanner />
        </div>
        <p className="mt-8 max-w-4xl border-t border-white/10 pt-6 text-[11px] leading-6 text-slate-400">
          Target future pricing is around $500 per month after launch, depending on approved scope and usage. That is a target for
          planning, not a binding quote. A founding contribution does not activate production PHI use, certify compliance, guarantee
          integrations, or authorize clinical deployment. Scope, security, contracts, vendor connections, and production readiness each
          require separate human review.
        </p>
      </section>
    </ZumiCommandShell>
  );
}

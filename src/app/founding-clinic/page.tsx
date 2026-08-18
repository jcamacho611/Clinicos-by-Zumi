import Link from "next/link";
import { ArrowRight, Crown, Handshake, Layers3 } from "lucide-react";
import { Badge, Card } from "@/components/ds";
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
    "The founding pathway evaluates operational fit before implementation. Klinikos maps how your clinic actually works first, then we agree the scope and what has to be ready before launch.",
};

const pathway = [
  { icon: Layers3, title: "Evaluate", body: "Map the workflow, software burden, staffing gaps, and operating cost before anything is committed." },
  { icon: Handshake, title: "Agree", body: "Agree in writing what is in scope, who owns what, what has to be ready before launch, which connections are needed, and what happens manually until they are." },
  { icon: Crown, title: "Build", body: "Launch reviewed operating slices with priority onboarding and a clear path from qualification to production readiness." },
] as const;

export default function FoundingClinicPage() {
  return (
    <ZumiCommandShell>
      <section aria-labelledby="founding-heading" style={{ borderBottom: "var(--border-hair-dark)" }}>
        <div className="mx-auto grid max-w-[1500px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:py-24">
          <div>
            <MissionPhaseProgress current="offer" />
            <div className="mt-8"><Badge tone="mapping">Founding Clinic Qualification</Badge></div>
            <h1 className="mt-5 max-w-4xl text-balance text-5xl font-extrabold leading-[.96] tracking-[-.065em] sm:text-6xl lg:text-7xl" id="founding-heading">
              Help shape the operating layer independent clinics deserve.
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-8" style={{ color: "var(--text-secondary)" }}>
              Small clinics should have big-system control without big-system cost. The founding pathway shows what Klinikos can take on,
              what still depends on external rails, and what an approved launch would actually require.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sales"
                className="inline-flex min-h-12 items-center justify-center gap-2 px-5 text-xs font-extrabold"
                style={{ background: "var(--cyan-300)", color: "var(--obsidian)", borderRadius: "var(--radius-sm)" }}
              >
                Start Clinic Operating Analysis <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link
                href="/grid/browse"
                className="inline-flex min-h-12 items-center justify-center px-5 text-xs font-extrabold"
                style={{ color: "var(--text-primary)", border: "var(--border-hair-dark)", borderRadius: "var(--radius-sm)" }}
              >
                Explore Klinikos Grid
              </Link>
            </div>
          </div>

          <ZumiBriefingPanel active>
            Founding qualification starts with your operating map, not a contract. Klinikos Intelligence organizes the operational picture,
            surfaces the gaps, and prepares the next decision for human review. Keep patient names, records, diagnoses, and PHI out of this qualification flow.
          </ZumiBriefingPanel>
        </div>
      </section>

      <section aria-labelledby="pathway-heading" id="pathway" style={{ borderBottom: "var(--border-hair-dark)" }}>
        <div className="mx-auto max-w-[1500px] px-5 py-16 sm:px-8">
          <p className="text-[12px] font-extrabold uppercase" style={{ color: "var(--cyan-400)", letterSpacing: "var(--tracking-wider)" }}>The pathway</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight" id="pathway-heading">Three decisions before production.</h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {pathway.map((step, index) => (
              <li key={step.title}>
                <Card dark className="h-full">
                  <p className="text-[12px] font-extrabold" style={{ color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)" }}>0{index + 1}</p>
                  <step.icon aria-hidden="true" className="mt-7 size-5" style={{ color: "var(--cyan-400)" }} />
                  <h3 className="mt-5 text-base font-extrabold">{step.title}</h3>
                  <p className="mt-3 text-xs leading-6" style={{ color: "var(--text-secondary)" }}>{step.body}</p>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-16 sm:px-8">
        <FoundingOfferCards ctaHref="/sales" />

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <Card dark>
            <Badge tone="mapping">How payment works</Badge>
            <h2 className="mt-4 text-xl font-extrabold">GoDaddy checkout is available after the correct commercial intent exists.</h2>
            <p className="mt-3 text-xs leading-6" style={{ color: "var(--text-secondary)" }}>
              Klinikos records the clinic, the buyer, what you selected and the amount — the browser never sets the price — then opens the payment page. Opening or returning from it does not by itself mean you have paid — we confirm that with the payment provider.
            </p>
            <Link className="mt-5 inline-flex min-h-11 items-center gap-2 px-5 text-xs font-extrabold" href="/sales" style={{ background: "var(--gold-300)", color: "var(--obsidian)", borderRadius: "var(--radius-sm)" }}>
              Start qualification <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Card>

          <Card dark>
            <Badge tone="observing">Ongoing software</Badge>
            <h2 className="mt-4 text-xl font-extrabold">Subscription pricing is separate from implementation.</h2>
            <p className="mt-3 text-xs leading-6" style={{ color: "var(--text-secondary)" }}>{clinicSubscriptionPlanning.note}</p>
            <Link className="mt-5 inline-flex items-center gap-2 text-xs font-extrabold" href="/pricing" style={{ color: "var(--cyan-300)" }}>
              View current clinic pricing <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Card>
        </div>

        <div className="mt-10 grid gap-5 pt-8 lg:grid-cols-[.8fr_1.2fr] lg:items-start" style={{ borderTop: "var(--border-hair-dark)" }}>
          <div>
            <p className="text-[12px] font-extrabold uppercase" style={{ color: "var(--cyan-400)", letterSpacing: "var(--tracking-wider)" }}>Production boundary</p>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight">Clear gates, not repeated fine print.</h2>
          </div>
          <p className="text-xs leading-6" style={{ color: "var(--text-secondary)" }}>
            Qualification and founding fees do not by themselves activate production PHI, certify compliance, guarantee integrations, or authorize clinical deployment. Those decisions depend on approved scope, security controls, contracts, vendor connections, and production-readiness review. The current public qualification flow is for operational and software context only.
          </p>
        </div>
      </section>
    </ZumiCommandShell>
  );
}

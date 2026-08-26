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
  title: "Founding Clinic Qualification",
  description:
    "The founding pathway evaluates operational fit before implementation. Klinikos maps the real workflow first, then scope and production gates are reviewed before launch.",
};

const pathway = [
  { icon: Layers3, title: "Analyze", body: "Map the workflow, software burden, staffing gaps, and operating friction before implementation is scoped." },
  { icon: Handshake, title: "Blueprint", body: "Define the approved scope, roles, migration needs, connections, production gates, and manual fallbacks in writing." },
  { icon: Crown, title: "Implement", body: "Launch reviewed operating slices with priority onboarding and a clear path from approved scope to production readiness." },
] as const;

export default function FoundingClinicPage() {
  return (
    <ZumiCommandShell>
      <section aria-labelledby="founding-heading" style={{ borderBottom: "var(--border-hair-dark)" }}>
        <div className="mx-auto grid max-w-[1500px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:py-24">
          <div>
            <MissionPhaseProgress current="offer" />
            <div className="mt-8"><Badge tone="mapping">Founding Clinic Pathway</Badge></div>
            <h1 className="mt-5 max-w-4xl text-balance text-5xl font-extrabold leading-[.96] tracking-[-.065em] sm:text-6xl lg:text-7xl" id="founding-heading">
              Help shape the operating layer independent clinics deserve.
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-8" style={{ color: "var(--text-secondary)" }}>
              Small clinics should have big-system control without big-system cost. The founding pathway starts with a paid operating analysis,
              then moves into scoped planning and implementation only when the prior human-reviewed gate supports it.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sales"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-rose-200 px-5 text-xs font-extrabold text-slate-950 hover:bg-rose-100"
              >
                Start Clinic Operating Analysis <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 px-5 text-xs font-extrabold text-white hover:border-rose-200/35"
              >
                See current pricing
              </Link>
            </div>
          </div>

          <ZumiBriefingPanel active>
            Founding qualification starts with your operating map, not a production contract. Klinikos Intelligence organizes the operational picture,
            surfaces the gaps, and prepares each next decision for human review. Keep patient names, records, diagnoses, and PHI out of this qualification flow.
          </ZumiBriefingPanel>
        </div>
      </section>

      <section aria-labelledby="pathway-heading" id="pathway" style={{ borderBottom: "var(--border-hair-dark)" }}>
        <div className="mx-auto max-w-[1500px] px-5 py-16 sm:px-8">
          <p className="text-[12px] font-extrabold uppercase tracking-[.18em] text-rose-200">The pathway</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight" id="pathway-heading">Three reviewed stages before production.</h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {pathway.map((step, index) => (
              <li key={step.title}>
                <Card dark className="h-full">
                  <p className="text-[12px] font-extrabold" style={{ color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)" }}>0{index + 1}</p>
                  <step.icon aria-hidden="true" className="mt-7 size-5 text-rose-200" />
                  <h3 className="mt-5 text-base font-extrabold">{step.title}</h3>
                  <p className="mt-3 text-xs leading-6" style={{ color: "var(--text-secondary)" }}>{step.body}</p>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-16 sm:px-8">
        <FoundingOfferCards />

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <Card dark>
            <Badge tone="mapping">How payment works</Badge>
            <h2 className="mt-4 text-xl font-extrabold">The $500 analysis has two truthful payment modes.</h2>
            <p className="mt-3 text-xs leading-6" style={{ color: "var(--text-secondary)" }}>
              Integrated Klinikos Stripe Checkout is preferred because the buyer, amount, Checkout Session, PaymentIntent, and resulting confirmation from the payment provider can be correlated server-side. When a qualified buyer needs a direct link outside the authorized sales screen, the canonical Stripe Payment Link is a manually reconciled service-sale fallback. Coming back from the payment page is not proof you paid, and the manual service payment does not create a Klinikos software entitlement.
            </p>
            <Link className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-200 px-5 text-xs font-extrabold text-slate-950 hover:bg-amber-100" href="/sales">
              Start Clinic Operating Analysis <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Card>

          <Card dark>
            <Badge tone="observing">Ongoing software</Badge>
            <h2 className="mt-4 text-xl font-extrabold">Subscription pricing is separate from analysis and implementation.</h2>
            <p className="mt-3 text-xs leading-6" style={{ color: "var(--text-secondary)" }}>{clinicSubscriptionPlanning.note}</p>
            <Link className="mt-5 inline-flex items-center gap-2 text-xs font-extrabold text-rose-200" href="/pricing">
              View current clinic pricing <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Card>
        </div>

        <div className="mt-10 grid gap-5 pt-8 lg:grid-cols-[.8fr_1.2fr] lg:items-start" style={{ borderTop: "var(--border-hair-dark)" }}>
          <div>
            <p className="text-[12px] font-extrabold uppercase tracking-[.18em] text-rose-200">Production boundary</p>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight">Clear gates, not repeated fine print.</h2>
          </div>
          <p className="text-xs leading-6" style={{ color: "var(--text-secondary)" }}>
            Analysis, Blueprint, implementation, and subscription payments do not by themselves activate production PHI, certify compliance, guarantee integrations, or authorize clinical deployment. Those decisions depend on the independently applicable scope, security controls, contracts, vendor connections, and production-readiness review. The current public qualification flow is for operational and software context only.
          </p>
        </div>
      </section>
    </ZumiCommandShell>
  );
}

import Link from "next/link";
import { ArrowRight, Check, ShieldCheck, Sparkles } from "lucide-react";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";
import { Badge, Card, DsSurface } from "@/components/ds";
import { clinicCommercialOffers, clinicPlans, commercialAddOns } from "@/lib/commercial/klinikos-commercial";

export const metadata = {
  title: "Pricing — Klinikos",
  description: "Klinikos clinic operating system pricing, implementation, and expansion options.",
};

const plans = Object.values(clinicPlans);
const addOns = Object.values(commercialAddOns);
const implementationSteps = [
  {
    number: "01",
    eyebrow: "Understand the operation",
    offer: clinicCommercialOffers.privateWorkflowReview,
    detail: "Map the current operation, fragmentation, spend, leakage, and the highest-value Klinikos configuration before implementation begins.",
    href: "/sales",
    action: "Start the analysis",
  },
  {
    number: "02",
    eyebrow: "Design the implementation",
    offer: clinicCommercialOffers.foundingEvaluation,
    detail: "Define migration, integrations, roles, workflows, operating controls, and launch requirements before they become promises.",
    href: "/founding-clinic",
    action: "Review the founding path",
  },
  {
    number: "03",
    eyebrow: "Launch the clinic",
    offer: clinicCommercialOffers.foundingImplementation,
    detail: "Configure the approved scope, prepare migration and connection work, train the team, and move the clinic into its operating workspace.",
    href: "/founding-clinic",
    action: "See if your clinic qualifies",
  },
] as const;

export default function PricingPage() {
  return (
    <DsSurface>
      <main className="min-h-screen" style={{ background: "var(--surface-paper-2)", color: "var(--text-on-paper)" }}>
        <header style={{ background: "var(--surface-paper)", borderBottom: "var(--border-hair-light)" }}>
          <div className="mx-auto flex min-h-20 max-w-7xl items-center gap-5 px-5 sm:px-8">
            <KlinikosWordmark href="/" markClassName="h-8 w-8" textClassName="text-xs" />
            <nav className="ml-auto flex items-center gap-5" aria-label="Pricing navigation">
              <Link className="hidden text-xs font-bold underline-offset-4 hover:underline sm:inline" href="/" style={{ color: "var(--text-on-paper-dim)" }}>
                Living Home
              </Link>
              <Link className="inline-flex min-h-10 items-center gap-2 text-xs font-extrabold" href="/founding-clinic" style={{ color: "var(--accent-signal)" }}>
                See if your clinic qualifies <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </nav>
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
          <div
            className="relative overflow-hidden p-7 sm:p-10 lg:p-12"
            style={{ background: "var(--obsidian)", color: "var(--text-primary)", borderRadius: "var(--radius-lg)" }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(circle at 82% 18%, color-mix(in oklch, var(--cyan-500) 20%, transparent), transparent 30%), radial-gradient(circle at 16% 84%, color-mix(in oklch, var(--gold-500) 15%, transparent), transparent 30%)" }}
            />
            <div className="relative grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
              <div>
                <Badge tone="mapping">Commercial model</Badge>
                <h1
                  className="mt-7 max-w-5xl text-balance font-extrabold"
                  style={{ fontSize: "var(--text-h1)", letterSpacing: "var(--tracking-tight)", lineHeight: "var(--leading-tight)" }}
                >
                  Start with the operation. Expand with the value.
                </h1>
                <p className="mt-5 max-w-3xl text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
                  Klinikos combines implementation with recurring operating software. Variable external usage is customer-funded instead of hidden inside an unlimited promise. Final scope can vary by locations, providers, migration, connections, volume, and governed workflows.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <PriceSignal label="Start with" value={clinicCommercialOffers.privateWorkflowReview.priceLabel} detail={clinicCommercialOffers.privateWorkflowReview.name} />
                <PriceSignal label="Recurring software" value={clinicPlans.core.monthlyPriceLabel} detail="Klinikos Core starting anchor" />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14" aria-labelledby="implementation-heading">
          <div className="max-w-3xl">
            <p className="text-[10px] font-extrabold uppercase" style={{ color: "var(--accent-signal)", letterSpacing: "var(--tracking-wider)" }}>Before the subscription</p>
            <h2 id="implementation-heading" className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Implementation is a sequence, not a surprise fee.</h2>
            <p className="mt-4 text-sm leading-7" style={{ color: "var(--text-on-paper-dim)" }}>
              The first engagement is designed to understand what the clinic actually needs before committing to migration, connection, or launch scope.
            </p>
          </div>

          <div className="mt-8 divide-y" style={{ borderTop: "var(--border-hair-light)", borderBottom: "var(--border-hair-light)", borderColor: "var(--line-light)" }}>
            {implementationSteps.map((step) => (
              <article className="grid gap-5 py-7 lg:grid-cols-[90px_.75fr_1fr_auto] lg:items-center" key={step.offer.key}>
                <p className="text-[10px] font-extrabold" style={{ color: "var(--accent-signal)", letterSpacing: "var(--tracking-wide)" }}>{step.number}</p>
                <div>
                  <p className="text-[10px] font-extrabold uppercase" style={{ color: "var(--text-on-paper-dim)", letterSpacing: "var(--tracking-wide)" }}>{step.eyebrow}</p>
                  <h3 className="mt-2 text-xl font-extrabold">{step.offer.name}</h3>
                  <p className="mt-2 text-3xl font-extrabold tracking-tight">{step.offer.priceLabel}</p>
                </div>
                <div>
                  <p className="text-xs leading-6" style={{ color: "var(--text-on-paper-dim)" }}>{step.detail}</p>
                  <p className="mt-2 text-[10px] leading-5" style={{ color: "var(--text-on-paper-dim)" }}>{step.offer.creditForward}</p>
                </div>
                <Link className="inline-flex min-h-11 items-center gap-2 text-xs font-extrabold" href={step.href} style={{ color: "var(--accent-signal)" }}>
                  {step.action} <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-6 flex items-start gap-4 p-5" style={{ background: "var(--surface-paper)", border: "var(--border-hair-light)", borderRadius: "var(--radius-md)" }}>
            <ShieldCheck className="mt-0.5 size-5 shrink-0" style={{ color: "var(--accent-premium)" }} aria-hidden="true" />
            <p className="text-xs leading-6" style={{ color: "var(--text-on-paper-dim)" }}>
              The Clinic Operating Analysis creates a server-owned commercial intent before the configured GoDaddy payment rail opens. Returning from checkout is never payment evidence, and payment never bypasses authentication, tenant, privacy, credentialing, clinical, or human-review controls.
            </p>
          </div>
        </section>

        <section className="py-12 sm:py-16" style={{ background: "var(--surface-paper)", borderTop: "var(--border-hair-light)", borderBottom: "var(--border-hair-light)" }} aria-labelledby="plans-heading">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="max-w-3xl">
              <p className="text-[10px] font-extrabold uppercase" style={{ color: "var(--accent-signal)", letterSpacing: "var(--tracking-wider)" }}>Recurring Klinikos</p>
              <h2 id="plans-heading" className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Choose the operating depth, not a feature maze.</h2>
              <p className="mt-4 text-sm leading-7" style={{ color: "var(--text-on-paper-dim)" }}>These are the current public anchors. Final contracted scope can still vary where the clinic adds locations, providers, regulated workflows, custom connections, or materially different usage.</p>
            </div>

            <div className="mt-9 divide-y" style={{ borderTop: "var(--border-hair-light)", borderBottom: "var(--border-hair-light)", borderColor: "var(--line-light)" }}>
              {plans.map((plan, index) => (
                <article className="grid gap-6 py-8 xl:grid-cols-[.62fr_.82fr_1.15fr_auto] xl:items-start" key={plan.key}>
                  <div>
                    <Badge tone={index === 0 ? "mapping" : "neutral"}>{index === 0 ? "Starting point" : plan.name}</Badge>
                    <h3 className="mt-4 text-2xl font-extrabold tracking-tight">{plan.name}</h3>
                    <p className="mt-3 text-4xl font-extrabold tracking-tight">{plan.monthlyPriceLabel}</p>
                    <p className="mt-2 text-[10px] leading-5" style={{ color: "var(--text-on-paper-dim)" }}>{plan.annualPriceLabel} · {plan.annualSavingsLabel}</p>
                  </div>

                  <div>
                    <p className="text-[10px] font-extrabold uppercase" style={{ color: "var(--text-on-paper-dim)", letterSpacing: "var(--tracking-wide)" }}>Best fit</p>
                    <p className="mt-3 text-xs leading-6" style={{ color: "var(--text-on-paper-dim)" }}>{plan.idealFor}</p>
                    <p className="mt-5 text-xs font-extrabold">Implementation {plan.implementationPriceLabel}</p>
                  </div>

                  <div>
                    <p className="text-[10px] font-extrabold uppercase" style={{ color: "var(--text-on-paper-dim)", letterSpacing: "var(--tracking-wide)" }}>Included operating scope</p>
                    <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                      {plan.includes.map((item) => (
                        <li className="flex items-start gap-2 text-xs leading-5" key={item} style={{ color: "var(--text-on-paper-dim)" }}>
                          <Check className="mt-0.5 size-3.5 shrink-0" style={{ color: "var(--accent-signal)" }} aria-hidden="true" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link className="inline-flex min-h-11 items-center gap-2 text-xs font-extrabold" href="/founding-clinic" style={{ color: "var(--accent-signal)" }}>
                    Qualify this plan <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16" aria-labelledby="addons-heading">
          <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr]">
            <div className="lg:sticky lg:top-8 lg:h-fit">
              <Badge tone="observing"><Sparkles className="size-3" aria-hidden="true" /> Add only when useful</Badge>
              <h2 id="addons-heading" className="mt-5 text-3xl font-extrabold tracking-tight">Expand only where it creates value.</h2>
              <p className="mt-4 text-sm leading-7" style={{ color: "var(--text-on-paper-dim)" }}>
                Intelligence, revenue, network, premium connections, and usage stay visible as separate economics instead of quietly inflating every clinic plan.
              </p>
            </div>

            <div className="divide-y" style={{ borderTop: "var(--border-hair-light)", borderBottom: "var(--border-hair-light)", borderColor: "var(--line-light)" }}>
              {addOns.map((addOn) => (
                <article className="grid gap-3 py-6 sm:grid-cols-[1fr_auto] sm:items-start" key={addOn.name}>
                  <div>
                    <h3 className="text-sm font-extrabold">{addOn.name}</h3>
                    {"setupLabel" in addOn ? <p className="mt-2 text-[10px]" style={{ color: "var(--text-on-paper-dim)" }}>{addOn.setupLabel}</p> : null}
                    {"rule" in addOn ? <p className="mt-2 max-w-2xl text-xs leading-6" style={{ color: "var(--text-on-paper-dim)" }}>{addOn.rule}</p> : null}
                  </div>
                  <p className="text-lg font-extrabold" style={{ color: "var(--accent-signal)" }}>{addOn.priceLabel}</p>
                </article>
              ))}
            </div>
          </div>

          <Card className="mt-10">
            <div className="flex items-start gap-4">
              <ShieldCheck className="mt-0.5 size-5 shrink-0" style={{ color: "var(--accent-premium)" }} aria-hidden="true" />
              <div>
                <p className="text-sm font-extrabold">Commercial access never becomes clinical or integration authority.</p>
                <p className="mt-2 text-xs leading-6" style={{ color: "var(--text-on-paper-dim)" }}>
                  Paid integrations remain pending until their real external connection is ready. Variable vendor/API usage must be covered by an included allowance, prepaid customer funds, or explicitly authorized bounded overage before execution.
                </p>
              </div>
            </div>
          </Card>
        </section>
      </main>
    </DsSurface>
  );
}

function PriceSignal({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="p-5" style={{ background: "var(--surface-raised)", border: "var(--border-hair-dark)", borderRadius: "var(--radius-md)" }}>
      <p className="text-[10px] font-extrabold uppercase" style={{ color: "var(--cyan-400)", letterSpacing: "var(--tracking-wide)" }}>{label}</p>
      <p className="mt-3 text-3xl font-extrabold tracking-tight">{value}</p>
      <p className="mt-2 text-[10px] leading-5" style={{ color: "var(--text-secondary)" }}>{detail}</p>
    </div>
  );
}

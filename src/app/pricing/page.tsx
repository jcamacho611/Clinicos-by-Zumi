import Link from "next/link";
import { ArrowRight, Check, ShieldCheck, Sparkles } from "lucide-react";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";
import { Badge, Card, DsSurface } from "@/components/ds";
import {
  capacityPlans,
  clinicPlans,
  commercialAddOns,
  commercialFabricPrinciples,
  eduPlans,
  professionalPlans,
  serviceCommercialRule,
  serviceEngagements,
} from "@/lib/commercial/klinikos-commercial";

export const metadata = {
  title: "Commercial capabilities — Klinikos",
  description: "Explore Klinikos subscriptions, professional and Grid products, EDU, intelligence, revenue, network, services, usage, and enterprise paths. Paid capability follows additional economic value.",
};

const clinicPlanCards = [
  clinicPlans.core,
  clinicPlans.growth,
  clinicPlans.scale,
  clinicPlans.enterprise,
] as const;

const fabricGroups = [
  {
    title: "Professionals",
    body: "Identity and professional operating capability. Payment never creates a credential, license, scope of practice, or authority.",
    items: [
      [professionalPlans.free.name, professionalPlans.free.monthlyPriceLabel],
      [professionalPlans.pro.name, professionalPlans.pro.monthlyPriceLabel],
      [professionalPlans.business.name, professionalPlans.business.monthlyPriceLabel],
      [professionalPlans.launch.name, professionalPlans.launch.priceLabel],
    ],
  },
  {
    title: "Grid & capacity",
    body: "Commercial capability around real capacity and work. Legitimate free participation remains available where liquidity requires it.",
    items: [
      [capacityPlans.host.name, capacityPlans.host.monthlyPriceLabel],
      [capacityPlans.employer.name, capacityPlans.employer.monthlyPriceLabel],
      [capacityPlans.partner.name, capacityPlans.partner.monthlyPriceLabel],
    ],
  },
  {
    title: "EDU & workforce",
    body: "Learning, simulation, competency evidence, and placement operations. Training is not licensure and paid access does not guarantee placement.",
    items: [
      [eduPlans.free.name, eduPlans.free.priceLabel],
      [eduPlans.plus.name, eduPlans.plus.priceLabel],
      [eduPlans.course.name, eduPlans.course.priceLabel],
      [eduPlans.pathway.name, eduPlans.pathway.priceLabel],
      [eduPlans.placementOS.name, eduPlans.placementOS.priceLabel],
    ],
  },
  {
    title: "Intelligence, revenue & network",
    body: "Add capabilities when the operating evidence supports the economic case. Each remains subject to its own authority and production gates.",
    items: [
      [commercialAddOns.trustOperations.name, commercialAddOns.trustOperations.priceLabel],
      [commercialAddOns.intelligencePlus.name, commercialAddOns.intelligencePlus.priceLabel],
      [commercialAddOns.revenueOS.name, commercialAddOns.revenueOS.priceLabel],
      [commercialAddOns.network.name, commercialAddOns.network.priceLabel],
      [commercialAddOns.premiumConnections.name, commercialAddOns.premiumConnections.priceLabel],
      [commercialAddOns.usagePacks.name, commercialAddOns.usagePacks.priceLabel],
    ],
  },
] as const;

const serviceCards = Object.values(serviceEngagements);

export default function PricingPage() {
  return (
    <DsSurface>
      <main className="min-h-screen" style={{ background: "var(--surface-paper-2)", color: "var(--text-on-paper)" }}>
        <header style={{ background: "var(--surface-paper)", borderBottom: "var(--border-hair-light)" }}>
          <div className="mx-auto flex min-h-20 max-w-7xl items-center gap-5 px-5 sm:px-8">
            <KlinikosWordmark href="/" markClassName="h-8 w-8" textClassName="h-[18px] w-[160px]" />
            <nav className="ml-auto flex items-center gap-5" aria-label="Commercial navigation">
              <Link className="hidden text-xs font-bold underline-offset-4 hover:underline sm:inline" href="/start" style={{ color: "var(--text-on-paper-dim)" }}>Choose an entry</Link>
              <Link className="inline-flex min-h-10 items-center gap-2 text-xs font-extrabold" href="/sales" style={{ color: "var(--accent-signal)" }}>Get a first useful result <ArrowRight className="size-3.5" aria-hidden="true" /></Link>
            </nav>
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
          <div className="relative overflow-hidden p-7 sm:p-10 lg:p-12" style={{ background: "var(--obsidian)", color: "var(--text-primary)", borderRadius: "var(--radius-lg)" }}>
            <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 82% 18%, color-mix(in oklch, var(--cyan-500) 20%, transparent), transparent 30%), radial-gradient(circle at 16% 84%, color-mix(in oklch, var(--gold-500) 15%, transparent), transparent 30%)" }} />
            <div className="relative grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
              <div>
                <Badge tone="mapping">Commercial fabric</Badge>
                <h1 className="mt-7 max-w-5xl text-balance font-extrabold" style={{ fontSize: "var(--text-h1)", letterSpacing: "var(--tracking-tight)", lineHeight: "var(--leading-tight)" }}>Start with useful value. Add only what earns its place.</h1>
                <p className="mt-5 max-w-3xl text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
                  Klinikos does not force every customer through one package sequence. Start with the outcome and unfinished work, establish a first useful result, then select the appropriate subscription, service, deployment, Grid, EDU, Revenue, Network, usage, or enterprise capability only when additional economic value supports it.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[.04] p-6">
                <Sparkles className="size-5 text-cyan-300" aria-hidden="true" />
                <p className="mt-4 text-sm font-extrabold">Commercial boundary</p>
                <p className="mt-3 text-xs leading-6" style={{ color: "var(--text-secondary)" }}>{commercialFabricPrinciples.freePaidBoundary}</p>
                <p className="mt-3 text-[11px] leading-5" style={{ color: "var(--text-secondary)" }}>Payment never creates identity, eligibility, clinical or professional authority, tenant permission, referral priority, or production truth.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8" aria-labelledby="clinic-plans-heading">
          <div className="max-w-3xl"><Badge tone="observing">Clinic subscriptions</Badge><h2 className="mt-4 text-3xl font-extrabold tracking-[-.05em]" id="clinic-plans-heading">Recurring software for the operation you actually need.</h2><p className="mt-4 text-sm leading-7" style={{ color: "var(--text-on-paper-dim)" }}>Deployment, migration, integrations, regulated workflows, usage, and enterprise governance are scoped independently rather than hidden inside a mandatory implementation step.</p></div>
          <div className="mt-8 grid gap-5 lg:grid-cols-4">
            {clinicPlanCards.map((plan) => (
              <Card key={plan.key} className="flex h-full flex-col">
                <h3 className="text-lg font-extrabold">{plan.name}</h3>
                <p className="mt-4 text-3xl font-extrabold">{plan.monthlyPriceLabel}</p>
                <p className="mt-2 text-xs" style={{ color: "var(--text-on-paper-dim)" }}>{plan.annualPriceLabel}</p>
                <p className="mt-5 text-xs leading-6" style={{ color: "var(--text-on-paper-dim)" }}>{plan.idealFor}</p>
                <ul className="mt-6 grid gap-3">{plan.includes.map((item) => <li className="flex gap-2 text-xs" key={item}><Check className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />{item}</li>)}</ul>
                <p className="mt-6 border-t pt-4 text-[11px] leading-5" style={{ borderColor: "var(--line-light)", color: "var(--text-on-paper-dim)" }}>{plan.implementationPriceLabel}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8" aria-labelledby="fabric-heading">
          <div className="max-w-3xl"><Badge tone="neutral">One company, multiple economic engines</Badge><h2 className="mt-4 text-3xl font-extrabold tracking-[-.05em]" id="fabric-heading">Capability follows the job to be done.</h2></div>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {fabricGroups.map((group) => <Card key={group.title}><h3 className="text-lg font-extrabold">{group.title}</h3><p className="mt-3 text-xs leading-6" style={{ color: "var(--text-on-paper-dim)" }}>{group.body}</p><dl className="mt-6 grid gap-3">{group.items.map(([name, price]) => <div className="flex items-center justify-between gap-4 border-t pt-3" style={{ borderColor: "var(--line-light)" }} key={name}><dt className="text-xs font-bold">{name}</dt><dd className="text-xs font-extrabold">{price}</dd></div>)}</dl></Card>)}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8" aria-labelledby="services-heading">
          <div className="max-w-3xl"><Badge tone="mapping">Scoped services</Badge><h2 className="mt-4 text-3xl font-extrabold tracking-[-.05em]" id="services-heading">Independent engagements—not stages in a funnel.</h2><p className="mt-4 text-sm leading-7" style={{ color: "var(--text-on-paper-dim)" }}>{serviceCommercialRule}</p></div>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{serviceCards.map((service) => <Card key={service.key}><h3 className="text-base font-extrabold">{service.name}</h3><p className="mt-3 text-2xl font-extrabold">{service.priceLabel}</p><p className="mt-4 text-xs leading-6" style={{ color: "var(--text-on-paper-dim)" }}>{service.idealFor}</p></Card>)}</div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-20 pt-10 sm:px-8">
          <div className="grid gap-6 rounded-[32px] p-7 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center" style={{ background: "var(--obsidian)", color: "var(--text-primary)" }}>
            <div><div className="flex items-center gap-2 text-xs font-extrabold text-amber-200"><ShieldCheck className="size-4" aria-hidden="true" />Governed commercial truth</div><h2 className="mt-4 text-2xl font-extrabold">Not sure what fits? Do not buy a package just to find out.</h2><p className="mt-3 max-w-3xl text-xs leading-6" style={{ color: "var(--text-secondary)" }}>Start with the unfinished work. Klinikos can establish a first useful result before a human recommends any paid expansion.</p></div>
            <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-xs font-extrabold text-slate-950 hover:bg-cyan-100" href="/sales">Start with first value <ArrowRight className="size-4" aria-hidden="true" /></Link>
          </div>
        </section>
      </main>
    </DsSurface>
  );
}

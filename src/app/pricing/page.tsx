import Link from "next/link";
import { commandSurfaces } from "@/lib/design/command-system";
import { MarketingShell, MarketingSection } from "@/components/growth/marketing-shell";
import { IntentBeacon } from "@/components/growth/intent-beacon";
import { AUDIT_FIRST_NOTICE, formatPlanPrice, plans, PRICING_BOUNDARY_NOTICE } from "@/lib/growth/pricing";

/**
 * Pricing.
 *
 * Built around buying. The entry plan carries a real number, because a small clinic
 * asked to book a call to learn a price usually just leaves.
 *
 * Every card states what the plan does not include. Those are the assumptions a
 * healthcare buyer makes by default, and letting them stand until the contract is how
 * a sale becomes a dispute.
 */

export const metadata = {
  title: "Pricing — Klinikos by Zumi",
  description: "What Klinikos costs, what every plan includes, and what no plan includes.",
};

export default function PricingPage() {
  return (
    <MarketingShell>
      <IntentBeacon event="pricing_viewed" path="/pricing" />

      <section aria-labelledby="pricing-heading" className="border-b border-white/10">
        <div className="mx-auto max-w-[1500px] px-5 py-16 sm:px-8 lg:py-24">
          <p className={commandSurfaces.eyebrow}>Pricing</p>
          <h1 className={`${commandSurfaces.headline} mt-4 max-w-3xl text-balance text-5xl leading-[.96] sm:text-6xl`} id="pricing-heading">
            One system, one bill, and a number you can see without a phone call.
          </h1>
          <p className="mt-8 max-w-2xl text-base leading-8 text-slate-300">
            Klinikos is priced to replace several operational subscriptions rather than sit alongside them.
          </p>

          <ul className="mt-12 grid gap-px bg-white/10 lg:grid-cols-3">
            {plans.map((plan) => (
              <li className={`bg-[#05090f] p-6 sm:p-8 ${plan.emphasis ? "ring-1 ring-inset ring-[#e6c55b]/30" : ""}`} key={plan.key}>
                {plan.emphasis && <p className={commandSurfaces.eyebrow}>Most clinics start here</p>}
                <h2 className={`${commandSurfaces.headline} mt-2 text-2xl`}>{plan.name}</h2>
                <p className="mt-2 text-[13px] leading-6 text-slate-400">{plan.tagline}</p>

                <p className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold tabular-nums tracking-[-.05em] text-white">{formatPlanPrice(plan)}</span>
                  <span className="text-[12px] text-slate-500">{plan.priceNote}</span>
                </p>

                <Link
                  className={`${commandSurfaces.interactive} mt-6 inline-flex w-full items-center justify-center border px-5 text-sm font-extrabold ${
                    plan.emphasis
                      ? "border-[#e6c55b]/40 bg-[#e6c55b]/[.09] text-[#f0dda0]"
                      : "border-white/15 bg-white/[.04] text-slate-200"
                  }`}
                  href={plan.cta.href}
                >
                  {plan.cta.label}
                </Link>

                <h3 className="mt-8 text-[11px] font-extrabold uppercase tracking-[.14em] text-slate-500">Included</h3>
                <ul className="mt-3 grid gap-1.5">
                  {plan.includes.map((item) => (
                    <li className="text-[12px] leading-6 text-slate-300" key={item}>{item}</li>
                  ))}
                </ul>

                <h3 className="mt-6 text-[11px] font-extrabold uppercase tracking-[.14em] text-rose-300">Not included, in any plan</h3>
                <ul className="mt-3 grid gap-1.5">
                  {plan.doesNotInclude.map((item) => (
                    <li className="text-[12px] leading-6 text-slate-400" key={item}>{item}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <MarketingSection eyebrow="Before you switch" id="pricing-audit" title="Start with the audit." lead={AUDIT_FIRST_NOTICE}>
        <Link className={`${commandSurfaces.interactive} mt-8 inline-flex items-center border border-[#e6c55b]/40 bg-[#e6c55b]/[.09] px-5 text-sm font-extrabold text-[#f0dda0]`} href="/operational-audit">
          See the Operational Audit
        </Link>
      </MarketingSection>

      <MarketingSection eyebrow="What a subscription is" id="pricing-boundary" title="What you are buying, stated plainly.">
        <p className={`${commandSurfaces.panelBoundary} mt-8 max-w-3xl p-5 text-[13px] leading-7 text-slate-200`}>{PRICING_BOUNDARY_NOTICE}</p>
      </MarketingSection>
    </MarketingShell>
  );
}

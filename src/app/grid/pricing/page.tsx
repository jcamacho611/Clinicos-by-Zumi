import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import {
  GRID_FEE_POLICY,
  GRID_MEMBERSHIP,
  gridPolicyHasCounselClearance,
} from "@/lib/commercial/grid-economics";

export const metadata = {
  title: "Grid pricing — Klinikos",
  description:
    "Listing, searching and declining on Grid are free. Any transaction fee is resource-class specific and becomes active only through reviewed server-owned policy.",
};

/**
 * Participation pricing comes from one canonical object. Transaction economics are
 * different: a business proposal is not a live charge, and browser copy is never fee
 * authority. Persisted server-owned policy remains the settlement authority.
 */
function feeSummary(policy: (typeof GRID_FEE_POLICY)[number]) {
  if (policy.feeModel === "none") return "No platform fee";
  if (!gridPolicyHasCounselClearance(policy)) return "Not active — review required";
  if (policy.feeModel === "fixed_per_transaction") {
    return `$${((policy.fixedFeeCents ?? 0) / 100).toFixed(0)} per completed match`;
  }
  return `${(policy.percentBps ?? 0) / 100}% of the completed transaction`;
}

function reviewLabel(policy: (typeof GRID_FEE_POLICY)[number]) {
  if (policy.feeModel === "none" || gridPolicyHasCounselClearance(policy)) return null;
  return policy.legalReview === "business_draft"
    ? "Business draft · not active"
    : "Counsel review required";
}

// Rendered from the canonical object rather than a hand-picked list, so a tier added
// there reaches the public page instead of being silently left off it.
const membership = Object.values(GRID_MEMBERSHIP);

export default function GridPricingPage() {
  // No bg-* utility on the <main> on purpose. `grid-marble-surface` owns the light
  // background/text contract and avoids the legacy conversion layer fighting it.
  return (
    <main className="grid-marble-surface min-h-screen">
      <header className="border-b border-[#e2e6ea] bg-white">
        <div className="mx-auto flex h-20 max-w-[1200px] items-center justify-between px-5 sm:px-8">
          <Link className="flex items-center gap-3" href="/grid"><BrandMark /><span className="text-sm font-semibold text-[#0b1220]">Grid</span></Link>
          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#334155] hover:text-[#0b1220]" href="/grid">
            <ArrowLeft aria-hidden="true" className="size-4" />Back to Grid
          </Link>
        </div>
      </header>

      <section className="border-b border-[#dfe3e8] bg-white">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8">
          <p className="text-[12px] font-bold uppercase tracking-[.2em] text-[#0f766e]">Grid pricing</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-.03em] text-[#0b1220] sm:text-5xl">
            Free to list. Free to search. Free to say no.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#334155]">
            Participation stays low-friction while Grid builds real supply and demand. Transaction economics are
            handled by resource class, and a proposed fee does not become a live charge until required review and
            server-side policy gates are complete.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 py-14 sm:px-8">
        <h2 className="text-2xl font-semibold tracking-[-.02em] text-[#0b1220]">Taking part</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {membership.map((tier) => (
            <article className="flex flex-col rounded-2xl border border-[#dfe3e8] bg-white p-6" key={tier.key}>
              <h3 className="text-base font-semibold text-[#0b1220]">{tier.name}</h3>
              <p className="mt-2 text-2xl font-semibold tracking-[-.03em] text-[#0b1220]">{tier.priceLabel}</p>
              <p className="mt-2 text-[13px] leading-6 text-[#475569]">{tier.audience}</p>
              <ul className="mt-4 space-y-2 text-[13px] leading-6 text-[#334155]">
                {tier.includes.map((item) => <li key={item}>· {item}</li>)}
              </ul>
            </article>
          ))}
        </div>

        <h2 className="mt-16 text-2xl font-semibold tracking-[-.02em] text-[#0b1220]">
          Transaction-fee status by resource class
        </h2>
        <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[#334155]">
          Healthcare marketplace economics can change with what is exchanged, the parties, jurisdiction,
          payer rules and professional-practice restrictions. Fee-bearing proposals shown as drafts are not
          active charges. Patient-care and referral routing carry no Grid platform fee under the current policy.
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#cbd5e1]">
                <th className="py-3 pr-4 text-[12px] font-bold uppercase tracking-[.12em] text-[#475569]">What is exchanged</th>
                <th className="py-3 pr-4 text-[12px] font-bold uppercase tracking-[.12em] text-[#475569]">Current fee status</th>
                <th className="py-3 text-[12px] font-bold uppercase tracking-[.12em] text-[#475569]">Commercial rationale</th>
              </tr>
            </thead>
            <tbody>
              {GRID_FEE_POLICY.map((policy) => {
                const label = reviewLabel(policy);
                return (
                  <tr className="border-b border-[#e2e8f0] align-top" key={policy.resourceClass}>
                    <td className="py-4 pr-4">
                      <p className="text-sm font-semibold text-[#0b1220]">{policy.label}</p>
                      <p className="mt-1 text-[13px] leading-6 text-[#475569]">{policy.whatIsExchanged}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="text-sm font-semibold text-[#0b1220]">{feeSummary(policy)}</p>
                      {label ? (
                        <p className="mt-1 inline-flex rounded-full border border-[#d97706] bg-[#fffbeb] px-2 py-0.5 text-[11px] font-semibold text-[#78350f]">
                          {label}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-4 text-[13px] leading-6 text-[#475569]">{policy.rationale}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-10 rounded-2xl border border-[#dfe3e8] bg-white p-6">
          <ShieldCheck aria-hidden="true" className="size-5 text-[#0f766e]" />
          <h3 className="mt-3 text-lg font-semibold text-[#0b1220]">A pricing idea is not a production charge</h3>
          <p className="mt-2 max-w-3xl text-[14px] leading-7 text-[#334155]">
            Klinikos settles money from active server-owned policy, not from browser copy or a planning constant.
            Fee-bearing Grid economics remain inactive until required review is evidenced and the corresponding
            production policy is deliberately activated. Nothing on this page can create or change a charge.
          </p>
          <Link className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0f766e] hover:text-[#115e59]" href="/grid">
            Open Grid <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

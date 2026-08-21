import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { GRID_FEE_POLICY, GRID_MEMBERSHIP } from "@/lib/commercial/grid-economics";

export const metadata = {
  title: "Grid pricing — Klinikos",
  description:
    "Listing and searching Grid are free. Klinikos earns a fee only when a transaction completes, and the "
    + "fee depends on what was exchanged.",
};

/**
 * Grid pricing, from one source.
 *
 * This page and /klinikos previously read from two different constants and advertised
 * two different prices for the same product — Grid Pro was $49 on one and $39 on the
 * other. Both now read `GRID_MEMBERSHIP`, so a contradiction between two public pages
 * would require editing one file twice.
 *
 * The fee table is rendered from the policy declarations rather than a hand-written
 * sentence, including the classes Klinikos does not charge for. Showing "no fee — under
 * legal review" is better commercially than hiding it: a clinic that asks whether we
 * take a cut of patient care deserves to see the answer without asking, and a
 * marketplace that quietly took one would be a much bigger problem than an awkward row
 * in a table.
 */

function feeSummary(policy: (typeof GRID_FEE_POLICY)[number]) {
  if (policy.legalReview === "requires_legal_review") {
    return policy.feeModel === "none" ? "No platform fee" : "No platform fee yet";
  }
  if (policy.feeModel === "none") return "No platform fee";
  if (policy.feeModel === "fixed_per_transaction") {
    return `$${((policy.fixedFeeCents ?? 0) / 100).toFixed(0)} per completed match`;
  }
  return `${(policy.percentBps ?? 0) / 100}% of the completed transaction`;
}

const membership = [
  GRID_MEMBERSHIP.individualFree,
  GRID_MEMBERSHIP.individualPro,
  GRID_MEMBERSHIP.organizationFree,
  GRID_MEMBERSHIP.organizationPro,
];

export default function GridPricingPage() {
  return (
    <main className="grid-marble-surface min-h-screen bg-[#f7f8fa] text-[#0b1220]">
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
            Klinikos earns when a transaction actually completes, and what it earns depends on what was
            exchanged. A room is not a clinician, and the two are not priced the same way.
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
          What Klinikos earns on a completed transaction
        </h2>
        <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[#334155]">
          Healthcare puts real limits on what a marketplace may take a share of. Rules on fee splitting,
          corporate practice of medicine and patient referrals differ by state and do not apply the same way to
          an empty treatment room as they do to patient care. So each class is priced on its own terms, and the
          classes still under review earn nothing.
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#cbd5e1]">
                <th className="py-3 pr-4 text-[12px] font-bold uppercase tracking-[.12em] text-[#475569]">What is exchanged</th>
                <th className="py-3 pr-4 text-[12px] font-bold uppercase tracking-[.12em] text-[#475569]">Klinikos fee</th>
                <th className="py-3 text-[12px] font-bold uppercase tracking-[.12em] text-[#475569]">Why</th>
              </tr>
            </thead>
            <tbody>
              {GRID_FEE_POLICY.map((policy) => (
                <tr className="border-b border-[#e2e8f0] align-top" key={policy.resourceClass}>
                  <td className="py-4 pr-4">
                    <p className="text-sm font-semibold text-[#0b1220]">{policy.label}</p>
                    <p className="mt-1 text-[13px] leading-6 text-[#475569]">{policy.whatIsExchanged}</p>
                  </td>
                  <td className="py-4 pr-4">
                    <p className="text-sm font-semibold text-[#0b1220]">{feeSummary(policy)}</p>
                    {policy.legalReview === "requires_legal_review" ? (
                      <p className="mt-1 inline-flex rounded-full border border-[#f59e0b] px-2 py-0.5 text-[11px] font-semibold text-[#92400e]">
                        Under legal review
                      </p>
                    ) : null}
                  </td>
                  <td className="py-4 text-[13px] leading-6 text-[#475569]">{policy.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 rounded-2xl border border-[#dfe3e8] bg-white p-6">
          <ShieldCheck aria-hidden="true" className="size-5 text-[#0f766e]" />
          <h3 className="mt-3 text-lg font-semibold text-[#0b1220]">Fees are decided on the server, never in a browser</h3>
          <p className="mt-2 max-w-3xl text-[14px] leading-7 text-[#334155]">
            What a transaction owes is resolved from the stored fee policy at settlement time, and a completed
            transaction with no active policy does not settle at all. Nothing about the page you are reading
            can change what is charged.
          </p>
          <Link className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0f766e] hover:text-[#115e59]" href="/grid">
            Open Grid <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

import { commandSurfaces } from "@/lib/design/command-system";
import { MarketingShell, MarketingSection } from "@/components/growth/marketing-shell";
import { IntentBeacon } from "@/components/growth/intent-beacon";
import { AuditCheckout } from "@/components/growth/audit-checkout";
import {
  AUDIT_INDEPENDENCE_NOTICE,
  AUDIT_PAYMENT_NOTICE,
  auditCheckoutUrl,
  auditDeliverables,
  auditPriceBands,
} from "@/lib/growth/audit-checkout";

/**
 * The Operational Audit.
 *
 * The first thing a clinic can buy, and the one that requires no vendor integration to
 * deliver. Prices are published rather than quoted, and the page says what the review
 * produces rather than describing how thorough it is.
 */

export const metadata = {
  title: "Klinikos Operational Audit",
  description:
    "A paid review of where your clinic is losing time, patients, and revenue today — and what it would take to change that. You keep the findings either way.",
};

export default function OperationalAuditPage() {
  return (
    <MarketingShell>
      <IntentBeacon event="audit_viewed" path="/operational-audit" />

      <section aria-labelledby="audit-heading" className="border-b border-white/10">
        <div className="mx-auto grid max-w-[1500px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:py-24">
          <div>
            <p className={commandSurfaces.eyebrow}>Klinikos Operational Audit</p>
            <h1 className={`${commandSurfaces.headline} mt-4 max-w-3xl text-balance text-5xl leading-[.96] sm:text-6xl`} id="audit-heading">
              Before you change your software, find out what it is actually costing you.
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-8 text-slate-300">
              A structured review of how work moves through your clinic: what arrives, what gets answered,
              what is opened and never closed, and what that is worth in a year.
            </p>
            <p className={`${commandSurfaces.panelReview} mt-8 max-w-xl p-4 text-[13px] leading-6 text-slate-200`}>
              {AUDIT_INDEPENDENCE_NOTICE}
            </p>
          </div>

          <AuditCheckout checkoutUrl={auditCheckoutUrl()} />
        </div>
      </section>

      <MarketingSection eyebrow="What you receive" id="audit-deliverables" title="Nine deliverables, not a conversation.">
        <ol className="mt-10 grid gap-px bg-white/10 sm:grid-cols-2">
          {auditDeliverables.map((item, index) => (
            <li className="flex gap-4 bg-[#05090f] p-5" key={item}>
              <span className="text-sm font-extrabold tabular-nums text-[#e6c55b]">{String(index + 1).padStart(2, "0")}</span>
              <span className="text-[13px] leading-6 text-slate-200">{item}</span>
            </li>
          ))}
        </ol>
      </MarketingSection>

      <MarketingSection
        eyebrow="Price"
        id="audit-price"
        lead="The price depends on how many providers there are to review, because that is what drives the work. It is published here rather than quoted on a call."
        title="What it costs."
      >
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[420px] border border-white/10 text-left text-sm">
            <caption className="sr-only">Operational Audit price by clinic size</caption>
            <thead className="bg-white/[.04] text-[11px] uppercase tracking-[.1em] text-slate-400">
              <tr>
                <th className="px-4 py-3 font-extrabold" scope="col">Clinic size</th>
                <th className="px-4 py-3 text-right font-extrabold" scope="col">Audit</th>
              </tr>
            </thead>
            <tbody>
              {auditPriceBands.map((band) => (
                <tr className="border-t border-white/10" key={band.providers}>
                  <th className="px-4 py-3 font-semibold text-slate-200" scope="row">{band.label}</th>
                  <td className="px-4 py-3 text-right font-extrabold tabular-nums text-white">
                    ${band.priceUsd.toLocaleString("en-US")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={`${commandSurfaces.panelBoundary} mt-8 max-w-3xl p-5 text-[13px] leading-7 text-slate-200`}>{AUDIT_PAYMENT_NOTICE}</p>
      </MarketingSection>
    </MarketingShell>
  );
}

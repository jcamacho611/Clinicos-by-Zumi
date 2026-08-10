import { ArrowRight, Banknote, Compass, TriangleAlert } from "lucide-react";
import type { OperatingSignal, OperatingSignalSummary } from "@/lib/sales/zumi-command";

/**
 * The live operating map and its analysis panels.
 *
 * Every status is derived from what the operator reported, and the copy says so.
 * Nothing here claims Klinikos measured the clinic.
 */

const statusPresentation: Record<OperatingSignal["status"], { label: string; className: string }> = {
  attention: { label: "Needs attention", className: "border-rose-400/40 bg-rose-500/[.08] text-rose-200" },
  review: { label: "Review", className: "border-[#e6c55b]/40 bg-[#e6c55b]/[.08] text-[#f0dda0]" },
  stable: { label: "Not reported", className: "border-white/15 bg-white/[.03] text-slate-400" },
};

export function OperatingMapPanel({ signals }: { signals: OperatingSignal[] }) {
  return (
    <section aria-labelledby="operating-map-heading">
      <h2 className="text-[11px] font-extrabold uppercase tracking-[.18em] text-cyan-300" id="operating-map-heading">
        Live Clinic Operating Map
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Built from your answers as you go. Status reflects what you reported, not a measurement of your clinic.
      </p>

      <ul className="mt-6 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2">
        {signals.map((signal) => {
          const presentation = statusPresentation[signal.status];
          return (
            <li className="bg-[#070d15] p-5" key={signal.key}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-extrabold text-white">{signal.label}</h3>
                <span className={`border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[.12em] ${presentation.className}`}>
                  {presentation.label}
                </span>
              </div>
              <p className="mt-3 text-[12px] leading-5 text-slate-300">{signal.detected}</p>
              {signal.status !== "stable" && (
                <>
                  <p className="mt-2 text-[12px] leading-5 text-slate-400">{signal.whyItMatters}</p>
                  <p className="mt-3 border-t border-white/10 pt-3 text-[11px] leading-5 text-[#f0dda0]">{signal.humanReview}</p>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function WorkflowLeakageCard({ summary }: { summary: OperatingSignalSummary }) {
  return (
    <article className="border border-white/10 bg-white/[.04] p-5">
      <h3 className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.14em] text-slate-300">
        <TriangleAlert aria-hidden="true" className="size-4 text-rose-300" /> Top operational bottleneck
      </h3>
      <p className="mt-3 text-lg font-extrabold tracking-[-.03em] text-white">{summary.topBottleneck}</p>
      <p className="mt-3 text-[12px] leading-6 text-slate-400">{summary.accountabilityGap}.</p>
    </article>
  );
}

export function RevenueSignalCard({ summary }: { summary: OperatingSignalSummary }) {
  return (
    <article className="border border-white/10 bg-white/[.04] p-5">
      <h3 className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.14em] text-slate-300">
        <Banknote aria-hidden="true" className="size-4 text-[#e6c55b]" /> Possible revenue category
      </h3>
      <p className="mt-3 text-lg font-extrabold tracking-[-.03em] text-white">{summary.leakageCategory}</p>
      <p className="mt-3 text-[12px] leading-6 text-slate-400">
        An estimated category to review. Klinikos does not calculate recovered revenue and does not guarantee a financial outcome.
      </p>
    </article>
  );
}

export function NextBestActionPanel({ summary }: { summary: OperatingSignalSummary }) {
  return (
    <section aria-labelledby="next-action-heading" className="border border-cyan-300/30 bg-cyan-400/[.06] p-6">
      <h2 className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.16em] text-cyan-200" id="next-action-heading">
        <Compass aria-hidden="true" className="size-4" /> Zumi&apos;s Operating Signal
      </h2>
      <p className="mt-4 text-sm leading-7 text-slate-200">{summary.narrative}</p>

      <dl className="mt-6 grid gap-x-8 gap-y-4 border-t border-white/10 pt-5 sm:grid-cols-2">
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">Recommended starting module</dt>
          <dd className="mt-1 text-sm font-extrabold text-white">{summary.recommendedModule}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">Next best action</dt>
          <dd className="mt-1 flex items-start gap-2 text-sm font-semibold text-cyan-100">
            <ArrowRight aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {summary.nextBestAction}
          </dd>
        </div>
      </dl>
    </section>
  );
}

export function QualificationSummary({ summary, answeredCount, totalCount }: { summary: OperatingSignalSummary; answeredCount: number; totalCount: number }) {
  return (
    <section aria-labelledby="qualification-heading" className="border border-white/10 bg-white/[.04] p-6">
      <h2 className="text-[11px] font-extrabold uppercase tracking-[.16em] text-cyan-300" id="qualification-heading">
        Founding Clinic Qualification
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        {answeredCount} of {totalCount} operating questions answered. A Klinikos reviewer confirms this summary with you before any
        production activation.
      </p>
      <dl className="mt-5 grid gap-4 border-t border-white/10 pt-5">
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">Bottleneck</dt>
          <dd className="text-[12px] font-semibold text-slate-200">{summary.topBottleneck}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">Revenue category</dt>
          <dd className="text-[12px] font-semibold text-slate-200">{summary.leakageCategory}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">Recommended module</dt>
          <dd className="text-[12px] font-semibold text-slate-200">{summary.recommendedModule}</dd>
        </div>
      </dl>
    </section>
  );
}

import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import type { UniversalTrustSignal } from "@/lib/trust/universal-trust";

function human(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function signalTone(signal: UniversalTrustSignal) {
  if (!signal.open) return "border-emerald-300/15 bg-emerald-300/[.045] text-emerald-100";
  if (signal.severity === "urgent" || signal.severity === "high") return "border-rose-300/18 bg-rose-300/[.055] text-rose-100";
  return "border-amber-300/16 bg-amber-300/[.045] text-amber-100";
}

export function GovernedTrustSignals({ signals }: { signals: readonly UniversalTrustSignal[] }) {
  const openCount = signals.filter((signal) => signal.open).length;

  return (
    <section className="rounded-[1.6rem] border border-[#e6817b]/12 bg-[#0d0608] p-5 text-[#fff8f6] sm:p-6" aria-labelledby="governed-trust-signals-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#efaaa1]">Shared trust projection</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-.035em]" id="governed-trust-signals-title">Governed trust signals</h2>
          <p className="mt-2 text-xs leading-6 text-[#9f8985]">Klinikos can surface trust-relevant evidence across experiences without creating a second authority store. These signals mirror governed source records and never execute penalties by themselves.</p>
        </div>
        <div className="rounded-xl border border-[#e6817b]/12 bg-black/20 px-4 py-3 text-right">
          <p className="text-xl font-black text-white">{openCount}</p>
          <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[.13em] text-[#9f8985]">Open signals</p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-[#d6b787]/12 bg-[#d6b787]/[.045] px-4 py-3 text-[11px] leading-5 text-[#d9c2a1]">
        <ShieldAlert className="mr-2 inline size-4" />
        <strong className="text-[#efd8ad]">No automatic penalty:</strong> a signal does not itself prove a refund, payout action, participant restriction, resource suspension, medical determination, credential decision, or legal conclusion.
      </div>

      <div className="mt-5 space-y-3">
        {signals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/12 px-4 py-5 text-xs text-[#8f7773]">
            <CheckCircle2 className="mr-2 inline size-4 text-emerald-200/70" />No governed Grid trust signals are currently projected for this organization.
          </div>
        ) : signals.map((signal) => (
          <article className={`rounded-xl border p-4 ${signalTone(signal)}`} key={signal.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  {signal.open ? <AlertTriangle className="size-4" /> : <CheckCircle2 className="size-4" />}
                  <p className="text-xs font-extrabold">{signal.kind === "commercial_dispute" ? "Commercial dispute" : "Safety incident"}</p>
                  <span className="rounded-full border border-current/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-[.12em] opacity-75">{human(signal.category)}</span>
                </div>
                <p className="mt-2 max-w-3xl text-[11px] leading-5 opacity-70">{signal.summary}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-extrabold uppercase tracking-[.12em] opacity-80">{human(signal.status)}</p>
                <p className="mt-1 text-[9px] uppercase tracking-[.12em] opacity-55">{signal.severity}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-current/10 pt-3 text-[9px] font-bold uppercase tracking-[.1em] opacity-55">
              <span>Source: {signal.source.recordType}</span>
              <span>{signal.open && signal.blocksSettlement ? "Settlement held while active" : "No active settlement hold from this record"}</span>
              <span>Updated {new Date(signal.updatedAt).toLocaleString()}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
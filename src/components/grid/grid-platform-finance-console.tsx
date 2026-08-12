"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BadgeDollarSign, Landmark, Loader2, Percent, ShieldCheck } from "lucide-react";
import type { GridPlatformFinanceBoard } from "@/lib/grid/platform-finance-repository";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

function title(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function Status({ value }: { value: string }) {
  const good = /settled|active/i.test(value);
  const bad = /failed|disputed|reversed/i.test(value);
  return <span className={`rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.12em] ${good ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : bad ? "border-rose-300/20 bg-rose-300/10 text-rose-100" : "border-amber-300/20 bg-amber-300/10 text-amber-100"}`}>{title(value)}</span>;
}

function Metric({ titleText, value, detail }: { titleText: string; value: string; detail: string }) {
  return <div className="rounded-[1.4rem] border border-white/10 bg-white/[.045] p-5"><p className="text-2xl font-black tracking-[-.05em] text-white">{value}</p><p className="mt-1 text-[11px] font-extrabold text-white/75">{titleText}</p><p className="mt-2 text-[9px] leading-4 text-white/35">{detail}</p></div>;
}

const transitions: Record<string, { status: string; label: string }[]> = {
  pending: [{ status: "payable", label: "Make payable" }, { status: "held", label: "Hold" }, { status: "disputed", label: "Dispute" }],
  held: [{ status: "payable", label: "Release to payable" }, { status: "failed", label: "Fail" }, { status: "disputed", label: "Dispute" }],
  payable: [{ status: "processing", label: "Start processing" }, { status: "held", label: "Hold" }, { status: "disputed", label: "Dispute" }],
  processing: [{ status: "settled", label: "Record settled" }, { status: "failed", label: "Fail" }, { status: "disputed", label: "Dispute" }],
  failed: [{ status: "processing", label: "Retry" }, { status: "reversed", label: "Reverse" }, { status: "disputed", label: "Dispute" }],
  disputed: [{ status: "held", label: "Hold" }, { status: "payable", label: "Resolve payable" }, { status: "reversed", label: "Reverse" }],
  settled: [],
  reversed: [],
};

async function responseData(response: Response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? "Finance action failed.");
  return body.data;
}

export function GridPlatformFinanceConsole({ board }: { board: GridPlatformFinanceBoard }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "good" | "bad"; text: string } | null>(null);
  const [references, setReferences] = useState<Record<string, string>>({});
  const [policy, setPolicy] = useState({ scopeKind: "default", scopeValue: "", feePercent: "", flatFee: "" });

  async function createPolicy() {
    const feePercent = Number(policy.feePercent || "0");
    const flatFee = Number(policy.flatFee || "0");
    if (!Number.isFinite(feePercent) || feePercent < 0 || feePercent > 100 || !Number.isFinite(flatFee) || flatFee < 0) {
      setMessage({ tone: "bad", text: "Enter a valid platform fee percentage from 0 to 100 and a non-negative flat fee." });
      return;
    }
    setBusy("policy");
    setMessage(null);
    try {
      await responseData(await fetch("/api/grid/admin/fee-policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scopeKind: policy.scopeKind,
          scopeValue: policy.scopeKind === "default" ? null : policy.scopeValue,
          platformFeeBps: Math.round(feePercent * 100),
          platformFeeFlatCents: Math.round(flatFee * 100),
        }),
      }));
      setMessage({ tone: "good", text: "New fee policy is active. The prior policy for that exact scope was retained as inactive history." });
      router.refresh();
    } catch (error) {
      setMessage({ tone: "bad", text: error instanceof Error ? error.message : "Fee policy update failed." });
    } finally {
      setBusy(null);
    }
  }

  async function transition(obligationId: string, targetStatus: string) {
    const reference = references[obligationId]?.trim() || null;
    if (targetStatus === "settled" && !reference) {
      setMessage({ tone: "bad", text: "A real external settlement reference is required before Klinikos can record settled." });
      return;
    }
    setBusy(`${obligationId}:${targetStatus}`);
    setMessage(null);
    try {
      await responseData(await fetch(`/api/grid/financial-obligations/${obligationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetStatus, externalReference: reference, note: `${title(targetStatus)} recorded from the restricted Klinikos platform finance console.` }),
      }));
      setMessage({ tone: "good", text: "Settlement state recorded with audit evidence." });
      router.refresh();
    } catch (error) {
      setMessage({ tone: "bad", text: error instanceof Error ? error.message : "Settlement action failed." });
    } finally {
      setBusy(null);
    }
  }

  return <div className="space-y-6">
    {message && <div className={`rounded-2xl border px-4 py-3 text-xs ${message.tone === "good" ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : "border-rose-300/20 bg-rose-300/10 text-rose-100"}`}>{message.text}</div>}

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <Metric titleText="Unsettled obligations" value={money(board.metrics.unsettledCents)} detail="All open financial obligations across Grid." />
      <Metric titleText="Pending Klinikos fees" value={money(board.metrics.pendingPlatformFeesCents)} detail="Platform fees not yet recorded settled." />
      <Metric titleText="Settled Klinikos fees" value={money(board.metrics.settledPlatformFeesCents)} detail="Platform fee obligations with settlement evidence." />
      <Metric titleText="Supply / location owed" value={money(board.metrics.payableSupplyCents)} detail="Unsettled partner and facility obligations." />
      <Metric titleText="Active fee policies" value={String(board.metrics.activePolicies)} detail="Server-owned policy scopes currently active." />
    </section>

    <section className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
      <div className="rounded-[1.7rem] border border-white/10 bg-[#070b13] p-5 sm:p-6">
        <div className="flex items-center gap-3"><Percent className="size-5 text-cyan-200" /><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-200">Platform policy</p><h2 className="mt-1 text-xl font-black text-white">Set Grid economics</h2></div></div>
        <p className="mt-3 text-[10px] leading-5 text-white/40">The platform fee is never accepted from public offer input. This console replaces the active policy for one exact scope while preserving prior policy history.</p>
        <div className="mt-5 grid gap-3">
          <select className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white" value={policy.scopeKind} onChange={(event) => setPolicy({ ...policy, scopeKind: event.target.value })}><option value="default">Default Grid policy</option><option value="demand_kind">Demand kind</option><option value="resource_kind">Resource kind</option></select>
          {policy.scopeKind !== "default" && <input className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white" placeholder={policy.scopeKind === "demand_kind" ? "e.g. work, space, service" : "e.g. equipment"} value={policy.scopeValue} onChange={(event) => setPolicy({ ...policy, scopeValue: event.target.value })} />}
          <div className="grid gap-3 sm:grid-cols-2"><input className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white" inputMode="decimal" placeholder="Platform fee %" value={policy.feePercent} onChange={(event) => setPolicy({ ...policy, feePercent: event.target.value })} /><input className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white" inputMode="decimal" placeholder="Flat fee $" value={policy.flatFee} onChange={(event) => setPolicy({ ...policy, flatFee: event.target.value })} /></div>
          <button className="rounded-xl bg-cyan-300 px-4 py-3 text-xs font-extrabold text-slate-950" disabled={busy === "policy"} onClick={createPolicy}>{busy === "policy" ? <Loader2 className="mx-auto size-4 animate-spin" /> : "Activate policy"}</button>
        </div>
      </div>

      <div className="rounded-[1.7rem] border border-white/10 bg-white/[.035] p-5 sm:p-6"><div className="flex items-center gap-3"><Landmark className="size-5 text-amber-200" /><h2 className="text-xl font-black text-white">Policy history</h2></div><div className="mt-4 space-y-2">{board.policies.length === 0 && <p className="text-xs text-white/40">No fee policy has been configured yet. Fulfilled transactions will refuse financial allocation until one applies.</p>}{board.policies.map((item) => <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 p-3" key={item.id}><div><Status value={item.status} /><p className="mt-2 text-xs font-extrabold text-white">{title(item.scopeKind)} {item.scopeValue ? `· ${title(item.scopeValue)}` : ""}</p></div><div className="text-right"><p className="text-sm font-black text-white">{(item.platformFeeBps / 100).toFixed(2)}%</p><p className="text-[9px] text-white/35">+ {money(item.platformFeeFlatCents)} flat</p></div></div>)}</div></div>
    </section>

    <section className="rounded-[1.7rem] border border-white/10 bg-[#070b13] p-5 sm:p-6"><div className="flex items-center gap-3"><BadgeDollarSign className="size-5 text-emerald-200" /><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-200">Settlement control</p><h2 className="mt-1 text-xl font-black text-white">Financial obligations</h2></div></div><div className="mt-5 grid gap-3 xl:grid-cols-2">{board.obligations.length === 0 && <p className="text-xs text-white/40">No fulfilled Grid transactions have been allocated yet.</p>}{board.obligations.map((line) => <article className="rounded-2xl border border-white/10 bg-white/[.035] p-4" key={line.id}><div className="flex items-start justify-between gap-3"><div><Status value={line.status} /><p className="mt-2 text-sm font-extrabold text-white">{title(line.obligationType)}</p><p className="mt-1 text-[10px] text-white/40">{line.demandTitle} · {line.ownerName}</p></div><p className="text-xl font-black text-white">{money(line.amountCents)}</p></div><p className="mt-3 text-[10px] text-white/40">Beneficiary: {line.beneficiaryName ?? (line.beneficiaryType === "platform" ? "Klinikos" : line.beneficiaryReference ?? "Unresolved")}</p>{line.externalReference && <p className="mt-1 break-all text-[9px] text-emerald-200/70">Reference: {line.externalReference}</p>}{(transitions[line.status] ?? []).length > 0 && <div className="mt-3"><input className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[10px] text-white" placeholder="External/batch reference (required to settle)" value={references[line.id] ?? ""} onChange={(event) => setReferences({ ...references, [line.id]: event.target.value })} /><div className="mt-2 flex flex-wrap gap-2">{(transitions[line.status] ?? []).map((action) => <button className="rounded-lg border border-white/10 bg-white/[.04] px-3 py-2 text-[10px] font-extrabold text-white/65 hover:text-white" disabled={busy === `${line.id}:${action.status}`} key={action.status} onClick={() => transition(line.id, action.status)}>{busy === `${line.id}:${action.status}` ? "Recording…" : action.label}</button>)}</div></div>}</article>)}</div></section>

    <div className="rounded-[1.4rem] border border-amber-300/10 bg-amber-300/[.04] p-4 text-[10px] leading-5 text-amber-100/65"><ShieldCheck className="mr-2 inline size-4" /><strong className="text-amber-100">Settlement truth:</strong> this console records manual reconciliation today. It does not claim processor verification, escrow, automated payout, tax reporting, or Stripe Connect until those rails are actually connected and tested.</div>
  </div>;
}

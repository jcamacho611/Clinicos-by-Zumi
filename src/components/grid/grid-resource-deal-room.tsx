"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Check, Handshake, RefreshCcw, ShieldCheck, X } from "lucide-react";
import type { UniversalResourceDealRoom } from "@/lib/grid/universal-resource-deal-repository";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

function label(value: string | null) {
  if (!value) return "Not started";
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function Status({ value }: { value: string }) {
  const good = /accepted|held|fulfilled/i.test(value);
  const bad = /declined|withdrawn|expired|failed|disputed/i.test(value);
  return <span className={`rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.12em] ${good ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : bad ? "border-rose-300/20 bg-rose-300/10 text-rose-100" : "border-amber-300/20 bg-amber-300/10 text-amber-100"}`}>{label(value)}</span>;
}

async function responseData(response: Response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? "Grid resource deal action failed.");
  return body.data;
}

export function GridResourceDealRoom({ room }: { room: UniversalResourceDealRoom }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ good: boolean; text: string } | null>(null);
  const [counterAmounts, setCounterAmounts] = useState<Record<string, string>>({});

  async function decide(deal: UniversalResourceDealRoom["deals"][number], targetStatus: "accepted" | "declined" | "withdrawn") {
    setBusy(`${deal.id}:${targetStatus}`);
    setMessage(null);
    try {
      await responseData(await fetch(`/api/grid/universal-offers/${deal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetStatus, note: `${label(targetStatus)} from the universal resource deal room.` }),
      }));
      setMessage({ good: true, text: "Grid recorded the resource-offer decision." });
      router.refresh();
    } catch (error) {
      setMessage({ good: false, text: error instanceof Error ? error.message : "Grid resource decision failed." });
    } finally {
      setBusy(null);
    }
  }

  async function counter(deal: UniversalResourceDealRoom["deals"][number]) {
    const amount = Number(counterAmounts[deal.id]);
    if (!Number.isFinite(amount) || amount < 0) {
      setMessage({ good: false, text: "Enter a valid counter amount." });
      return;
    }
    const grossAmountCents = Math.round(amount * 100);
    setBusy(`${deal.id}:counter`);
    setMessage(null);
    try {
      await responseData(await fetch(`/api/grid/universal-offers/${deal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetStatus: "countered",
          note: "Counteroffer prepared in the universal resource deal room.",
          counterOffer: {
            offeredStartAt: deal.offeredStartAt,
            offeredEndAt: deal.offeredEndAt,
            grossAmountCents,
            depositAmountCents: Math.min(deal.depositAmountCents, grossAmountCents),
            locationPayableCents: Math.min(deal.locationPayableCents, grossAmountCents),
            note: `Counteroffer at ${money(grossAmountCents)}.`,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
        }),
      }));
      setMessage({ good: true, text: "Counteroffer sent as a new immutable offer version." });
      router.refresh();
    } catch (error) {
      setMessage({ good: false, text: error instanceof Error ? error.message : "Counteroffer failed." });
    } finally {
      setBusy(null);
    }
  }

  async function reserve(dealId: string) {
    setBusy(`${dealId}:reserve`);
    setMessage(null);
    try {
      await responseData(await fetch(`/api/grid/universal-offers/${dealId}/reserve`, { method: "POST" }));
      setMessage({ good: true, text: "Grid reserved available capacity. Any required deposit is still a separate payment condition." });
      router.refresh();
    } catch (error) {
      setMessage({ good: false, text: error instanceof Error ? error.message : "Resource reservation failed." });
    } finally {
      setBusy(null);
    }
  }

  return <div className="space-y-5">
    {message && <div className={`rounded-2xl border px-4 py-3 text-xs ${message.good ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : "border-rose-300/20 bg-rose-300/10 text-rose-100"}`}>{message.text}</div>}

    <div className="grid gap-4 xl:grid-cols-2">{room.deals.length === 0 && <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/[.025] p-10 text-center xl:col-span-2"><Handshake className="mx-auto size-8 text-white/25" /><h2 className="mt-4 text-lg font-black text-white">No universal resource offers yet.</h2><p className="mt-2 text-xs text-white/40">Browse approved supply or list your own resource to start the exchange.</p><Link className="mt-4 inline-flex items-center gap-2 text-xs font-extrabold text-cyan-200" href="/grid/resources/browse">Browse resources <ArrowRight className="size-3.5" /></Link></div>}{room.deals.map((deal) => {const sender = deal.senderOrganizationId === room.organizationId;const recipient = deal.recipientOrganizationId === room.organizationId;const owner = deal.organizationId === room.organizationId;return <article className="rounded-[1.5rem] border border-white/10 bg-white/[.035] p-5" key={deal.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap gap-2"><Status value={deal.status} /><span className="rounded-full border border-cyan-300/15 bg-cyan-300/[.05] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.12em] text-cyan-100">{label(deal.resourceKind)}</span></div><h2 className="mt-3 text-lg font-black text-white">{deal.resourceTitle}</h2><p className="mt-1 text-[10px] text-white/40">Need: {deal.demandTitle}</p><p className="mt-1 text-[10px] text-white/40">{deal.senderName ?? "Grid participant"} → {deal.recipientName ?? "Grid participant"} · offer v{deal.version}</p></div><p className="text-xl font-black text-white">{money(deal.grossAmountCents)}</p></div><p className="mt-3 text-[10px] leading-5 text-white/45">{deal.note}</p><div className="mt-4 grid grid-cols-2 gap-3 text-[9px] text-white/35"><div><span className="block uppercase tracking-[.12em]">Deposit</span><strong className="mt-1 block text-white/65">{money(deal.depositAmountCents)}</strong></div><div><span className="block uppercase tracking-[.12em]">Policy class</span><strong className="mt-1 block text-white/65">{label(deal.resourcePolicyClass)}</strong></div></div>{deal.reservationId && <div className="mt-4 rounded-xl border border-emerald-300/10 bg-emerald-300/[.04] p-3 text-[9px] text-emerald-100/60"><ShieldCheck className="mr-1 inline size-3.5" />Reservation {label(deal.reservationStatus)} · payment {label(deal.paymentStatus)} · fulfillment {label(deal.fulfillmentStatus)}</div>}{deal.status === "sent" && recipient && <div className="mt-4 flex flex-wrap gap-2"><button className="rounded-lg bg-emerald-300 px-3 py-2 text-[10px] font-extrabold text-slate-950" disabled={busy !== null} onClick={() => decide(deal, "accepted")}><Check className="mr-1 inline size-3" />Accept</button><button className="rounded-lg border border-rose-300/20 px-3 py-2 text-[10px] font-extrabold text-rose-100" disabled={busy !== null} onClick={() => decide(deal, "declined")}><X className="mr-1 inline size-3" />Decline</button><input className="w-28 rounded-lg border border-white/10 bg-black/25 px-2 py-2 text-[10px] text-white" placeholder="Counter $" value={counterAmounts[deal.id] ?? ""} onChange={(event) => setCounterAmounts({ ...counterAmounts, [deal.id]: event.target.value })} /><button className="rounded-lg border border-amber-300/20 px-3 py-2 text-[10px] font-extrabold text-amber-100" disabled={busy !== null} onClick={() => counter(deal)}><RefreshCcw className="mr-1 inline size-3" />Counter</button></div>}{deal.status === "sent" && sender && <button className="mt-4 rounded-lg border border-white/10 px-3 py-2 text-[10px] font-extrabold text-white/60" disabled={busy !== null} onClick={() => decide(deal, "withdrawn")}>Withdraw</button>}{deal.status === "accepted" && owner && !deal.reservationId && <button className="mt-4 rounded-lg bg-cyan-300 px-3 py-2 text-[10px] font-extrabold text-slate-950" disabled={busy !== null} onClick={() => reserve(deal.id)}>Reserve approved capacity</button>}{deal.reservationId && <Link className="mt-4 inline-flex items-center gap-2 text-[10px] font-extrabold text-cyan-200" href="/grid/transactions">Continue payment / fulfillment <ArrowRight className="size-3" /></Link>}</article>})}</div>
  </div>;
}

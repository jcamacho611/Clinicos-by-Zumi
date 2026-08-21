"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, Clock3, Send, ShieldCheck } from "lucide-react";
import type { ApprovedPublicGridResource } from "@/lib/grid/public-resource-detail-repository";

type Demand = {
  id: string;
  kind: string;
  title: string;
  category: string;
  status: string;
  requestedStartAt: string | null;
  requestedEndAt: string | null;
  maxPriceCents: number | null;
};

function money(cents: number | null) {
  if (cents == null) return "Request quote";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function compatibleKinds(resourceType: string) {
  if (resourceType === "organization_capacity") return ["organization", "network"];
  return [resourceType];
}

async function responseData(response: Response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? "Grid resource request failed.");
  return body.data;
}

export function GridResourceRequestForm({ resource, demands }: { resource: ApprovedPublicGridResource; demands: Demand[] }) {
  const router = useRouter();
  const eligibleDemands = useMemo(() => demands.filter((demand) => ["open", "matched"].includes(demand.status) && compatibleKinds(resource.resourceType).includes(demand.kind)), [demands, resource.resourceType]);
  const [demandId, setDemandId] = useState(eligibleDemands[0]?.id ?? "");
  const selectedDemand = eligibleDemands.find((demand) => demand.id === demandId);
  const firstWindow = resource.availability[0];
  const [start, setStart] = useState(firstWindow?.startsAt ? firstWindow.startsAt.slice(0, 16) : "");
  const [end, setEnd] = useState(firstWindow?.endsAt ? firstWindow.endsAt.slice(0, 16) : "");
  const [gross, setGross] = useState(resource.priceCents != null ? String(resource.priceCents / 100) : "");
  const [deposit, setDeposit] = useState("0");
  const [note, setNote] = useState(`Request for ${resource.title}.`);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ good: boolean; text: string } | null>(null);

  async function sendOffer() {
    if (!selectedDemand) return setMessage({ good: false, text: "Choose or create a compatible Grid need first." });
    if (!start) return setMessage({ good: false, text: "Choose a requested start time." });
    const grossAmountCents = Math.round(Number(gross || "0") * 100);
    const depositAmountCents = Math.round(Number(deposit || "0") * 100);
    if (!Number.isFinite(grossAmountCents) || grossAmountCents < 0 || !Number.isFinite(depositAmountCents) || depositAmountCents < 0) {
      return setMessage({ good: false, text: "Enter valid offer and deposit amounts." });
    }

    setBusy(true);
    setMessage(null);
    try {
      await responseData(await fetch("/api/grid/universal-offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          demandId: selectedDemand.id,
          recipientOrganizationId: resource.organizationId,
          resourceKind: resource.resourceType,
          resourceReference: resource.id,
          offeredStartAt: new Date(start).toISOString(),
          offeredEndAt: end ? new Date(end).toISOString() : null,
          grossAmountCents,
          depositAmountCents,
          locationPayableCents: 0,
          note,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }),
      }));
      setMessage({ good: true, text: "Offer sent to the resource owner. Grid verified the current resource policy and availability before sending, and will check again before acceptance and reservation." });
      router.push("/grid/resources/offers");
      router.refresh();
    } catch (error) {
      setMessage({ good: false, text: error instanceof Error ? error.message : "Grid resource request failed." });
    } finally {
      setBusy(false);
    }
  }

  return <div className="space-y-5">
    {message && <div className={`rounded-2xl border px-4 py-3 text-xs ${message.good ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : "border-rose-300/20 bg-rose-300/10 text-rose-100"}`}>{message.text}</div>}

    <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
      <section className="rounded-[1.7rem] border border-white/10 bg-white/[.035] p-5"><p className="text-[11px] font-black uppercase tracking-[.18em] text-cyan-200">Approved resource</p><h2 className="mt-3 text-2xl font-black text-white">{resource.title}</h2><p className="mt-3 text-xs leading-6 text-white/55">{resource.description}</p><div className="mt-5 grid grid-cols-2 gap-3 text-[12px]"><div><p className="uppercase tracking-[.12em] text-white/55">Owner</p><p className="mt-1 font-extrabold text-white/70">{resource.organizationName}</p></div><div><p className="uppercase tracking-[.12em] text-white/55">Type</p><p className="mt-1 font-extrabold text-white/70">{label(resource.resourceType)}</p></div><div><p className="uppercase tracking-[.12em] text-white/55">Price</p><p className="mt-1 font-extrabold text-white/70">{money(resource.priceCents)}</p></div><div><p className="uppercase tracking-[.12em] text-white/55">Capacity</p><p className="mt-1 font-extrabold text-white/70">{resource.capacity}</p></div></div><div className="mt-5 flex items-start gap-2 rounded-xl border border-amber-300/10 bg-amber-300/[.04] p-3 text-[11px] leading-4 text-amber-100/60"><ShieldCheck className="mt-0.5 size-3.5 shrink-0" />Approval means this resource passed its current Grid class review. Transaction-specific requirements are rechecked again before commitment.</div></section>

      <section className="rounded-[1.7rem] border border-white/10 bg-[#070b13] p-5 sm:p-6"><p className="text-[11px] font-black uppercase tracking-[.18em] text-amber-200">Prepare offer</p><h2 className="mt-2 text-2xl font-black text-white">Connect this resource to one of your needs.</h2>{eligibleDemands.length === 0 ? <div className="mt-5 rounded-xl border border-white/10 bg-white/[.03] p-4"><p className="text-xs text-white/55">You do not have an open {label(resource.resourceType)} need yet.</p><Link className="mt-3 inline-flex items-center gap-2 text-xs font-extrabold text-cyan-200" href="/grid/transactions">Create a need <ArrowRight className="size-3.5" /></Link></div> : <div className="mt-5 grid gap-3"><select className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white" value={demandId} onChange={(event) => setDemandId(event.target.value)}>{eligibleDemands.map((demand) => <option key={demand.id} value={demand.id}>{demand.title} · {label(demand.status)}</option>)}</select><div className="grid gap-3 sm:grid-cols-2"><label className="text-[11px] font-extrabold uppercase tracking-[.12em] text-white/55">Start<input className="mt-1 block w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs font-normal normal-case tracking-normal text-white" type="datetime-local" value={start} onChange={(event) => setStart(event.target.value)} /></label><label className="text-[11px] font-extrabold uppercase tracking-[.12em] text-white/55">End<input className="mt-1 block w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs font-normal normal-case tracking-normal text-white" type="datetime-local" value={end} onChange={(event) => setEnd(event.target.value)} /></label></div><div className="grid gap-3 sm:grid-cols-2"><input className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white placeholder:text-white/55" inputMode="decimal" placeholder="Offer amount $" value={gross} onChange={(event) => setGross(event.target.value)} /><input className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white placeholder:text-white/55" inputMode="decimal" placeholder="Deposit $" value={deposit} onChange={(event) => setDeposit(event.target.value)} /></div><textarea className="min-h-24 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white" value={note} onChange={(event) => setNote(event.target.value)} /><button className="rounded-xl bg-cyan-300 px-4 py-3 text-xs font-extrabold text-slate-950" disabled={busy} onClick={sendOffer}><Send className="mr-2 inline size-4" />{busy ? "Sending…" : "Send resource offer"}</button></div>}<div className="mt-4 flex items-center gap-2 text-[11px] text-white/55"><Clock3 className="size-3.5" />Offers expire after 24 hours unless countered or decided sooner.</div></section>
    </div>
  </div>;
}

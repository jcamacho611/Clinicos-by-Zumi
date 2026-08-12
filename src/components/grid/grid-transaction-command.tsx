"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, BadgeDollarSign, Check, CircleDollarSign, Handshake, Map, Sparkles, X } from "lucide-react";
import type { GridTransactionBoard } from "@/lib/grid/transaction-board-repository";
import { KLINIKOS_GODADDY_PAYLINK } from "@/lib/commercial/klinikos-commercial";

const demandKinds = ["work", "provider", "space", "product", "equipment", "service", "network", "education", "organization", "referral"] as const;

type MatchPreview = {
  providerId: string;
  serviceId: string;
  score: number;
  reasons: string[];
  providerName: string;
  providerType: string | null;
  specialty: string | null;
  serviceName: string;
  category: string;
  priceLowCents: number | null;
  priceHighCents: number | null;
  requiresDeposit: boolean;
  requiresMedicalReview: boolean;
  onCallNow: boolean;
};

type OfferDraft = { demandId: string; match: MatchPreview; gross: string; deposit: string; note: string };

function money(cents: number | null | undefined) {
  if (cents == null) return "Flexible";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

function when(value: string | null) {
  if (!value) return "Time flexible";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function Pill({ value }: { value: string }) {
  const positive = /held|fulfilled|settled|accepted|recorded|active/i.test(value);
  const danger = /failed|declined|disputed|expired|withdrawn|released/i.test(value);
  const className = positive
    ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
    : danger
      ? "border-rose-300/20 bg-rose-300/10 text-rose-100"
      : "border-amber-300/20 bg-amber-300/10 text-amber-100";
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.12em] ${className}`}>{label(value)}</span>;
}

function Metric({ labelText, value, detail }: { labelText: string; value: string; detail: string }) {
  return <div className="rounded-[1.4rem] border border-white/10 bg-white/[.045] p-5"><p className="text-2xl font-black tracking-[-.05em] text-white">{value}</p><p className="mt-1 text-[11px] font-extrabold text-white/75">{labelText}</p><p className="mt-2 text-[9px] leading-4 text-white/35">{detail}</p></div>;
}

async function readResponse(response: Response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? "Grid action failed.");
  return body.data;
}

export function GridTransactionCommand({ board }: { board: GridTransactionBoard }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "good" | "bad"; text: string } | null>(null);
  const [matches, setMatches] = useState<Record<string, MatchPreview[]>>({});
  const [offerDraft, setOfferDraft] = useState<OfferDraft | null>(null);
  const [counterAmounts, setCounterAmounts] = useState<Record<string, string>>({});
  const [paymentRefs, setPaymentRefs] = useState<Record<string, string>>({});
  const [composerOpen, setComposerOpen] = useState(false);
  const [demandForm, setDemandForm] = useState({
    kind: "service",
    title: "",
    description: "",
    category: "",
    serviceName: "",
    requestedStartAt: "",
    requestedEndAt: "",
    city: "",
    state: "NY",
    maxPrice: "",
    requiresClinicalEligibility: false,
  });

  const obligationsByReservation = useMemo(() => {
    const map = new globalThis.Map<string, GridTransactionBoard["obligations"]>();
    for (const line of board.obligations) map.set(line.reservationId, [...(map.get(line.reservationId) ?? []), line]);
    return map;
  }, [board.obligations]);

  async function mutate(key: string, input: RequestInfo | URL, init?: RequestInit) {
    setBusy(key);
    setMessage(null);
    try {
      const data = await readResponse(await fetch(input, init));
      setMessage({ tone: "good", text: "Grid recorded the action." });
      router.refresh();
      return data;
    } catch (error) {
      setMessage({ tone: "bad", text: error instanceof Error ? error.message : "Grid action failed." });
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function createDemand() {
    if (!demandForm.title.trim() || !demandForm.description.trim() || !demandForm.category.trim()) {
      setMessage({ tone: "bad", text: "Name the need, describe it, and choose a category." });
      return;
    }
    await mutate("create-demand", "/api/grid/demands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: demandForm.kind,
        title: demandForm.title,
        description: demandForm.description,
        category: demandForm.category,
        serviceName: demandForm.serviceName || null,
        requestedStartAt: demandForm.requestedStartAt ? new Date(demandForm.requestedStartAt).toISOString() : null,
        requestedEndAt: demandForm.requestedEndAt ? new Date(demandForm.requestedEndAt).toISOString() : null,
        city: demandForm.city || null,
        state: demandForm.state || null,
        maxPriceCents: demandForm.maxPrice ? Math.round(Number(demandForm.maxPrice) * 100) : null,
        requiresClinicalEligibility: demandForm.requiresClinicalEligibility,
        requirements: [],
        visibility: "matched_only",
      }),
    });
    setComposerOpen(false);
    setDemandForm((current) => ({ ...current, title: "", description: "", serviceName: "", requestedStartAt: "", requestedEndAt: "", maxPrice: "" }));
  }

  async function findMatches(demand: GridTransactionBoard["demands"][number]) {
    if (!demand.requestedStartAt) {
      setMessage({ tone: "bad", text: "Add a requested start time before running time-based matching." });
      return;
    }
    setBusy(`matches-${demand.id}`);
    setMessage(null);
    try {
      const data = await readResponse(await fetch("/api/grid/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: demand.category,
          serviceName: demand.serviceName,
          requestedStartAt: demand.requestedStartAt,
          requestedEndAt: demand.requestedEndAt,
          locationType: demand.locationType,
          maxPriceCents: demand.maxPriceCents,
          requiresClinicalEligibility: demand.requiresClinicalEligibility,
        }),
      }));
      setMatches((current) => ({ ...current, [demand.id]: data }));
      if (!data.length) setMessage({ tone: "bad", text: "No currently eligible provider/service matches fit that time and policy." });
    } catch (error) {
      setMessage({ tone: "bad", text: error instanceof Error ? error.message : "Match search failed." });
    } finally {
      setBusy(null);
    }
  }

  async function sendOffer(demand: GridTransactionBoard["demands"][number]) {
    if (!offerDraft || offerDraft.demandId !== demand.id) return;
    const gross = Math.round(Number(offerDraft.gross) * 100);
    const deposit = Math.round(Number(offerDraft.deposit || "0") * 100);
    if (!Number.isFinite(gross) || gross < 0) return setMessage({ tone: "bad", text: "Enter a valid offer amount." });
    const result = await mutate(`offer-${demand.id}`, "/api/grid/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        demandId: demand.id,
        providerId: offerDraft.match.providerId,
        serviceListingId: offerDraft.match.serviceId,
        offeredStartAt: demand.requestedStartAt,
        offeredEndAt: demand.requestedEndAt,
        grossAmountCents: gross,
        depositAmountCents: deposit,
        locationPayableCents: 0,
        note: offerDraft.note || `Offer for ${demand.title}.`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }),
    });
    if (result) setOfferDraft(null);
  }

  async function decideOffer(offer: GridTransactionBoard["offers"][number], targetStatus: "accepted" | "declined" | "withdrawn") {
    await mutate(`offer-decision-${offer.id}`, `/api/grid/offers/${offer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetStatus, note: `${label(targetStatus)} from Grid transaction command.` }),
    });
  }

  async function counterOffer(offer: GridTransactionBoard["offers"][number]) {
    const amount = Number(counterAmounts[offer.id]);
    if (!Number.isFinite(amount) || amount < 0) return setMessage({ tone: "bad", text: "Enter a valid counter amount." });
    await mutate(`counter-${offer.id}`, `/api/grid/offers/${offer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetStatus: "countered",
        note: "Counteroffer prepared from Grid transaction command.",
        counterOffer: {
          locationId: offer.locationId,
          offeredStartAt: offer.offeredStartAt,
          offeredEndAt: offer.offeredEndAt,
          grossAmountCents: Math.round(amount * 100),
          depositAmountCents: Math.min(offer.depositAmountCents, Math.round(amount * 100)),
          locationPayableCents: Math.min(offer.locationPayableCents, Math.round(amount * 100)),
          note: `Counteroffer at ${money(Math.round(amount * 100))}.`,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      }),
    });
  }

  async function reserveOffer(offerId: string) {
    await mutate(`reserve-${offerId}`, `/api/grid/offers/${offerId}/reserve`, { method: "POST" });
  }

  async function recordPayment(reservationId: string) {
    const reference = paymentRefs[reservationId]?.trim();
    if (!reference) return setMessage({ tone: "bad", text: "Enter the real GoDaddy/payment reference before reconciling the deposit." });
    await mutate(`pay-${reservationId}`, `/api/grid/reservations/${reservationId}/payment`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ externalReference: reference, note: "Manual GoDaddy deposit evidence recorded from Grid transaction command." }),
    });
  }

  async function fulfill(reservationId: string, targetStatus: "checked_in" | "in_progress" | "fulfilled" | "partial" | "failed" | "disputed") {
    await mutate(`fulfill-${reservationId}`, `/api/grid/reservations/${reservationId}/fulfillment`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetStatus, note: `${label(targetStatus)} recorded from Grid transaction command.` }),
    });
  }

  async function allocate(reservationId: string) {
    await mutate(`allocate-${reservationId}`, `/api/grid/reservations/${reservationId}/financial-obligations`, { method: "POST" });
  }

  return <div className="space-y-6">
    {message && <div className={`rounded-2xl border px-4 py-3 text-xs ${message.tone === "good" ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : "border-rose-300/20 bg-rose-300/10 text-rose-100"}`}>{message.text}</div>}

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      <Metric labelText="Open needs" value={String(board.metrics.openDemands)} detail="Needs your organization owns." />
      <Metric labelText="Active offers" value={String(board.metrics.activeOffers)} detail="Offers waiting on a decision." />
      <Metric labelText="Capacity held" value={String(board.metrics.heldReservations)} detail="Pending, held or in-use reservations." />
      <Metric labelText="Fulfillment" value={String(board.metrics.awaitingFulfillment)} detail="Reservations not yet at a terminal outcome." />
      <Metric labelText="Pending to you" value={money(board.metrics.pendingToYouCents)} detail="Your organization’s unsettled Grid obligations." />
      <Metric labelText="Settled to you" value={money(board.metrics.settledToYouCents)} detail="Obligations recorded as settled." />
    </section>

    <section className="rounded-[1.7rem] border border-white/10 bg-[#070b13] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-200">I need something</p><h2 className="mt-2 text-2xl font-black tracking-[-.04em] text-white">Needs & matching</h2></div><button className="rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-extrabold text-slate-950" onClick={() => setComposerOpen((value) => !value)}>{composerOpen ? "Close" : "Create a need"}</button></div>
      {composerOpen && <div className="mt-5 grid gap-3 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.04] p-4 md:grid-cols-2">
        <select className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white" value={demandForm.kind} onChange={(event) => setDemandForm({ ...demandForm, kind: event.target.value })}>{demandKinds.map((kind) => <option key={kind} value={kind}>{label(kind)}</option>)}</select>
        <input className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white" placeholder="Category, e.g. billing or injectables" value={demandForm.category} onChange={(event) => setDemandForm({ ...demandForm, category: event.target.value })} />
        <input className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white md:col-span-2" placeholder="What do you need?" value={demandForm.title} onChange={(event) => setDemandForm({ ...demandForm, title: event.target.value })} />
        <textarea className="min-h-24 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white md:col-span-2" placeholder="Describe the legitimate healthcare need without patient-identifying information." value={demandForm.description} onChange={(event) => setDemandForm({ ...demandForm, description: event.target.value })} />
        <input className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white" placeholder="Specific service (optional)" value={demandForm.serviceName} onChange={(event) => setDemandForm({ ...demandForm, serviceName: event.target.value })} />
        <input className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white" placeholder="City" value={demandForm.city} onChange={(event) => setDemandForm({ ...demandForm, city: event.target.value })} />
        <input className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white" type="datetime-local" value={demandForm.requestedStartAt} onChange={(event) => setDemandForm({ ...demandForm, requestedStartAt: event.target.value })} />
        <input className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white" type="datetime-local" value={demandForm.requestedEndAt} onChange={(event) => setDemandForm({ ...demandForm, requestedEndAt: event.target.value })} />
        <input className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white" inputMode="decimal" placeholder="Max budget $ (optional)" value={demandForm.maxPrice} onChange={(event) => setDemandForm({ ...demandForm, maxPrice: event.target.value })} />
        <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-xs text-white/70"><input type="checkbox" checked={demandForm.requiresClinicalEligibility} onChange={(event) => setDemandForm({ ...demandForm, requiresClinicalEligibility: event.target.checked })} />Clinical eligibility required</label>
        <button className="rounded-xl bg-white px-4 py-3 text-xs font-extrabold text-slate-950 md:col-span-2" disabled={busy === "create-demand"} onClick={createDemand}>{busy === "create-demand" ? "Saving…" : "Save need"}</button>
      </div>}
      <div className="mt-5 space-y-3">{board.demands.length === 0 && <p className="text-xs text-white/40">No saved needs yet.</p>}{board.demands.map((demand) => <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4" key={demand.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><Pill value={demand.status} /><span className="text-[9px] font-black uppercase tracking-[.14em] text-white/35">{label(demand.kind)}</span></div><h3 className="mt-2 font-black text-white">{demand.title}</h3><p className="mt-1 text-[10px] text-white/45">{demand.category} · {when(demand.requestedStartAt)} · {demand.city || demand.state || "Location flexible"}</p></div><div className="flex gap-2">{["work", "provider", "service"].includes(demand.kind) && ["open", "matched"].includes(demand.status) && <button className="rounded-xl border border-cyan-300/20 px-3 py-2 text-[10px] font-extrabold text-cyan-100" onClick={() => findMatches(demand)}>{busy === `matches-${demand.id}` ? "Matching…" : "Find matches"}</button>}<Link className="rounded-xl border border-white/10 px-3 py-2 text-[10px] font-extrabold text-white/60" href={`/grid/browse?intent=${demand.kind}`}><Map className="mr-1 inline size-3" />Browse</Link></div></div>{matches[demand.id]?.length ? <div className="mt-4 grid gap-2 lg:grid-cols-2">{matches[demand.id].slice(0, 6).map((match) => <div className="rounded-xl border border-white/8 bg-black/20 p-3" key={`${match.providerId}:${match.serviceId}`}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-extrabold text-white">{match.providerName}</p><p className="mt-1 text-[10px] text-white/45">{match.serviceName} · score {match.score}</p></div><span className="text-xs font-black text-cyan-100">{money(match.priceLowCents)}</span></div><button className="mt-3 text-[10px] font-extrabold text-cyan-200" onClick={() => setOfferDraft({ demandId: demand.id, match, gross: String((match.priceLowCents ?? 0) / 100), deposit: "0", note: `Offer for ${demand.title}.` })}>Prepare offer <ArrowRight className="inline size-3" /></button></div>)}</div> : null}{offerDraft?.demandId === demand.id && <div className="mt-4 grid gap-2 rounded-xl border border-amber-300/15 bg-amber-300/[.04] p-3 sm:grid-cols-3"><input className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white" value={offerDraft.gross} onChange={(event) => setOfferDraft({ ...offerDraft, gross: event.target.value })} placeholder="Gross $" /><input className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white" value={offerDraft.deposit} onChange={(event) => setOfferDraft({ ...offerDraft, deposit: event.target.value })} placeholder="Deposit $" /><button className="rounded-lg bg-amber-200 px-3 py-2 text-xs font-extrabold text-slate-950" onClick={() => sendOffer(demand)}>Send offer</button></div>}</div>)}</div>
    </section>

    <section className="grid gap-5 xl:grid-cols-2">
      <div className="rounded-[1.7rem] border border-white/10 bg-white/[.035] p-5"><div className="flex items-center gap-3"><Handshake className="size-5 text-cyan-200" /><h2 className="text-xl font-black text-white">Offers</h2></div><div className="mt-4 space-y-3">{board.offers.length === 0 && <p className="text-xs text-white/40">No offers yet.</p>}{board.offers.map((offer) => {const recipient = offer.recipientOrganizationId === board.organizationId;const sender = offer.senderOrganizationId === board.organizationId;const owner = offer.ownerOrganizationId === board.organizationId;return <div className="rounded-2xl border border-white/10 bg-black/20 p-4" key={offer.id}><div className="flex items-start justify-between gap-3"><div><Pill value={offer.status} /><p className="mt-2 text-sm font-extrabold text-white">{offer.demandTitle}</p><p className="mt-1 text-[10px] text-white/45">{offer.senderName ?? "Grid participant"} → {offer.recipientName ?? "Grid participant"} · v{offer.version}</p></div><p className="text-lg font-black text-white">{money(offer.grossAmountCents)}</p></div><p className="mt-2 text-[10px] text-white/40">Deposit {money(offer.depositAmountCents)} · Location {money(offer.locationPayableCents)} · {when(offer.offeredStartAt)}</p>{offer.status === "sent" && recipient && <div className="mt-3 flex flex-wrap gap-2"><button className="rounded-lg bg-emerald-300 px-3 py-2 text-[10px] font-extrabold text-slate-950" onClick={() => decideOffer(offer, "accepted")}><Check className="mr-1 inline size-3" />Accept</button><button className="rounded-lg border border-rose-300/20 px-3 py-2 text-[10px] font-extrabold text-rose-100" onClick={() => decideOffer(offer, "declined")}><X className="mr-1 inline size-3" />Decline</button><input className="w-28 rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-[10px] text-white" placeholder="Counter $" value={counterAmounts[offer.id] ?? ""} onChange={(event) => setCounterAmounts({ ...counterAmounts, [offer.id]: event.target.value })} /><button className="rounded-lg border border-amber-300/20 px-3 py-2 text-[10px] font-extrabold text-amber-100" onClick={() => counterOffer(offer)}>Counter</button></div>}{offer.status === "sent" && sender && <button className="mt-3 rounded-lg border border-white/10 px-3 py-2 text-[10px] font-extrabold text-white/60" onClick={() => decideOffer(offer, "withdrawn")}>Withdraw</button>}{offer.status === "accepted" && owner && <button className="mt-3 rounded-lg bg-cyan-300 px-3 py-2 text-[10px] font-extrabold text-slate-950" onClick={() => reserveOffer(offer.id)}>Reserve capacity</button>}</div>})}</div></div>

      <div className="rounded-[1.7rem] border border-white/10 bg-white/[.035] p-5"><div className="flex items-center gap-3"><CircleDollarSign className="size-5 text-emerald-200" /><h2 className="text-xl font-black text-white">Earnings & obligations</h2></div><div className="mt-4 space-y-3">{board.obligations.length === 0 && <p className="text-xs text-white/40">No financial obligations allocated yet.</p>}{board.obligations.map((line) => <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 p-3" key={line.id}><div><Pill value={line.status} /><p className="mt-2 text-xs font-extrabold text-white">{label(line.obligationType)}</p><p className="mt-1 text-[9px] text-white/35">{line.beneficiaryName ?? (line.beneficiaryType === "platform" ? "Klinikos" : "Organization")}</p></div><p className="text-base font-black text-emerald-100">{money(line.amountCents)}</p></div>)}</div></div>
    </section>

    <section className="rounded-[1.7rem] border border-white/10 bg-[#070b13] p-5 sm:p-6"><div className="flex items-center gap-3"><BadgeDollarSign className="size-5 text-amber-200" /><h2 className="text-xl font-black text-white">Reservations & fulfillment</h2></div><div className="mt-4 grid gap-3 xl:grid-cols-2">{board.reservations.length === 0 && <p className="text-xs text-white/40">No reservations yet.</p>}{board.reservations.map((reservation) => {const owner = reservation.ownerOrganizationId === board.organizationId;const lines = obligationsByReservation.get(reservation.id) ?? [];return <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4" key={reservation.id}><div className="flex items-start justify-between gap-3"><div><Pill value={reservation.status} /><span className="ml-2"><Pill value={reservation.fulfillmentStatus} /></span><p className="mt-2 text-sm font-extrabold text-white">{reservation.demandTitle}</p></div><p className="font-black text-white">{money(reservation.grossAmountCents)}</p></div><p className="mt-2 text-[10px] text-white/40">{when(reservation.reservedStartAt)} · payment {label(reservation.paymentStatus)}</p>{owner && reservation.paymentStatus === "manual_link_required" && <div className="mt-3 rounded-xl border border-amber-300/15 bg-amber-300/[.04] p-3"><a className="text-[10px] font-extrabold text-amber-100" href={KLINIKOS_GODADDY_PAYLINK} rel="noreferrer" target="_blank">Open GoDaddy checkout <ArrowRight className="inline size-3" /></a><div className="mt-2 flex gap-2"><input className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-[10px] text-white" placeholder="Real payment/reference" value={paymentRefs[reservation.id] ?? ""} onChange={(event) => setPaymentRefs({ ...paymentRefs, [reservation.id]: event.target.value })} /><button className="rounded-lg bg-amber-200 px-3 py-2 text-[10px] font-extrabold text-slate-950" onClick={() => recordPayment(reservation.id)}>Record evidence</button></div></div>}<div className="mt-3 flex flex-wrap gap-2">{reservation.status === "held" && reservation.fulfillmentStatus === "not_started" && <button className="rounded-lg bg-cyan-300 px-3 py-2 text-[10px] font-extrabold text-slate-950" onClick={() => fulfill(reservation.id, "checked_in")}>Check in</button>}{reservation.fulfillmentStatus === "checked_in" && <button className="rounded-lg bg-cyan-300 px-3 py-2 text-[10px] font-extrabold text-slate-950" onClick={() => fulfill(reservation.id, "in_progress")}>Start work</button>}{reservation.fulfillmentStatus === "in_progress" && <><button className="rounded-lg bg-emerald-300 px-3 py-2 text-[10px] font-extrabold text-slate-950" onClick={() => fulfill(reservation.id, "fulfilled")}>Fulfilled</button><button className="rounded-lg border border-amber-300/20 px-3 py-2 text-[10px] font-extrabold text-amber-100" onClick={() => fulfill(reservation.id, "partial")}>Partial</button><button className="rounded-lg border border-rose-300/20 px-3 py-2 text-[10px] font-extrabold text-rose-100" onClick={() => fulfill(reservation.id, "failed")}>Failed</button></>}{["checked_in", "in_progress", "fulfilled"].includes(reservation.fulfillmentStatus) && <button className="rounded-lg border border-rose-300/20 px-3 py-2 text-[10px] font-extrabold text-rose-100" onClick={() => fulfill(reservation.id, "disputed")}>Dispute</button>}{owner && reservation.fulfillmentStatus === "fulfilled" && lines.length === 0 && <button className="rounded-lg border border-emerald-300/20 px-3 py-2 text-[10px] font-extrabold text-emerald-100" onClick={() => allocate(reservation.id)}>Allocate obligations</button>}</div></div>})}</div></section>

    <div className="rounded-[1.4rem] border border-white/10 bg-white/[.035] p-4 text-[10px] leading-5 text-white/45"><Sparkles className="mr-2 inline size-4 text-cyan-200" />Current transaction command is synthetic/demo gated. Generic product, equipment, space, education, and referral demand remain discoverable through Grid, but regulated acceptance/reservation only advances when that resource class has a real policy verifier.</div>
  </div>;
}

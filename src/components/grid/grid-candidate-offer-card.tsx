"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ResourceCandidate = {
  candidateKind: "resource";
  id: string;
  organizationId: string;
  resourceType: string;
  policyClass: string;
  title: string;
  description: string;
  city: string | null;
  state: string | null;
  pricingModel: string;
  priceCents: number | null;
  capacity: number;
  score: number;
  reasons: string[];
  unresolvedRequirements: string[];
  nextGate: string;
};

type ProfessionalCandidate = {
  candidateKind: "professional";
  id: string;
  providerId: string;
  serviceListingId: string;
  providerName: string;
  providerType: string | null;
  specialty: string | null;
  serviceName: string;
  category: string;
  priceLowCents: number | null;
  priceHighCents: number | null;
  onCallNow: boolean;
  score: number;
  reasons: string[];
  nextGate: string;
};

type Candidate = ResourceCandidate | ProfessionalCandidate;

function money(cents: number | null) {
  if (cents == null) return "Quote / negotiate";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

function localValue(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function GridCandidateOfferCard({
  demandId,
  demandStatus,
  requestedStartAt,
  requestedEndAt,
  candidate,
}: {
  demandId: string;
  demandStatus: string;
  requestedStartAt: string | null;
  requestedEndAt: string | null;
  candidate: Candidate;
}) {
  const defaultAmount = candidate.candidateKind === "resource" ? candidate.priceCents : candidate.priceLowCents;
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(localValue(requestedStartAt));
  const [end, setEnd] = useState(localValue(requestedEndAt));
  const [amount, setAmount] = useState(defaultAmount == null ? "" : String(defaultAmount / 100));
  const [deposit, setDeposit] = useState("0");
  const [note, setNote] = useState("Grid offer based on the saved need and current candidate state.");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offerId, setOfferId] = useState<string | null>(null);
  const canOffer = ["open", "matched"].includes(demandStatus);

  const title = candidate.candidateKind === "resource" ? candidate.title : candidate.providerName;
  const subtitle = candidate.candidateKind === "resource"
    ? `${candidate.resourceType.replaceAll("_", " ")} · ${[candidate.city, candidate.state].filter(Boolean).join(", ") || "Location varies"}`
    : `${candidate.serviceName}${candidate.specialty ? ` · ${candidate.specialty}` : ""}`;

  async function sendOffer() {
    setError(null);
    if (!start) {
      setError("Choose the time this offer applies to.");
      return;
    }
    if (end && new Date(end) <= new Date(start)) {
      setError("Offer end time must be after the start time.");
      return;
    }
    const grossAmountCents = Math.round(Number(amount || "0") * 100);
    const depositAmountCents = Math.round(Number(deposit || "0") * 100);
    if (!Number.isFinite(grossAmountCents) || grossAmountCents < 0 || !Number.isFinite(depositAmountCents) || depositAmountCents < 0) {
      setError("Enter valid non-negative offer and deposit amounts.");
      return;
    }
    if (depositAmountCents > grossAmountCents) {
      setError("Deposit cannot exceed the offer amount.");
      return;
    }

    setBusy(true);
    try {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const body = candidate.candidateKind === "resource"
        ? {
            demandId,
            recipientOrganizationId: candidate.organizationId,
            resourceKind: candidate.resourceType,
            resourceReference: candidate.id,
            offeredStartAt: new Date(start).toISOString(),
            offeredEndAt: end ? new Date(end).toISOString() : null,
            grossAmountCents,
            depositAmountCents,
            locationPayableCents: 0,
            note,
            expiresAt,
          }
        : {
            demandId,
            providerId: candidate.providerId,
            serviceListingId: candidate.serviceListingId,
            offeredStartAt: new Date(start).toISOString(),
            offeredEndAt: end ? new Date(end).toISOString() : null,
            grossAmountCents,
            depositAmountCents,
            locationPayableCents: 0,
            note,
            expiresAt,
          };

      const response = await fetch("/api/grid/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? payload.details?.[0]?.message ?? "Grid could not send this offer.");
      if (!payload.data?.id) throw new Error("Grid did not return a usable offer reference.");
      setOfferId(payload.data.id as string);
      setOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Grid could not send this offer.");
    } finally {
      setBusy(false);
    }
  }

  return <article className="rounded-[1.45rem] border border-white/10 bg-white/[.035] p-5">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-cyan-300/20 bg-cyan-300/[.07] px-2 py-1 text-[11px] font-black uppercase tracking-[.12em] text-cyan-100">{candidate.candidateKind}</span><span className="rounded-full border border-white/10 px-2 py-1 text-[11px] font-black text-white/45">Score {candidate.score}</span></div><h3 className="mt-4 text-xl font-black text-white">{title}</h3><p className="mt-1 text-[11px] text-white/45">{subtitle}</p></div><p className="text-sm font-black text-white">{candidate.candidateKind === "resource" ? money(candidate.priceCents) : `${money(candidate.priceLowCents)}${candidate.priceHighCents != null ? ` – ${money(candidate.priceHighCents)}` : ""}`}</p></div>

    <div className="mt-4 space-y-1.5">{candidate.reasons.slice(0, 4).map((reason) => <p className="text-[12px] leading-5 text-white/45" key={reason}>• {reason}</p>)}</div>
    {candidate.candidateKind === "resource" && candidate.unresolvedRequirements.length > 0 && <p className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/[.05] px-3 py-2 text-[12px] leading-5 text-amber-100/70"><ShieldCheck className="mr-1.5 inline size-3.5" />Unresolved demand requirements remain: {candidate.unresolvedRequirements.join(", ")}</p>}
    <p className="mt-4 text-[11px] leading-4 text-white/30">{candidate.nextGate}</p>

    {offerId ? <div className="mt-5 rounded-xl border border-emerald-300/20 bg-emerald-300/[.06] p-4"><CheckCircle2 className="size-5 text-emerald-200" /><p className="mt-2 text-xs font-extrabold text-emerald-100">Offer sent. It still needs a counterparty decision before reservation.</p><Link className="mt-3 inline-flex items-center gap-2 text-[11px] font-extrabold text-cyan-200" href="/grid/transactions">Track offer <ArrowRight className="size-4" /></Link></div> : <div className="mt-5">
      {!canOffer ? <Link className="inline-flex items-center gap-2 text-xs font-extrabold text-cyan-200" href="/grid/transactions">This need already has transaction activity · open command <ArrowRight className="size-4" /></Link> : !open ? <Button onClick={() => setOpen(true)}><Send className="size-4" />Build offer</Button> : <div className="rounded-xl border border-white/10 bg-black/20 p-4"><div className="grid gap-3 sm:grid-cols-2"><label className="text-[11px] font-bold uppercase tracking-[.12em] text-white/40">Start<Input className="mt-2" type="datetime-local" value={start} onChange={(event) => setStart(event.target.value)} /></label><label className="text-[11px] font-bold uppercase tracking-[.12em] text-white/40">End<Input className="mt-2" type="datetime-local" value={end} onChange={(event) => setEnd(event.target.value)} /></label><label className="text-[11px] font-bold uppercase tracking-[.12em] text-white/40">Offer amount · USD<Input className="mt-2" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} /></label><label className="text-[11px] font-bold uppercase tracking-[.12em] text-white/40">Deposit · USD<Input className="mt-2" inputMode="decimal" value={deposit} onChange={(event) => setDeposit(event.target.value)} /></label><label className="text-[11px] font-bold uppercase tracking-[.12em] text-white/40 sm:col-span-2">Offer note<textarea className="mt-2 min-h-20 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white outline-none" value={note} onChange={(event) => setNote(event.target.value)} /></label></div>{error && <p className="mt-3 rounded-lg border border-rose-300/20 bg-rose-300/[.06] px-3 py-2 text-[12px] text-rose-100">{error}</p>}<div className="mt-4 flex flex-wrap gap-2"><Button disabled={busy} onClick={sendOffer}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}Send governed offer</Button><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button></div></div>}
    </div>}
  </article>;
}

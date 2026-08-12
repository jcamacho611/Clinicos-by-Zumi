"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Ban, Check, ShieldCheck, X } from "lucide-react";
import type { GridResourceReviewQueue } from "@/lib/grid/resource-admin-repository";

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function money(cents: number | null) {
  if (cents == null) return "Quote";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

function Status({ value }: { value: string }) {
  const good = /active|approved/i.test(value);
  const bad = /suspended|rejected/i.test(value);
  return <span className={`rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.12em] ${good ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : bad ? "border-rose-300/20 bg-rose-300/10 text-rose-100" : "border-amber-300/20 bg-amber-300/10 text-amber-100"}`}>{label(value)}</span>;
}

async function responseData(response: Response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? "Grid resource review failed.");
  return body.data;
}

export function GridResourceReviewConsole({ queue }: { queue: GridResourceReviewQueue }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ good: boolean; text: string } | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function review(resourceId: string, decision: "approved" | "rejected" | "suspended") {
    const note = notes[resourceId]?.trim() || `${label(decision)} after Klinikos Grid resource review.`;
    if (note.length < 12) {
      setMessage({ good: false, text: "Add enough review context to create a useful audit record." });
      return;
    }
    setBusy(`${resourceId}:${decision}`);
    setMessage(null);
    try {
      await responseData(await fetch(`/api/grid/admin/resources/${resourceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note }),
      }));
      setMessage({ good: true, text: `Resource review recorded as ${label(decision)}.` });
      router.refresh();
    } catch (error) {
      setMessage({ good: false, text: error instanceof Error ? error.message : "Grid resource review failed." });
    } finally {
      setBusy(null);
    }
  }

  return <div className="space-y-5">
    {message && <div className={`rounded-2xl border px-4 py-3 text-xs ${message.good ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : "border-rose-300/20 bg-rose-300/10 text-rose-100"}`}>{message.text}</div>}
    <div className="grid gap-4 xl:grid-cols-2">{queue.length === 0 && <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/[.025] p-12 text-center xl:col-span-2"><ShieldCheck className="mx-auto size-8 text-white/25" /><h2 className="mt-4 text-lg font-black text-white">No resources are waiting for review.</h2><p className="mt-2 text-xs text-white/40">New universal supply appears here after the owner submits it.</p></div>}{queue.map((resource) => {const pending = resource.reviewStatus === "in_review" && resource.status === "pending_review";const active = resource.status === "active";return <article className="rounded-[1.6rem] border border-white/10 bg-white/[.035] p-5" key={resource.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap gap-2"><Status value={resource.status} /><Status value={resource.reviewStatus} /></div><h2 className="mt-3 text-lg font-black text-white">{resource.title}</h2><p className="mt-1 text-[10px] text-white/40">{resource.organizationName} · {label(resource.resourceType)} · {label(resource.policyClass)}</p></div><div className="text-right"><p className="text-base font-black text-cyan-100">{money(resource.priceCents)}</p><p className="mt-1 text-[9px] text-white/30">Capacity {resource.capacity}</p></div></div><p className="mt-3 text-[10px] leading-5 text-white/45">{resource.description}</p><div className="mt-4 grid grid-cols-3 gap-2 text-[9px] text-white/35"><div><span className="block uppercase tracking-[.1em]">Visibility</span><strong className="mt-1 block text-white/60">{label(resource.visibility)}</strong></div><div><span className="block uppercase tracking-[.1em]">Where</span><strong className="mt-1 block text-white/60">{[resource.city, resource.state].filter(Boolean).join(", ") || "Flexible"}</strong></div><div><span className="block uppercase tracking-[.1em]">Availability</span><strong className="mt-1 block text-white/60">{resource.availability.length} window{resource.availability.length === 1 ? "" : "s"}</strong></div></div><textarea className="mt-4 min-h-20 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs text-white" placeholder="Review note / evidence summary" value={notes[resource.id] ?? ""} onChange={(event) => setNotes({ ...notes, [resource.id]: event.target.value })} />{pending && <div className="mt-3 flex flex-wrap gap-2"><button className="rounded-lg bg-emerald-300 px-3 py-2 text-[10px] font-extrabold text-slate-950" disabled={busy !== null} onClick={() => review(resource.id, "approved")}><Check className="mr-1 inline size-3" />Approve</button><button className="rounded-lg border border-rose-300/20 px-3 py-2 text-[10px] font-extrabold text-rose-100" disabled={busy !== null} onClick={() => review(resource.id, "rejected")}><X className="mr-1 inline size-3" />Reject</button></div>}{active && <button className="mt-3 rounded-lg border border-rose-300/20 px-3 py-2 text-[10px] font-extrabold text-rose-100" disabled={busy !== null} onClick={() => review(resource.id, "suspended")}><Ban className="mr-1 inline size-3" />Suspend resource</button>}</article>})}</div>
    <div className="rounded-[1.4rem] border border-amber-300/10 bg-amber-300/[.04] p-4 text-[10px] leading-5 text-amber-100/60"><ShieldCheck className="mr-2 inline size-4" /><strong className="text-amber-100">Review does not erase class rules.</strong> A reviewer still cannot activate regulated products or generic clinical services because those policy classes require their own dedicated transaction verifier.</div>
  </div>;
}

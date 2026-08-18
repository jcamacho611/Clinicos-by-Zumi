"use client";

import { useMemo, useState } from "react";
import { Check, FilePenLine, LoaderCircle, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { KnowledgeItemView } from "@/lib/repositories/knowledge-repository";
import { knowledgeLayerLabel } from "@/lib/knowledge-rules";

function fieldClassName() {
  return "min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100";
}

async function request(url: string, body: unknown) {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Knowledge action failed.");
}

export function KnowledgeCreateAction({ enabled }: { enabled: boolean }) {
  const [layer, setLayer] = useState("organization");
  const [title, setTitle] = useState("Approved clinic guidance");
  const [sourceName, setSourceName] = useState("Clinic policy team");
  const [content, setContent] = useState("Describe the administrative guidance and the human reviewer who remains accountable for interpretation.");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    setBusy(true); setError(null);
    try { await request("/api/knowledge", { layer, title, sourceName, content }); window.location.reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Knowledge creation failed."); }
    finally { setBusy(false); }
  }
  if (!enabled) return <p className="p-5 text-xs text-slate-500">Your role can read governed knowledge but cannot submit a new source.</p>;
  return <div className="space-y-3 p-5"><div className="grid gap-3 sm:grid-cols-2"><select aria-label="Knowledge layer" className={fieldClassName()} onChange={(event) => setLayer(event.target.value)} value={layer}><option value="trusted_reference">Trusted reference</option><option value="network_approved">Network approved</option><option value="organization">Organization policy</option></select><Input aria-label="Knowledge source" onChange={(event) => setSourceName(event.target.value)} placeholder="Source or publisher" value={sourceName} /></div><Input aria-label="Knowledge title" onChange={(event) => setTitle(event.target.value)} placeholder="Title" value={title} /><textarea aria-label="Knowledge content" className={`${fieldClassName()} min-h-28`} onChange={(event) => setContent(event.target.value)} value={content} /><div className="flex items-center justify-between gap-3"><p className="text-[12px] leading-5 text-slate-400">New sources remain draft until an authorized reviewer approves them.</p><Button disabled={busy || title.trim().length < 8 || content.trim().length < 20 || sourceName.trim().length < 3} onClick={submit} size="sm" variant="primary">{busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <FilePenLine className="size-3.5" />} Save draft</Button></div>{error && <p className="text-[12px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}

export function KnowledgeReviewActions({ item, enabled }: { item: KnowledgeItemView; enabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function review(action: "approve" | "reject" | "rollback") {
    setBusy(true); setError(null);
    try { await request(`/api/knowledge/${item.id}/review`, { action, notes: action === "approve" ? "Authorized reviewer checked source, dates, scope, and human interpretation boundary." : action === "reject" ? "Source requires correction before it can be used in a governed workflow." : "Authorized reviewer restored the previous approved knowledge version." }); window.location.reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Knowledge review failed."); }
    finally { setBusy(false); }
  }
  if (!enabled || !["draft", "approved", "approved_demo"].includes(item.status)) return null;
  return <div className="mt-3 flex flex-wrap items-center gap-2"><Button disabled={busy} onClick={() => review("approve")} size="sm" variant="secondary"><Check className="size-3.5" /> Approve</Button><Button disabled={busy} onClick={() => review("reject")} size="sm" variant="ghost"><X className="size-3.5" /> Reject</Button>{item.supersedesId && <Button disabled={busy} onClick={() => review("rollback")} size="sm" variant="ghost">Rollback</Button>}{error && <p className="basis-full text-[12px] font-bold text-rose-600" role="alert">{error}</p>}</div>;
}

export function KnowledgeCorrectionAction({ item, enabled }: { item: KnowledgeItemView; enabled: boolean }) {
  const [content, setContent] = useState(item.content);
  const [notes, setNotes] = useState("Correction submitted for source and clinical reviewer validation.");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function correct() {
    setBusy(true); setError(null);
    try { await request(`/api/knowledge/${item.id}/correct`, { title: item.title, content, sourceName: item.sourceName, sourceUrl: item.sourceUrl, sourceDate: item.sourceDate, effectiveAt: item.effectiveAt, expiresAt: item.expiresAt, notes }); window.location.reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Knowledge correction failed."); }
    finally { setBusy(false); }
  }
  if (!enabled || !["approved", "approved_demo"].includes(item.status)) return null;
  return <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3"><summary className="cursor-pointer text-[12px] font-extrabold text-slate-700">Submit correction</summary><div className="mt-3 space-y-2"><textarea aria-label={`Correction for ${item.title}`} className={`${fieldClassName()} min-h-24`} onChange={(event) => setContent(event.target.value)} value={content} /><Input aria-label="Correction notes" onChange={(event) => setNotes(event.target.value)} value={notes} /><Button disabled={busy || content.trim().length < 20 || notes.trim().length < 12} onClick={correct} size="sm" variant="secondary">{busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <FilePenLine className="size-3.5" />} Create reviewed version</Button>{error && <p className="text-[12px] font-bold text-rose-600" role="alert">{error}</p>}</div></details>;
}

export function KnowledgeSearch({ items, canReview, canCorrect }: { items: KnowledgeItemView[]; canReview: boolean; canCorrect: boolean }) {
  const [query, setQuery] = useState("");
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? items.filter((item) => [item.title, item.content, item.sourceName, item.layer].some((value) => value.toLowerCase().includes(needle))) : items;
  }, [items, query]);
  return <div><div className="border-b border-slate-100 p-4"><div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3"><Search className="size-4 text-slate-400" /><Input aria-label="Search governed knowledge" className="border-0 px-2 shadow-none focus:ring-0" onChange={(event) => setQuery(event.target.value)} placeholder="Search sources, topics, or policy language" value={query} /></div><p className="mt-2 text-[12px] text-slate-400">{matches.length} result{matches.length === 1 ? "" : "s"} · approved content is retrieval-eligible; drafts never become clinical authority.</p></div><div className="divide-y divide-slate-100">{matches.map((item) => <article className="p-5" key={item.id}><div className="flex flex-wrap items-start gap-2"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="text-sm font-extrabold text-slate-950">{item.title}</h4><span className="rounded-full bg-sky-50 px-2 py-1 text-[11px] font-bold capitalize text-sky-700">{knowledgeLayerLabel(item.layer)}</span></div><p className="mt-1 text-[12px] text-slate-400">Version {item.version} · Source: {item.sourceName}{item.sourceDate ? ` · Published ${new Date(item.sourceDate).toLocaleDateString()}` : ""}</p></div><span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold capitalize text-slate-600">{item.status.replaceAll("_", " ")}</span></div><p className="mt-4 rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-700">{item.content}</p><div className="mt-3 flex flex-wrap gap-2 text-[12px] text-slate-500"><span>Effective: {item.effectiveAt ? new Date(item.effectiveAt).toLocaleDateString() : "Not set"}</span><span>·</span><span>Expires: {item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : "No expiry"}</span>{item.sourceUrl && <><span>·</span><a className="font-bold text-sky-700 underline" href={item.sourceUrl} rel="noreferrer" target="_blank">Citation</a></>}</div>{item.latestReview && <p className="mt-3 text-[12px] text-slate-500">Last review: {item.latestReview.decision.replaceAll("_", " ")} · {item.latestReview.notes}</p>}<KnowledgeReviewActions enabled={canReview} item={item} /><KnowledgeCorrectionAction enabled={canCorrect} item={item} /></article>)}{!matches.length && <p className="p-6 text-xs text-slate-500">No knowledge matched that search.</p>}</div></div>;
}
